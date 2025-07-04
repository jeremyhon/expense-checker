import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { type ExpenseInput, expenseSchema } from "@/lib/types/expense";

/**
 * AI prompt for expense extraction from PDF statements
 */
const EXPENSE_EXTRACTION_PROMPT = `You are a financial data extraction expert. Analyze this bank statement PDF and extract ALL transaction expenses (outgoing payments, purchases, debits).

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
For foreign currency transactions, extract both amounts only if both are clearly shown on the statement.`;

/**
 * Process PDF buffer and extract expenses using AI
 * @param fileBuffer - PDF file buffer
 * @returns AsyncGenerator<ExpenseInput> - Stream of extracted expenses
 */
export async function* extractExpensesFromPdf(
  fileBuffer: Buffer
): AsyncGenerator<ExpenseInput, void, unknown> {
  const base64Pdf = fileBuffer.toString("base64");

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
            text: EXPENSE_EXTRACTION_PROMPT,
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

  for await (const expense of elementStream) {
    if (expense) {
      yield expense;
    }
  }
}
