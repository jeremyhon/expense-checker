import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import {
  type AIExpenseInput,
  createAiExpenseSchema,
} from "@/lib/types/expense";

/**
 * Generate dynamic AI prompt for expense extraction from PDF statements
 */
function generateExpenseExtractionPrompt(userCategories: string[]): string {
  const categoriesText = userCategories.join(", ");

  return `You are a financial data extraction expert. Analyze this bank statement PDF and extract ALL transaction expenses (outgoing payments, purchases, debits).

WHAT TO INCLUDE:
- Purchases from merchants, stores, restaurants
- Bill payments (utilities, phone, insurance)
- ATM withdrawals and bank fees
- Subscription services
- Online purchases and payments
- Foreign currency transactions

WHAT TO EXCLUDE:
- Deposits, credits, salary payments (money coming in)
- Transfers between accounts (containing: "Transfer", "TRANSFER", "Tfr", "TFR", "To:", "From:", "Savings", "Investment", "Own Account")
- Interest earned or dividends
- Refunds or reversals (unless they represent a net expense)
- Duplicate transactions or pending transactions

EXTRACTION FORMAT:
1. date: Use YYYY-MM-DD format, extract the posted/cleared date (not pending)
2. description: Keep concise but informative (e.g., "Coffee purchase" not "VISA PURCHASE 123456"),
3. merchant: Clean up names by removing unnecessary codes, reference numbers, and extra whitespace
4. category: Use one of these categories: ${categoriesText}; if uncertain, use "Other"
5. original_amount: The amount of the transaction before any currency conversion
6. original_currency: The original 3-letter currency code (e.g., SGD, USD). If not shown, use SGD.

QUALITY CHECKS:
- Verify each transaction is a genuine expense (money leaving the account)
- Ensure dates are valid and properly formatted
- Check that amounts are reasonable and positive
- Confirm currency codes are valid 3-letter codes (SGD, USD, EUR, etc.)
- Validate categories match the available options exactly`;
}

/**
 * Process PDF buffer and extract expenses using AI
 * @param fileBuffer - PDF file buffer
 * @param userCategories - User's custom categories
 * @returns AsyncGenerator<ExpenseInput> - Stream of extracted expenses
 */
export async function* extractExpensesFromPdf(
  fileBuffer: Buffer,
  userCategories: string[]
): AsyncGenerator<AIExpenseInput, void, unknown> {
  const base64Pdf = fileBuffer.toString("base64");
  const prompt = generateExpenseExtractionPrompt(userCategories);

  try {
    const { elementStream } = streamObject({
      model: google("gemini-2.5-flash"),
      output: "array",
      schema: createAiExpenseSchema(userCategories),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
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

    for await (const element of elementStream) {
      if (element) {
        yield element as AIExpenseInput;
      }
    }
  } catch (error) {
    console.error("❌ Error in AI extraction:", error);
    throw error;
  }
}
