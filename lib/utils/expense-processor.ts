import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type {
  AIExpenseInput,
  ExpenseInsertData,
  StatementStatus,
} from "@/lib/types/expense";
import { extractExpensesFromPdf } from "@/lib/utils/ai-processor";
import { convertToSGD } from "@/lib/utils/currency";
import {
  transformAIInputToInsert,
  validateExpenseInsert,
} from "@/lib/utils/expense-transformers";
import { getMerchantMapping } from "@/lib/utils/merchant-mappings";

/**
 * Create a hash for expense deduplication
 */
function createExpenseHash(
  date: string,
  description: string,
  amount: number
): string {
  return crypto
    .createHash("sha256")
    .update(`${date}-${description}-${amount}`)
    .digest("hex");
}

/**
 * Convert expense input to database record with validation
 */
async function convertExpenseToRecord(
  expense: AIExpenseInput,
  statementId: string,
  userId: string
): Promise<ExpenseInsertData> {
  const currencyResult = await convertToSGD(
    expense.original_amount,
    expense.original_currency,
    expense.date
  );

  const amountSgd = expense.amount_sgd || currencyResult.convertedAmount;
  const lineHash = createExpenseHash(
    expense.date,
    expense.description,
    amountSgd
  );

  // Check for existing merchant mapping and override category if found
  let finalCategory = expense.category;
  if (expense.merchant) {
    const merchantMapping = await getMerchantMapping(userId, expense.merchant);
    if (merchantMapping) {
      finalCategory = merchantMapping.category;
    }
  }

  // Create expense with potentially overridden category
  const expenseWithMapping = {
    ...expense,
    category: finalCategory,
  };

  // Use transformer with validation
  return transformAIInputToInsert(
    expenseWithMapping,
    statementId,
    userId,
    amountSgd,
    lineHash
  );
}

/**
 * Insert expense record into database with validation
 */
async function insertExpenseRecord(
  supabase: SupabaseClient,
  expenseRecord: ExpenseInsertData
): Promise<boolean> {
  // Validate before inserting
  const validatedRecord = validateExpenseInsert(expenseRecord);

  const { error } = await supabase
    .from("expenses")
    .insert([validatedRecord])
    .select();

  if (error && error.code !== "23505") {
    console.warn("Failed to insert expense:", error.message);
    return false;
  }

  return true;
}

/**
 * Update statement status in database
 */
async function updateStatementStatus(
  supabase: SupabaseClient,
  statementId: string,
  status: StatementStatus
): Promise<void> {
  await supabase.from("statements").update({ status }).eq("id", statementId);
}

/**
 * Process PDF and extract expenses with real-time insertion
 */
export async function processPdfExpenses(
  fileBuffer: Buffer,
  statementId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();
  let expenseCount = 0;

  try {
    // Extract expenses from PDF using AI
    for await (const expense of extractExpensesFromPdf(fileBuffer)) {
      expenseCount++;

      // Convert to database record
      const expenseRecord = await convertExpenseToRecord(
        expense,
        statementId,
        userId
      );

      // Insert immediately for real-time processing
      await insertExpenseRecord(supabase, expenseRecord);
    }

    if (expenseCount === 0) {
      throw new Error("AI failed to extract any transactions.");
    }

    console.log(
      `Successfully processed ${expenseCount} expenses from statement ${statementId}`
    );

    // Mark statement as completed
    await updateStatementStatus(supabase, statementId, "completed");
  } catch (error) {
    console.error(`Processing failed for statement ${statementId}:`, error);
    await updateStatementStatus(supabase, statementId, "failed");
    throw error;
  }
}
