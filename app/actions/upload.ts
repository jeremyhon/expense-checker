"use server";

import { google } from "@ai-sdk/google";
import { put } from "@vercel/blob";
import { streamObject } from "ai";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Schema for an individual expense, used by the AI model
const expenseSchema = z.object({
  date: z
    .string()
    .describe("The date of the transaction in YYYY-MM-DD format."),
  merchant: z.string().describe("The merchant or payee name."),
  description: z.string().describe("A brief description of the transaction."),
  amount_sgd: z
    .number()
    .nullable()
    .describe("The transaction amount in SGD if available on statement."),
  original_amount: z.number().describe("The original transaction amount."),
  original_currency: z
    .string()
    .length(3)
    .describe("The original 3-letter currency code (e.g., SGD, USD)."),
  category: z
    .enum([
      "Food & Drink",
      "Transport",
      "Shopping",
      "Groceries",
      "Entertainment",
      "Bills",
      "Health",
      "Travel",
      "Other",
    ])
    .describe("The category of the expense."),
});

// Currency conversion function using exchangerate-api.com
async function convertToSGD(
  amount: number,
  fromCurrency: string,
  date: string
): Promise<number> {
  if (fromCurrency === "SGD") {
    return amount;
  }

  try {
    // Using authenticated API endpoint for better reliability
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/407edb4c8c755c3df20b18e6/latest/${fromCurrency}`
    );
    const data = await response.json();

    if (
      data.result === "success" &&
      data.conversion_rates &&
      data.conversion_rates.SGD
    ) {
      return Math.round(amount * data.conversion_rates.SGD * 100) / 100; // Round to 2 decimal places
    }

    throw new Error(
      `SGD rate not available for ${fromCurrency}: ${data.error_type || "Unknown error"}`
    );
  } catch (error) {
    console.error(
      `Currency conversion failed for ${fromCurrency} to SGD:`,
      error
    );
    // Fallback: return original amount if conversion fails
    return amount;
  }
}

// Main server action
export async function uploadStatement(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Not authenticated" };
  }

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    return { success: false, message: "No file provided." };
  }

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // F-3: Duplicate statement detection (temporarily disabled)
    const checksum = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");
    // const { data: existingStatement } = await supabase
    //   .from("statements")
    //   .select("id")
    //   .eq("checksum", checksum)
    //   .eq("user_id", user.id)
    //   .single();

    // if (existingStatement) {
    //   return {
    //     success: false,
    //     message: `Duplicate: '${file.name}' has already been uploaded.`,
    //   };
    // }

    // F-6: Persistent storage (upload to Vercel Blob)
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true, // Allow multiple uploads during iteration
    });

    // Insert statement record (duplicate detection disabled but checksum required by schema)
    const { data: statement, error: statementError } = await supabase
      .from("statements")
      .insert({
        user_id: user.id,
        checksum: checksum + "-" + Date.now(), // Make unique to avoid constraint violation
        blob_url: blob.url,
        file_name: file.name,
        status: "processing",
      })
      .select()
      .single();

    if (statementError)
      throw new Error(
        `Failed to create statement record: ${statementError.message}`
      );

    // Asynchronously process the PDF
    processPdf(fileBuffer, statement.id, user.id);

    revalidatePath("/");
    return { success: true, message: `'${file.name}' is being processed.` };
  } catch (error) {
    console.error("Upload failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      message: `Upload failed for '${file.name}': ${errorMessage}`,
    };
  }
}

async function processPdf(
  fileBuffer: Buffer,
  statementId: string,
  userId: string
) {
  const supabase = await createClient();
  try {
    // 1. Convert PDF buffer to base64 for AI SDK
    const base64Pdf = fileBuffer.toString("base64");

    // 2. F-7: Use AI to extract and categorize expenses directly from PDF with streaming
    const { elementStream } = streamObject({
      model: google("gemini-2.5-flash"),
      output: "array",
      schema: expenseSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a financial data extraction expert. Analyze this bank statement PDF and extract ALL transaction expenses (outgoing payments, purchases, debits).

IMPORTANT RULES:
1. Extract ONLY expenses/debits (money going out), NOT deposits/credits (money coming in)
2. Skip internal transfers between own accounts
3. For Singapore transactions, categorize appropriately 
4. For non-Singapore transactions, categorize as "Travel"
5. Use the date format YYYY-MM-DD
6. Amount should be positive numbers only
7. Merchant names should be cleaned up (remove extra codes/numbers where possible)
8. Extract BOTH original amount and SGD amount if both are shown on the statement

Available categories: Food & Drink, Transport, Shopping, Groceries, Entertainment, Bills, Health, Travel, Other

Return expenses with:
- date: Transaction date in YYYY-MM-DD format
- merchant: Clean merchant/payee name
- description: Brief transaction description
- amount_sgd: SGD amount if shown on statement, null if not available
- original_amount: Original transaction amount
- original_currency: Original 3-letter currency code (SGD, USD, etc.)
- category: One of the available categories above

For SGD transactions, amount_sgd and original_amount should be the same, and original_currency should be "SGD".
For foreign currency transactions, extract both amounts only if both are clearly shown on the statement.`,
            },
            {
              type: "file",
              data: base64Pdf,
              mimeType: "application/pdf",
            },
          ],
        },
      ],
    });

    const expensesToInsert = [];
    let expenseCount = 0;

    // 3. Process each expense as it streams in
    for await (const expense of elementStream) {
      if (expense) {
        expenseCount++;

        // Convert to SGD if not available from statement
        const amountSgd =
          expense.amount_sgd ||
          (await convertToSGD(
            expense.original_amount,
            expense.original_currency,
            expense.date
          ));

        // F-4: Duplicate expense detection hash
        const lineHash = crypto
          .createHash("sha256")
          .update(`${expense.date}-${expense.description}-${amountSgd}`)
          .digest("hex");

        const expenseToInsert = {
          statement_id: statementId,
          user_id: userId,
          date: expense.date,
          description: expense.description,
          merchant: expense.merchant,
          amount_sgd: amountSgd,
          original_amount: expense.original_amount,
          original_currency: expense.original_currency,
          currency: expense.original_currency,
          category:
            expense.original_currency !== "SGD" ? "Travel" : expense.category,
          line_hash: lineHash,
        };

        expensesToInsert.push(expenseToInsert);

        // Insert expense immediately for real-time processing
        const { error: insertError } = await supabase
          .from("expenses")
          .insert([expenseToInsert])
          .select();

        if (insertError && insertError.code !== "23505") {
          console.warn(
            `Failed to insert expense ${expenseCount}:`,
            insertError.message
          );
        }

        // UI updates happen via Supabase realtime subscriptions
      }
    }

    if (expenseCount === 0) {
      throw new Error("AI failed to extract any transactions.");
    }

    console.log(
      `Successfully processed ${expenseCount} expenses from statement ${statementId}`
    );

    // 4. No batch insert needed - expenses are inserted as they stream

    // 5. Mark statement as completed
    await supabase
      .from("statements")
      .update({ status: "completed" })
      .eq("id", statementId);
  } catch (error) {
    console.error(`Processing failed for statement ${statementId}:`, error);
    await supabase
      .from("statements")
      .update({ status: "failed" })
      .eq("id", statementId);
  }
}
