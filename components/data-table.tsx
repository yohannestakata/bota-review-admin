"use client"

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { ChevronDownIcon, Columns3Icon, Loader2Icon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type ServerPagination = {
  page: number // 1-based
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  // Client-side text filter bound to one accessor column (ignored when
  // serverPagination is set — search should be server-driven there).
  filterColumn?: string
  filterPlaceholder?: string
  // Optional left-aligned toolbar content (search…).
  toolbar?: React.ReactNode
  // Optional right-aligned toolbar content (filters/tabs), sits before Columns.
  toolbarEnd?: React.ReactNode
  // Dims the table and shows a spinner during background refetches.
  loading?: boolean
  getRowId?: (row: TData, index: number) => string
  // When provided, the table renders the given page and delegates paging to the
  // server instead of slicing client-side.
  serverPagination?: ServerPagination
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  filterPlaceholder,
  toolbar,
  toolbarEnd,
  loading,
  getRowId,
  serverPagination,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const server = serverPagination
  const pageCount = server
    ? Math.max(1, Math.ceil(server.total / server.pageSize))
    : undefined

  const table = useReactTable({
    data,
    columns,
    getRowId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(server
      ? { manualPagination: true, pageCount }
      : { getPaginationRowModel: getPaginationRowModel() }),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(server
        ? { pagination: { pageIndex: server.page - 1, pageSize: server.pageSize } }
        : {}),
    },
  })

  const hasSelection = columns.some((column) => column.id === "select")

  const canPrev = server ? server.page > 1 : table.getCanPreviousPage()
  const canNext = server ? server.page < (pageCount ?? 1) : table.getCanNextPage()
  const currentPage = server
    ? server.page
    : table.getState().pagination.pageIndex + 1
  const totalPages = server ? (pageCount ?? 1) : table.getPageCount() || 1

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {toolbar}
        {filterColumn && !server ? (
          <Input
            placeholder={filterPlaceholder ?? "Filter…"}
            value={
              (table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(filterColumn)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {toolbarEnd}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <Columns3Icon />
              <span className="hidden lg:inline">Customize Columns</span>
              <span className="lg:hidden">Columns</span>
              <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-md border">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : null}
        <Table className={loading ? "opacity-50" : undefined}>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {server
            ? `${server.total} row(s)`
            : hasSelection
              ? `${table.getFilteredSelectedRowModel().rows.length} of ${
                  table.getFilteredRowModel().rows.length
                } row(s) selected.`
              : `${table.getFilteredRowModel().rows.length} row(s)`}
        </div>
        <div className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              server ? server.onPageChange(server.page - 1) : table.previousPage()
            }
            disabled={!canPrev}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              server ? server.onPageChange(server.page + 1) : table.nextPage()
            }
            disabled={!canNext}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
