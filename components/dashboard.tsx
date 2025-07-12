"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useExpenses } from "@/hooks/use-expenses";
import type { DisplayExpenseWithDuplicate } from "@/lib/types/expense";
import { DashboardControls } from "./dashboard-controls";
import { DeleteExpenseDialog } from "./delete-expense-dialog";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { ExpenseCategoryChart } from "./expense-category-chart";
import { ExpenseHeadlineNumbers } from "./expense-headline-numbers";
import { ExpensesTable } from "./expenses-table";
import { UploadDialog } from "./upload-dialog";

export function Dashboard() {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fastDeleteEnabled, setFastDeleteEnabled] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [editingExpense, setEditingExpense] =
    useState<DisplayExpenseWithDuplicate | null>(null);
  const [deletingExpense, setDeletingExpense] =
    useState<DisplayExpenseWithDuplicate | null>(null);

  const { expenses, isLoading, error, updateExpense, deleteExpense } =
    useExpenses();

  const handleEdit = (expense: DisplayExpenseWithDuplicate) => {
    setEditingExpense(expense);
  };

  const handleDelete = async (expense: DisplayExpenseWithDuplicate) => {
    if (fastDeleteEnabled) {
      // Fast delete - no confirmation dialog
      await deleteExpense(expense.id);
    } else {
      // Normal delete - show confirmation dialog
      setDeletingExpense(expense);
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
    applyToAllMerchant?: boolean;
  }) => {
    if (!editingExpense) return { error: "No expense selected" };

    const result = await updateExpense(
      editingExpense.id,
      data,
      data.applyToAllMerchant
    );
    if (result.success) {
      setEditingExpense(null);
    }
    return result;
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const result = await deleteExpense(expenseId);
    if (result.success) {
      setDeletingExpense(null);
    }
    return result;
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
    <div className="flex flex-col">
      <DashboardControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        fastDeleteEnabled={fastDeleteEnabled}
        onFastDeleteChange={setFastDeleteEnabled}
        onUploadClick={() => setUploadOpen(true)}
      />

      <UploadDialog isOpen={isUploadOpen} onOpenChange={setUploadOpen} />

      <div className="px-4 sm:px-6 space-y-4 py-4">
        <ExpenseHeadlineNumbers dateRange={dateRange} />
        <ExpenseCategoryChart dateRange={dateRange} />
      </div>

      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>
              Manage your expenses and view their details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Loading expenses...
                  </p>
                </div>
              </div>
            ) : (
              <ExpensesTable
                expenses={expenses}
                onEdit={handleEdit}
                onDelete={handleDelete}
                globalFilter={searchQuery}
                dateRange={dateRange}
              />
            )}
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{expenses.length}</strong> of{" "}
              <strong>{expenses.length}</strong> expenses
              {searchQuery && <span className="ml-2">(filtered)</span>}
            </div>
          </CardFooter>
        </Card>
      </main>

      {/* Edit Dialog */}
      {editingExpense && (
        <EditExpenseDialog
          expense={editingExpense}
          onSave={handleUpdateExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}

      {/* Delete Dialog */}
      {deletingExpense && !fastDeleteEnabled && (
        <DeleteExpenseDialog
          expense={deletingExpense}
          onDelete={handleDeleteExpense}
          onClose={() => setDeletingExpense(null)}
        />
      )}
    </div>
  );
}
