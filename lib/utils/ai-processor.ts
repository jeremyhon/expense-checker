import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { type AIExpenseInput, aiExpenseSchema } from "@/lib/types/expense";

/**
 * AI prompt for expense extraction from PDF statements
 */
const EXPENSE_EXTRACTION_PROMPT = `You are a financial data extraction expert. Analyze this bank statement PDF and extract ALL transaction expenses (outgoing payments, purchases, debits).

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

EXTRACTION RULES:
1. Date: Use YYYY-MM-DD format, extract the posted/cleared date (not pending)
2. Amount: Always positive numbers, use the debited amount
3. Currency: For SGD transactions, set both original_amount and amount_sgd to the same value
4. For foreign transactions: Extract both amounts only if both are clearly shown on the statement
5. Merchant: Clean up names by removing unnecessary codes, reference numbers, and extra whitespace
6. Description: Keep concise but informative (e.g., "Coffee purchase" not "VISA PURCHASE 123456")

CATEGORIZATION RULES:
- Food & Drink: Restaurants, cafes, food delivery, groceries for meals
- Transport: Public transport, taxis, ride-sharing, fuel, parking
- Shopping: Retail purchases, clothing, electronics, general merchandise
- Groceries: Supermarkets, grocery stores, household supplies
- Entertainment: Movies, games, streaming, events, hobbies
- Bills: Utilities, phone, internet, insurance, subscriptions
- Health: Medical, dental, pharmacy, fitness, wellness
- Travel: Foreign transactions, hotels, flights, travel-related expenses
- Other: Miscellaneous expenses that don't fit other categories

QUALITY CHECKS:
- Verify each transaction is a genuine expense (money leaving the account)
- Ensure dates are valid and properly formatted
- Check that amounts are reasonable and positive
- Confirm currency codes are valid 3-letter codes (SGD, USD, EUR, etc.)
- Validate categories match the available options exactly

Available categories: Food & Drink, Transport, Shopping, Groceries, Entertainment, Bills, Health, Travel, Other`;

/**
 * Process PDF buffer and extract expenses using AI
 * @param fileBuffer - PDF file buffer
 * @returns AsyncGenerator<ExpenseInput> - Stream of extracted expenses
 */
export async function* extractExpensesFromPdf(
  fileBuffer: Buffer
): AsyncGenerator<AIExpenseInput, void, unknown> {
  const base64Pdf = fileBuffer.toString("base64");

  const { elementStream } = streamObject({
    model: google("gemini-2.5-flash"),
    output: "array",
    schema: aiExpenseSchema,
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
