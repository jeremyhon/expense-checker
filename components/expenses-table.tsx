"use client";

import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { isWithinInterval, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DisplayExpenseWithDuplicate } from "@/lib/types/expense";

import { createExpenseColumns } from "./expenses-table-columns";

interface ExpensesTableProps {
  expenses: DisplayExpenseWithDuplicate[];
  onEdit: (expense: DisplayExpenseWithDuplicate) => void;
  onDelete: (expense: DisplayExpenseWithDuplicate) => void;
  globalFilter: string;
  dateRange?: DateRange;
}

export function ExpensesTable({
  expenses,
  onEdit,
  onDelete,
  globalFilter,
  dateRange,
}: ExpensesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = createExpenseColumns({ onEdit, onDelete });

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return expenses;
    }

    return expenses.filter((expense) => {
      if (!dateRange.from || !dateRange.to) {
        return true;
      }
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, {
        start: dateRange.from,
        end: dateRange.to,
      });
    });
  }, [expenses, dateRange]);

  const table = useReactTable({
    data: filteredExpenses,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      const description = row.getValue("description") as string;
      const category = row.getValue("category") as string;
      const merchant = row.getValue("merchant") as string;

      return (
        description.toLowerCase().includes(searchValue) ||
        category.toLowerCase().includes(searchValue) ||
        merchant.toLowerCase().includes(searchValue)
      );
    },
  });

  // Update global filter when prop changes
  useEffect(() => {
    table.setGlobalFilter(globalFilter);
  }, [globalFilter, table]);

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className={getHeaderClassName(header.id)}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={getCellClassName(cell.column.id)}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="text-center text-muted-foreground py-8"
            >
              No expenses found matching your filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function getHeaderClassName(columnId: string): string {
  switch (columnId) {
    case "date":
      return "hidden md:table-cell";
    case "merchant":
      return "hidden sm:table-cell";
    case "originalAmount":
      return "text-right hidden lg:table-cell";
    case "description":
      return "hidden lg:table-cell";
    case "createdAt":
      return "hidden xl:table-cell";
    case "amount":
      return "text-right";
    default:
      return "";
  }
}

function getCellClassName(columnId: string): string {
  switch (columnId) {
    case "date":
      return "hidden md:table-cell";
    case "merchant":
      return "hidden sm:table-cell text-muted-foreground";
    case "originalAmount":
      return "text-right hidden lg:table-cell text-muted-foreground";
    case "description":
      return "font-medium hidden lg:table-cell";
    case "createdAt":
      return "hidden xl:table-cell";
    case "amount":
      return "text-right";
    default:
      return "";
  }
}
