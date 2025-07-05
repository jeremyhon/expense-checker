import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Other",
] as const;

export const CURRENCIES = [
  "SGD",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "JPY",
  "CNY",
  "HKD",
  "MYR",
  "THB",
  "IDR",
  "PHP",
  "VND",
  "KRW",
  "TWD",
  "INR",
] as const;

export type Currency = (typeof CURRENCIES)[number];

// Zod schemas for validation
export const databaseExpenseRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  statement_id: z.string().uuid(),
  created_at: z.string(),
  date: z.string(),
  description: z.string(),
  amount_sgd: z.number(),
  currency: z.string().default("SGD"),
  foreign_amount: z.number().nullable(),
  foreign_currency: z.string().nullable(),
  original_amount: z.number().nullable(),
  original_currency: z.string().nullable(),
  merchant: z.string().nullable(),
  category: z.string(),
  line_hash: z.string(),
});

export const displayExpenseSchema = z.object({
  id: z.string().uuid(),
  date: z.string(),
  description: z.string(),
  merchant: z.string(),
  category: z.string(),
  amount: z.number(),
  originalAmount: z.number(),
  originalCurrency: z.string(),
  currency: z.string(),
  createdAt: z.string(),
});

export const aiExpenseSchema = z.object({
  date: z.string(),
  description: z.string(),
  merchant: z.string(),
  category: z.string(),
  original_amount: z.number(),
  original_currency: z.string(),
  amount_sgd: z.number().optional(),
});

export const expenseInsertDataSchema = z.object({
  statement_id: z.string().uuid(),
  user_id: z.string().uuid(),
  date: z.string(),
  description: z.string(),
  merchant: z.string().optional(),
  amount_sgd: z.number(),
  original_amount: z.number(),
  original_currency: z.string(),
  currency: z.string(),
  category: z.string(),
  line_hash: z.string(),
});

// Display format (camelCase for frontend)
export interface DisplayExpense {
  id: string;
  date: string;
  description: string;
  merchant: string;
  category: string;
  amount: number;
  originalAmount: number;
  originalCurrency: string;
  currency: string;
  createdAt: string;
}

// Display expense with duplicate flag for table
export interface DisplayExpenseWithDuplicate extends DisplayExpense {
  isDuplicate: boolean;
}

// AI input type
export interface AIExpenseInput {
  date: string;
  description: string;
  merchant: string;
  category: string;
  original_amount: number;
  original_currency: string;
  amount_sgd?: number;
}

// Database insert type
export interface ExpenseInsertData {
  statement_id: string;
  user_id: string;
  date: string;
  description: string;
  merchant?: string;
  amount_sgd: number;
  original_amount: number;
  original_currency: string;
  currency: string;
  category: string;
  line_hash: string;
}

// Statement status for upload functionality
export type StatementStatus = "processing" | "completed" | "failed";

// Upload result type
export interface UploadResult {
  success: boolean;
  error?: string;
  message?: string;
  statementId?: string;
}

// Form data types
export interface ExpenseFormData {
  description: string;
  merchant: string;
  category: string;
  amount: string;
  originalAmount: string;
  originalCurrency: string;
  date: string;
}

export interface ExpenseUpdateData {
  description: string;
  merchant: string;
  category: string;
  amount: number;
  originalAmount: number;
  originalCurrency: string;
  date: string;
}

// Realtime payload schemas for Supabase events
export const realtimeInsertPayloadSchema = databaseExpenseRowSchema;
export const realtimeUpdatePayloadSchema = databaseExpenseRowSchema
  .partial()
  .extend({
    id: z.string().uuid(), // ID is always present in updates
  });
export const realtimeDeletePayloadSchema = z.object({
  id: z.string().uuid(),
  // May include other fields that Supabase sends in DELETE events
});

// Type guards and helpers
export type DatabaseExpenseRow = z.infer<typeof databaseExpenseRowSchema>;
export type RealtimeInsertPayload = z.infer<typeof realtimeInsertPayloadSchema>;
export type RealtimeUpdatePayload = z.infer<typeof realtimeUpdatePayloadSchema>;
export type RealtimeDeletePayload = z.infer<typeof realtimeDeletePayloadSchema>;
