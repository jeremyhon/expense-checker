"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DisplayExpenseWithDuplicate } from "@/lib/types/expense";

interface ExpenseTableColumnsProps {
  onEdit: (expense: DisplayExpenseWithDuplicate) => void;
}

export const createExpenseColumns = ({
  onEdit,
}: ExpenseTableColumnsProps): ColumnDef<DisplayExpenseWithDuplicate>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium flex items-center gap-2"
      >
        Date
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="hidden md:table-cell">
          <div className="flex items-center gap-2">
            {row.getValue("date")}
            {expense.isDuplicate && (
              <Badge variant="secondary" className="text-xs">
                Possible Duplicate
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "merchant",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium flex items-center gap-2"
      >
        Merchant
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const expense = row.original;
      const merchant = row.getValue("merchant") as string;
      return (
        <div className="hidden sm:table-cell text-muted-foreground text-xs">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="truncate cursor-help">{merchant}</div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{merchant}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {expense.isDuplicate && (
              <Badge variant="secondary" className="text-xs sm:hidden">
                Duplicate
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium flex items-center gap-2"
      >
        Category
        <ArrowUpDown className="h-4 w-4" />
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
        className="h-auto p-0 font-medium text-right flex items-center gap-2 justify-end"
      >
        <span className="hidden lg:inline">Amount (SGD)</span>
        <span className="lg:hidden">Amount</span>
        <ArrowUpDown className="h-4 w-4" />
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
        className="h-auto p-0 font-medium text-right flex items-center gap-2 justify-end"
      >
        Foreign Currency
        <ArrowUpDown className="h-4 w-4" />
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
        className="h-auto p-0 font-medium flex items-center gap-2"
      >
        Description
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return (
        <div className="hidden lg:block text-muted-foreground text-xs w-full">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-help">{description}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-medium flex items-center gap-2"
      >
        Created
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const createdAt = new Date(row.getValue("createdAt"));
      return (
        <div className="text-sm text-muted-foreground hidden xl:table-cell">
          {createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(expense)}
          className="h-8 w-8 p-0"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit expense</span>
        </Button>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
