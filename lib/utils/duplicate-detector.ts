import type { DisplayExpense } from "@/lib/types/expense";

/**
 * Checks if two expenses are duplicates based on date, merchant, and amount
 * Uses case-insensitive comparison for merchant names
 */
export function isDuplicate(expense1: DisplayExpense, expense2: DisplayExpense): boolean {
  if (expense1.id === expense2.id) return false;

  const sameDate = expense1.date === expense2.date;
  const sameMerchant = expense1.merchant.toLowerCase() === expense2.merchant.toLowerCase();
  const sameAmount = Math.abs(expense1.amount - expense2.amount) < 0.01; // Handle floating point precision

  return sameDate && sameMerchant && sameAmount;
}

/**
 * Marks expenses as duplicates in an array
 * The later expense (by creation date) is marked as the duplicate
 */
export function markDuplicates(expenses: DisplayExpense[]): Array<DisplayExpense & { isDuplicate: boolean }> {
  return expenses.map((expense, index) => {
    let isDuplicate = false;
    
    // Check if this expense is a duplicate of any earlier expense
    for (let i = 0; i < index; i++) {
      if (isDuplicate(expense, expenses[i])) {
        // Current expense is later than the one at index i, so it's the duplicate
        isDuplicate = true;
        break;
      }
    }

    return {
      ...expense,
      isDuplicate,
    };
  });
}