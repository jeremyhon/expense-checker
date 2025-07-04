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
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createExpenseColumns, type Expense } from "./expenses-table-columns";

interface ExpensesTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  globalFilter: string;
}

export function ExpensesTable({
  expenses,
  onEdit,
  onDelete,
  globalFilter,
}: ExpensesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = createExpenseColumns({ onEdit, onDelete });

  const table = useReactTable({
    data: expenses,
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
    globalFilterFn: (row, columnId, filterValue) => {
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
    case "amount":
      return "text-right";
    default:
      return "";
  }
}
