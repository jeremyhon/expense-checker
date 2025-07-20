"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCategoryByName } from "@/app/actions/categories";
import { createClient } from "@/lib/supabase/server";
import type {
  DisplayExpenseWithDuplicate,
  ExpenseUpdateData,
} from "@/lib/types/expense";
import { transformDatabaseRowsToDisplay } from "@/lib/utils/display-transformers";
import {
  createMerchantMapping,
  updateAllExpensesByMerchant,
} from "@/lib/utils/merchant-mappings";
import {
  countMonthsInRange,
  dateToPlainDate,
  getDisplayMonthKey,
  plainDateFromString,
} from "@/lib/utils/temporal-dates";

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

  // Fetch all expenses for the user using the view that includes category names
  const { data: expenses, error } = await supabase
    .from("expenses_with_categories")
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

  // Get the original expense to check if category changed
  const { data: originalExpense, error: fetchError } = await supabase
    .from("expenses")
    .select("category, merchant")
    .eq("id", expenseId)
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    console.error("Error fetching original expense:", fetchError);
    return { error: "Failed to fetch original expense" };
  }

  // Get category ID for the category name
  const categoryId = await getOrCreateCategoryByName(data.category, user.id);

  // Update the expense in the database
  const { error } = await supabase
    .from("expenses")
    .update({
      description: data.description,
      merchant: data.merchant,
      category: data.category, // Keep for backward compatibility
      category_id: categoryId,
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

  // If category changed and merchant exists, create merchant mapping
  if (originalExpense.category !== data.category && data.merchant) {
    await createMerchantMapping(user.id, data.merchant, data.category);
  }

  // Revalidate the page to reflect changes
  revalidatePath("/");

  return { success: true };
}

export async function updateExpenseWithBulkMerchantUpdate(
  expenseId: string,
  data: ExpenseUpdateData,
  applyToAllMerchantExpenses = false
): Promise<{ success?: boolean; error?: string; updatedCount?: number }> {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get the original expense to check if category changed
  const { data: originalExpense, error: fetchError } = await supabase
    .from("expenses")
    .select("category, merchant")
    .eq("id", expenseId)
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    console.error("Error fetching original expense:", fetchError);
    return { error: "Failed to fetch original expense" };
  }

  // Get category ID for the category name
  const categoryId = await getOrCreateCategoryByName(data.category, user.id);

  // Update the expense in the database
  const { error } = await supabase
    .from("expenses")
    .update({
      description: data.description,
      merchant: data.merchant,
      category: data.category, // Keep for backward compatibility
      category_id: categoryId,
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

  let updatedCount = 1; // The single expense we just updated

  // If category changed and merchant exists, create merchant mapping
  if (originalExpense.category !== data.category && data.merchant) {
    await createMerchantMapping(user.id, data.merchant, data.category);

    // If user wants to apply to all merchant expenses, do bulk update
    if (applyToAllMerchantExpenses) {
      const bulkUpdateResult = await updateAllExpensesByMerchant(
        user.id,
        data.merchant,
        data.category
      );

      if (bulkUpdateResult.success) {
        updatedCount = bulkUpdateResult.updatedCount;
      }
    }
  }

  // Revalidate the page to reflect changes
  revalidatePath("/");

  return { success: true, updatedCount };
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

export async function getMonthlyExpensesByCategory(dateRange?: {
  from: Date;
  to: Date;
}): Promise<{
  data?: Array<{ month: string; [category: string]: string | number }>;
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

  // Build query with optional date filtering
  let query = supabase
    .from("expenses")
    .select("date, category, amount_sgd")
    .eq("user_id", user.id);

  // Add date filtering if dateRange is provided
  if (dateRange?.from && dateRange?.to) {
    // Convert JS Date to PlainDate, then use .toString() for robust YYYY-MM-DD format
    const fromStr = dateToPlainDate(dateRange.from).toString();
    const toStr = dateToPlainDate(dateRange.to).toString();

    query = query.gte("date", fromStr).lte("date", toStr);
  }

  const { data: expenses, error } = await query.order("date", {
    ascending: true,
  });

  if (error) {
    console.error("Error fetching expenses for chart:", error);
    return { error: error.message };
  }

  // Group expenses by month and category
  const monthlyData = new Map<string, Map<string, number>>();
  const allCategories = new Set<string>();

  expenses?.forEach((expense) => {
    const date = plainDateFromString(expense.date);
    if (!date) return; // Skip invalid dates

    const monthKey = getDisplayMonthKey(date);

    allCategories.add(expense.category);

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, new Map());
    }

    const monthMap = monthlyData.get(monthKey);
    if (monthMap) {
      const currentAmount = monthMap.get(expense.category) || 0;
      monthMap.set(
        expense.category,
        currentAmount + Number(expense.amount_sgd)
      );
    }
  });

  // Convert to array format for recharts, ensuring all categories have values for all months
  const chartData = Array.from(monthlyData.entries()).map(
    ([month, categories]) => {
      const dataPoint: { month: string; [key: string]: string | number } = {
        month,
      };
      let total = 0;
      // Ensure all categories have a value (0 if no spending)
      allCategories.forEach((category) => {
        const amount = categories.get(category) || 0;
        dataPoint[category] = amount;
        total += amount;
      });
      // Add total line
      dataPoint.Total = total;
      return dataPoint;
    }
  );

  return { data: chartData };
}

export async function getExpenseHeadlineNumbers(dateRange?: {
  from: Date;
  to: Date;
}): Promise<{
  data?: {
    categoryTotals: Record<string, number>;
    categoryAverages: Record<string, number>;
    totalSpending: number;
    averageSpending: number;
    monthCount: number;
  };
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

  // Build query with optional date filtering
  let query = supabase
    .from("expenses")
    .select("date, category, amount_sgd")
    .eq("user_id", user.id);

  // Add date filtering if dateRange is provided
  if (dateRange?.from && dateRange?.to) {
    // Convert JS Date to PlainDate, then use .toString() for robust YYYY-MM-DD format
    const fromStr = dateToPlainDate(dateRange.from).toString();
    const toStr = dateToPlainDate(dateRange.to).toString();

    query = query.gte("date", fromStr).lte("date", toStr);
  }

  const { data: expenses, error } = await query.order("date", {
    ascending: true,
  });

  if (error) {
    console.error("Error fetching expenses for headline numbers:", error);
    return { error: error.message };
  }

  if (!expenses || expenses.length === 0) {
    return {
      data: {
        categoryTotals: {},
        categoryAverages: {},
        totalSpending: 0,
        averageSpending: 0,
        monthCount: 0,
      },
    };
  }

  // Calculate category totals
  const categoryTotals: Record<string, number> = {};
  let totalSpending = 0;
  const monthsSet = new Set<string>();

  expenses.forEach((expense) => {
    const amount = Number(expense.amount_sgd);
    const category = expense.category;
    const date = plainDateFromString(expense.date);
    if (!date) return; // Skip invalid dates

    const monthKey = `${date.year}-${date.month}`;

    // Track unique months for average calculation
    monthsSet.add(monthKey);

    // Add to category total
    categoryTotals[category] = (categoryTotals[category] || 0) + amount;

    // Add to overall total
    totalSpending += amount;
  });

  // Calculate month count based on date range if provided, otherwise use actual expense months
  let monthCount: number;
  if (dateRange?.from && dateRange?.to) {
    // Convert JS Date to PlainDate directly - avoids timezone issues completely
    const fromPlainDate = dateToPlainDate(dateRange.from);
    const toPlainDate = dateToPlainDate(dateRange.to);

    monthCount = countMonthsInRange(fromPlainDate, toPlainDate);
  } else {
    // Use actual expense months if no date range specified
    monthCount = monthsSet.size || 1;
  }

  // Calculate category averages
  const categoryAverages: Record<string, number> = {};
  Object.keys(categoryTotals).forEach((category) => {
    categoryAverages[category] = categoryTotals[category] / monthCount;
  });

  // Calculate overall average
  const averageSpending = totalSpending / monthCount;

  return {
    data: {
      categoryTotals,
      categoryAverages,
      totalSpending,
      averageSpending,
      monthCount,
    },
  };
}
