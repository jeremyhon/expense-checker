"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  DisplayExpenseWithDuplicate,
  ExpenseUpdateData,
} from "@/lib/types/expense";
import { transformDatabaseRowsToDisplay } from "@/lib/utils/display-transformers";

export async function getExpenses(): Promise<{
  expenses?: DisplayExpenseWithDuplicate[];
  error?: string;
}> {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Fetch all expenses for the user
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching expenses:", error);
    return { error: error.message };
  }

  // Transform database format to display format and check for duplicates
  const displayExpenses = transformDatabaseRowsToDisplay(expenses || []);

  return { expenses: displayExpenses };
}

export async function updateExpense(
  expenseId: string,
  data: ExpenseUpdateData
) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Update the expense in the database
  const { error } = await supabase
    .from("expenses")
    .update({
      description: data.description,
      merchant: data.merchant,
      category: data.category,
      amount_sgd: data.amount,
      original_amount: data.originalAmount,
      original_currency: data.originalCurrency,
      date: data.date,
    })
    .eq("id", expenseId)
    .eq("user_id", user.id); // Ensure user can only update their own expenses

  if (error) {
    console.error("Error updating expense:", error);
    return { error: error.message };
  }

  // Revalidate the page to reflect changes
  revalidatePath("/");

  return { success: true };
}

export async function deleteExpense(
  expenseId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Delete the expense from the database
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("user_id", user.id); // Ensure user can only delete their own expenses

  if (error) {
    console.error("Error deleting expense:", error);
    return { error: error.message };
  }

  // Revalidate the page to reflect changes
  revalidatePath("/");

  return { success: true };
}
