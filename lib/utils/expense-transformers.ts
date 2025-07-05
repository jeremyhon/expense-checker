import { z } from "zod";
import type {
  AIExpenseInput,
  DisplayExpense,
  ExpenseInsertData,
} from "@/lib/types/expense";
import {
  databaseExpenseRowSchema,
  displayExpenseSchema,
  expenseInsertDataSchema,
} from "@/lib/types/expense";

/**
 * Transform database row to display format with validation
 */
export function transformDbRowToDisplay(row: unknown): DisplayExpense {
  // First validate the input matches database row schema
  const validatedRow = databaseExpenseRowSchema.parse(row);

  // Transform to display format
  const displayData = {
    id: validatedRow.id,
    date: validatedRow.date,
    description: validatedRow.description,
    merchant: validatedRow.merchant || "",
    category: validatedRow.category,
    amount: Number.parseFloat(validatedRow.amount_sgd),
    originalAmount: Number.parseFloat(
      validatedRow.original_amount || validatedRow.amount_sgd
    ),
    originalCurrency: validatedRow.original_currency || validatedRow.currency,
    currency: "SGD",
  };

  // Validate the transformed data
  return displayExpenseSchema.parse(displayData);
}

/**
 * Transform AI expense input to database insert format
 */
export function transformAIInputToInsert(
  aiInput: AIExpenseInput,
  statementId: string,
  userId: string,
  convertedAmountSgd: number,
  lineHash: string
): ExpenseInsertData {
  const insertData = {
    statement_id: statementId,
    user_id: userId,
    date: aiInput.date,
    description: aiInput.description,
    merchant: aiInput.merchant,
    amount_sgd: aiInput.amount_sgd || convertedAmountSgd,
    original_amount: aiInput.original_amount,
    original_currency: aiInput.original_currency,
    currency: aiInput.original_currency,
    category: aiInput.original_currency !== "SGD" ? "Travel" : aiInput.category,
    line_hash: lineHash,
  };

  // Validate the transformed data
  return expenseInsertDataSchema.parse(insertData);
}

/**
 * Validate expense insert data before database operation
 */
export function validateExpenseInsert(data: unknown): ExpenseInsertData {
  try {
    return expenseInsertDataSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Expense insert validation failed:", {
        errors: error.errors,
        data,
      });
      throw new Error(
        `Invalid expense insert data: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }
    throw error;
  }
}

/**
 * Transform array of database rows to display format
 */
export function transformDbRowsToDisplay(rows: unknown[]): DisplayExpense[] {
  return rows.map((row, index) => {
    try {
      return transformDbRowToDisplay(row);
    } catch (error) {
      console.error(`Failed to transform expense at index ${index}:`, error);
      throw new Error(
        `Failed to transform expense at index ${index}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  });
}
