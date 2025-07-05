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
 * Core expense data fields shared across all use cases
 */
export const baseExpenseSchema = z.object({
  date: z.string().date("Date must be in YYYY-MM-DD format"),
  description: z.string().min(1, "Description is required"),
  merchant: z.string().min(1, "Merchant is required"),
  category: z.enum(EXPENSE_CATEGORIES),
  amount_sgd: z.number().positive("Amount must be positive"),
  original_amount: z.number().positive("Original amount must be positive"),
  original_currency: z.string().length(3, "Currency must be 3 characters"),
});

export type BaseExpense = z.infer<typeof baseExpenseSchema>;

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
 * Database expense record with all metadata
 */
export const databaseExpenseSchema = baseExpenseSchema.extend({
  id: z.string().uuid("ID must be a valid UUID"),
  statement_id: z.string().uuid("Statement ID must be a valid UUID"),
  user_id: z.string().uuid("User ID must be a valid UUID"),
  created_at: z.string().datetime("Created at must be a valid datetime"),
  currency: z.string().length(3, "Currency must be 3 characters"),
  line_hash: z.string().min(1, "Line hash is required"),
});

export type DatabaseExpense = z.infer<typeof databaseExpenseSchema>;

/**
 * Database query result (fields come as strings from Supabase)
 */
export const databaseExpenseRowSchema = z.object({
  id: z.string().uuid(),
  statement_id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  date: z.string().date(),
  description: z.string().min(1),
  merchant: z.string().nullable(),
  category: z.enum(EXPENSE_CATEGORIES),
  amount_sgd: z.string(),
  original_amount: z.string().nullable(),
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

// Legacy exports for backward compatibility (to be removed after migration)
export const expenseSchema = aiExpenseSchema;
export type ExpenseInput = AIExpenseInput;
export type ExpenseRecord = ExpenseInsertData;
export type ExpenseDatabaseRow = DatabaseExpenseRow;
