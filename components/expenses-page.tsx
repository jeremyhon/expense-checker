"use client";

import { useState } from "react";
import { toast } from "sonner";
import { bulkDeleteExpenses, updateExpense } from "@/app/actions/expense";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ExpenseFilters,
  useElectricExpenses,
} from "@/hooks/use-electric-expenses";
import type { DisplayExpenseWithDuplicate } from "@/lib/types/expense";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { ExpensesTableVirtualized } from "./expenses-table-virtualized";

export function ExpensesPage() {
  const [editingExpense, setEditingExpense] =
    useState<DisplayExpenseWithDuplicate | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>({});

  const { expenses, loading, error } = useElectricExpenses({
    filters,
    autoSubscribe: true,
    loadRecentOnly: true,
    monthsBack: 6,
  });

  const handleEdit = (expense: DisplayExpenseWithDuplicate) => {
    setEditingExpense(expense);
  };

  const handleBulkDelete = async (expenseIds: string[]) => {
    try {
      const result = await bulkDeleteExpenses(expenseIds);
      if (result.success) {
        toast.success(
          `Successfully deleted ${result.deletedCount} expense${result.deletedCount === 1 ? "" : "s"}`
        );
      } else {
        toast.error(result.error || "Failed to delete expenses");
      }
    } catch (error) {
      console.error("Error deleting expenses:", error);
      toast.error("Failed to delete expenses");
    }
  };

  const handleUpdateExpense = async (data: {
    description: string;
    merchant: string;
    category: string;
    amount: number;
    originalAmount: number;
    originalCurrency: string;
    date: string;
  }) => {
    if (!editingExpense) return { error: "No expense selected" };

    try {
      const result = await updateExpense(editingExpense.id, data);
      if (result.success) {
        setEditingExpense(null);
        toast.success("Expense updated successfully");
      } else {
        toast.error(result.error || "Failed to update expense");
      }
      return result;
    } catch (error) {
      console.error("Error updating expense:", error);
      const errorMessage = "Failed to update expense";
      toast.error(errorMessage);
      return { error: errorMessage };
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error loading expenses: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            Manage your expenses with advanced filtering, selection, and
            real-time sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <ExpensesTableVirtualized
            expenses={expenses}
            onEdit={handleEdit}
            onBulkDelete={handleBulkDelete}
            filters={filters}
            onFiltersChange={setFilters}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingExpense && (
        <EditExpenseDialog
          expense={editingExpense}
          onSave={handleUpdateExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </div>
  );
}
