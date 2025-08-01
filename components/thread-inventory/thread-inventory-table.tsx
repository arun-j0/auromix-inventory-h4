"use client"

import { useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { ThreadInventory } from "@/types/thread-inventory"

interface ThreadInventoryTableProps {
  inventory: ThreadInventory[]
  onEditInventory: (inventory: ThreadInventory) => void
}

export function ThreadInventoryTable({ inventory, onEditInventory }: ThreadInventoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const columns: ColumnDef<ThreadInventory>[] = [
    {
      accessorKey: "rawMaterialId",
      header: "Material ID",
      cell: ({ row }) => <div className="font-medium">{row.getValue("rawMaterialId")}</div>,
    },
    {
      accessorKey: "currentStockKg",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Current Stock (kg)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("currentStockKg")} kg</div>,
    },
    {
      accessorKey: "allocatedKg",
      header: "Allocated (kg)",
      cell: ({ row }) => <div>{row.getValue("allocatedKg")} kg</div>,
    },
    {
      accessorKey: "availableKg",
      header: "Available (kg)",
      cell: ({ row }) => <div>{row.getValue("availableKg")} kg</div>,
    },
    {
      accessorKey: "thresholdKg",
      header: "Threshold (kg)",
      cell: ({ row }) => <div>{row.getValue("thresholdKg")} kg</div>,
    },
    {
      accessorKey: "costPerKg",
      header: "Cost (₹/kg)",
      cell: ({ row }) => <div>₹{row.getValue("costPerKg")}</div>,
    },
    {
      accessorKey: "totalValue",
      header: "Total Value (₹)",
      cell: ({ row }) => <div>₹{row.getValue("totalValue")}</div>,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const currentStock = row.getValue("currentStockKg") as number
        const threshold = row.getValue("thresholdKg") as number

        if (currentStock <= threshold) {
          return <Badge variant="destructive">Low Stock</Badge>
        } else if (currentStock <= threshold * 1.2) {
          return <Badge variant="warning">Near Threshold</Badge>
        } else {
          return <Badge variant="success">Sufficient</Badge>
        }
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const inventoryItem = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEditInventory(inventoryItem)}>Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View History</DropdownMenuItem>
              <DropdownMenuItem>Add Stock</DropdownMenuItem>
              <DropdownMenuItem>Allocate Stock</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: inventory,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter by material ID..."
          value={(table.getColumn("rawMaterialId")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("rawMaterialId")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto bg-transparent">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuItem
                      key={column.id}
                      className="capitalize"
                      onSelect={() => column.toggleVisibility(!column.getIsVisible())}
                    >
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={column.getIsVisible()}
                        onChange={() => column.toggleVisibility(!column.getIsVisible())}
                      />
                      {column.id}
                    </DropdownMenuItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No inventory items found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
