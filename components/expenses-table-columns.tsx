"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DisplayExpense } from "@/lib/types/expense";

interface ExpenseTableColumnsProps {
  onEdit: (expense: DisplayExpense) => void;
  onDelete: (expense: DisplayExpense) => void;
}

export const createExpenseColumns = ({
  onEdit,
  onDelete,
}: ExpenseTableColumnsProps): ColumnDef<DisplayExpense>[] => [
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="hidden md:table-cell">{row.getValue("date")}</div>
    ),
  },
  {
    accessorKey: "merchant",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Merchant
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="hidden sm:table-cell text-muted-foreground">
        {row.getValue("merchant")}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Category
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("category")}</Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium text-right"
      >
        Amount (SGD)
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("amount"));
      return (
        <div className="text-right">
          {amount.toLocaleString("en-US", {
            style: "currency",
            currency: "SGD",
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "originalAmount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium text-right"
      >
        Foreign Currency
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const originalAmount = Number.parseFloat(row.getValue("originalAmount"));
      const originalCurrency = row.original.originalCurrency;
      return (
        <div className="text-right hidden lg:table-cell text-muted-foreground">
          {originalCurrency === "SGD" ? (
            <span className="text-xs">-</span>
          ) : (
            originalAmount.toLocaleString("en-US", {
              style: "currency",
              currency: originalCurrency,
            })
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium"
      >
        Description
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium hidden lg:table-cell">
        {row.getValue("description")}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(expense)}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit expense</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(expense)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete expense</span>
          </Button>
        </div>
      );
    },
  },
];
