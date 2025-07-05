import { z } from "zod";

/**
 * Expense categories available in the system
 */
const EXPENSE_CATEGORIES = [
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
 * Expense data as provided by AI extraction (may have nullable SGD conversion)
 */
export const aiExpenseSchema = z.object({
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

export type AIExpenseInput = z.infer<typeof aiExpenseSchema>;

/**
 * Database query result (fields come as numbers from Supabase)
 */
export const databaseExpenseRowSchema = z.object({
  id: z.string().uuid(),
  statement_id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string(), // Supabase returns TIMESTAMPTZ as ISO string
  date: z.string().date(),
  description: z.string().min(1),
  merchant: z.string().nullable(),
  category: z.enum(EXPENSE_CATEGORIES),
  amount_sgd: z.number(), // Supabase returns NUMERIC as number
  original_amount: z.number().nullable(), // Supabase returns NUMERIC as number
  original_currency: z.string().nullable(),
  currency: z.string().length(3),
  line_hash: z.string().min(1),
});

export type DatabaseExpenseRow = z.infer<typeof databaseExpenseRowSchema>;

/**
 * Frontend-friendly expense interface with parsed numbers and camelCase
 */
export const displayExpenseSchema = z.object({
  id: z.string().uuid(),
  date: z.string().date(),
  description: z.string().min(1),
  merchant: z.string().min(1),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().positive(), // SGD amount
  originalAmount: z.number().positive(),
  originalCurrency: z.string().length(3),
  currency: z.string().length(3),
  createdAt: z.string(), // ISO string timestamp
});

export type DisplayExpense = z.infer<typeof displayExpenseSchema>;

/**
 * Expense data for database insertion
 */
export const expenseInsertDataSchema = z.object({
  statement_id: z.string().uuid(),
  user_id: z.string().uuid(),
  date: z.string().date(),
  description: z.string().min(1),
  merchant: z.string().min(1),
  amount_sgd: z.number().positive(),
  original_amount: z.number().positive(),
  original_currency: z.string().length(3),
  currency: z.string().length(3),
  category: z.enum(EXPENSE_CATEGORIES),
  line_hash: z.string().min(1),
});

export type ExpenseInsertData = z.infer<typeof expenseInsertDataSchema>;

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
