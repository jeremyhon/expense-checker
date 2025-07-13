"use client";

import { format, parseISO } from "date-fns";
import { CheckCircle2, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DisplayExpenseWithDuplicate } from "@/lib/types/expense";
import { cn } from "@/lib/utils";

interface UploadExpensesListProps {
  expenses: DisplayExpenseWithDuplicate[];
  selectedExpenseId?: string;
  onSelectExpense: (expense: DisplayExpenseWithDuplicate) => void;
  recentlyEditedIds: Set<string>;
}

export function UploadExpensesList({
  expenses,
  selectedExpenseId,
  onSelectExpense,
  recentlyEditedIds,
}: UploadExpensesListProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-center">
        <div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Processing PDF and extracting expenses...
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Expenses will appear here as they are found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Extracted Expenses</h3>
          <p className="text-sm text-muted-foreground">
            {expenses.length} expenses found
          </p>
        </div>
        {recentlyEditedIds.size > 0 && (
          <Badge
            variant="secondary"
            className="text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400"
          >
            {recentlyEditedIds.size} edited
          </Badge>
        )}
      </div>

      <div className="flex-1 min-h-0 border rounded-lg bg-card shadow-sm overflow-hidden">
        <div className="max-h-full overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur supports-[backdrop-filter]:bg-muted/30">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="w-[90px] font-medium">Date</TableHead>
                <TableHead className="font-medium">Description</TableHead>
                <TableHead className="w-[140px] font-medium">
                  Merchant
                </TableHead>
                <TableHead className="w-[110px] font-medium">
                  Category
                </TableHead>
                <TableHead className="text-right w-[120px] font-medium">
                  Amount
                </TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => {
                const isSelected = selectedExpenseId === expense.id;
                const isEdited = recentlyEditedIds.has(expense.id);

                return (
                  <TableRow
                    key={expense.id}
                    className={cn(
                      "cursor-pointer transition-all duration-150 ease-in-out group",
                      "hover:bg-muted/70 hover:shadow-sm",
                      isSelected && "bg-primary/10 border-primary/20 shadow-sm",
                      isEdited &&
                        "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-700/50"
                    )}
                    onClick={() => onSelectExpense(expense)}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {format(parseISO(expense.date), "MMM dd")}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate font-medium">
                        {expense.description}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[140px]">
                      <div className="truncate text-muted-foreground">
                        {expense.merchant || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium bg-muted/50 hover:bg-muted"
                      >
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-mono font-semibold">
                        ${expense.amount.toFixed(2)}
                      </div>
                      {expense.originalCurrency !== "SGD" && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {expense.originalCurrency}{" "}
                          {expense.originalAmount.toFixed(2)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEdited && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-6 w-6 transition-all duration-150",
                            "opacity-0 group-hover:opacity-100",
                            isSelected && "opacity-100"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectExpense(expense);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Click on any expense to edit its details
          </p>
        </div>
      )}
    </div>
  );
}
