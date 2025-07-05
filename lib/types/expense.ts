import { z } from "zod";

/**
 * Expense categories available in the system
 */
export const EXPENSE_CATEGORIES = [
  "Food & Drink",
  "Transport",
  "Shopping",
  "Groceries",
  "Entertainment",
  "Bills",
  "Health",
  "Travel",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/**
 * Schema for an individual expense, used by the AI model
 */
export const expenseSchema = z.object({
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
  category: z.enum(EXPENSE_CATEGORIES).describe("The category of the expense."),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

/**
 * Expense data structure for database insertion
 */
export interface ExpenseRecord {
  statement_id: string;
  user_id: string;
  date: string;
  description: string;
  merchant: string;
  amount_sgd: number;
  original_amount: number;
  original_currency: string;
  currency: string;
  category: string;
  line_hash: string;
}

/**
 * Result of uploading a statement
 */
export interface UploadResult {
  success: boolean;
  message: string;
}

/**
 * Statement processing status
 */
export type StatementStatus = "processing" | "completed" | "failed";

/**
 * Expense as returned from database queries (Supabase realtime payload)
 */
export interface ExpenseDatabaseRow {
  id: string;
  description: string;
  merchant: string | null;
  category: string;
  amount_sgd: string;
  date: string;
  original_amount: string | null;
  original_currency: string | null;
  currency: string;
  statement_id?: string;
  user_id?: string;
  line_hash?: string;
  created_at?: string;
}
