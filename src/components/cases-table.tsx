"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCheck,
  IconClock,
  IconLayoutColumns,
  IconLoader,
  IconSearch,
  IconAlertTriangle,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { Case, CaseStatus, CasesQueryParams } from "@/types/api"
import { casesService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

const statusLabels: Record<CaseStatus, string> = {
  'PENDIENTE': 'Pendiente',
  'EN_PROCESO': 'En Proceso',
  'CONTESTADO': 'Contestado',
}

const statusColors: Record<CaseStatus, string> = {
  'PENDIENTE': 'bg-yellow-200 text-yellow-800',
  'EN_PROCESO': 'bg-blue-200 text-blue-800',
  'CONTESTADO': 'bg-green-200 text-green-800',
}

const columns: ColumnDef<Case>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
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
      <div className="flex items-center justify-center">
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
    accessorKey: "userCaseId",
    header: "# Caso",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.userCaseId}
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "companyName",
    header: "Implicado",
    cell: ({ row }) => (
      <div className="max-w-48 truncate">
        {row.original.companyName}
      </div>
    ),
  },
  {
    accessorKey: "sentAt",
    header: "Fecha de Notificación",
    cell: ({ row }) => (
      <div className="text-sm">
        {new Date(row.original.sentAt).toLocaleDateString('es-ES')}
      </div>
    ),
  },
  {
    accessorKey: "deadline",
    header: "Fecha de vencimiento",
    cell: ({ row }) => (
      <div className="text-sm">
        {new Date(row.original.deadline).toLocaleDateString('es-ES')}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.original.status;
      
      return (
        <Badge className={`gap-1 px-2 ${statusColors[status]}`}>
          {status === 'CONTESTADO' && <IconCheck className="size-3" />}
          {status === 'EN_PROCESO' && <IconClock className="size-3" />}
          {status === 'PENDIENTE' && <IconAlertTriangle className="size-3" />}
          {statusLabels[status]}
        </Badge>
      );
    },
  },
]

interface DataTableProps {
  data?: Case[]
}

export function DataTable({ data: initialData }: DataTableProps) {
  const [data, setData] = React.useState<Case[]>(initialData || [])
  const [loading, setLoading] = React.useState(!initialData)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [totalPages, setTotalPages] = React.useState(0)
  const [totalCount, setTotalCount] = React.useState(0)
  const [searchValue, setSearchValue] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<CaseStatus | "Todos los casos">("Todos los casos")
  
  const { showError } = useToast()

  // Simple fetch function without dependencies
  const fetchCases = async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: CaseStatus | "Todos los casos";
  }) => {
    if (initialData) return;
    
    try {
      setLoading(true)
      const queryParams: CasesQueryParams = {
        page: params?.page || 1,
        limit: params?.pageSize || pagination.pageSize,
      }

      if (params?.search) {
        queryParams.search = params.search
      }

      if (params?.status && params.status !== "Todos los casos") {
        queryParams.status = params.status as CaseStatus
      }

      const response = await casesService.getCases(queryParams)
      setData(response.cases)
      setTotalPages(response.pagination.totalPages)
      setTotalCount(response.pagination.total)
    } catch (error) {
      console.error("Error fetching cases:", error)
      showError("Error al cargar los casos")
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch - only run once on mount
  React.useEffect(() => {
    if (!initialData) {
      fetchCases({ page: 1, pageSize: pagination.pageSize })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle search with debounce
  React.useEffect(() => {
    if (initialData) return;
    
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, pageIndex: 0 }))
      fetchCases({ page: 1, pageSize: pagination.pageSize, search: searchValue, status: statusFilter })
    }, 500)

    return () => clearTimeout(timer)
  }, [searchValue]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle pagination manually
  const handlePageChange = (newPageIndex: number) => {
    setPagination(prev => ({ ...prev, pageIndex: newPageIndex - 1 }))
    if (!initialData) {
      fetchCases({ 
        page: newPageIndex, 
        pageSize: pagination.pageSize, 
        search: searchValue, 
        status: statusFilter 
      })
    }
  }

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPagination({ pageIndex: 0, pageSize: newPageSize })
    if (!initialData) {
      fetchCases({ 
        page: 1, 
        pageSize: newPageSize, 
        search: searchValue, 
        status: statusFilter 
      })
    }
  }

  // Handle status filter change
  const handleStatusChange = (newStatus: CaseStatus | "Todos los casos") => {
    setStatusFilter(newStatus)
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
    if (!initialData) {
      fetchCases({ page: 1, pageSize: pagination.pageSize, search: searchValue, status: newStatus })
    }
  }

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater
      if (newPagination.pageIndex !== pagination.pageIndex) {
        handlePageChange(newPagination.pageIndex + 1)
      }
      if (newPagination.pageSize !== pagination.pageSize) {
        handlePageSizeChange(newPagination.pageSize)
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    pageCount: totalPages,
  })

  const handleNextPage = () => {
    const currentPage = pagination.pageIndex + 1
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }

  const handlePreviousPage = () => {
    const currentPage = pagination.pageIndex + 1
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleFirstPage = () => {
    handlePageChange(1)
  }

  const handleLastPage = () => {
    handlePageChange(totalPages)
  }

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Casos</CardTitle>
          <CardDescription>
            Gestiona todos los casos legales de tu organización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="Todos los casos" className="w-full">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-auto">
                <TabsTrigger value="Todos los casos" onClick={() => handleStatusChange("Todos los casos")} className="text-xs lg:text-sm">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="EN_PROCESO" onClick={() => handleStatusChange("EN_PROCESO")} className="text-xs lg:text-sm">
                  En proceso
                </TabsTrigger>
                <TabsTrigger value="PENDIENTE" onClick={() => handleStatusChange("PENDIENTE")} className="text-xs lg:text-sm">
                  Pendiente
                </TabsTrigger>
                <TabsTrigger value="CONTESTADO" onClick={() => handleStatusChange("CONTESTADO")} className="text-xs lg:text-sm">
                  Contestado
                </TabsTrigger>
              </TabsList>
              <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
                <div className="relative">
                  <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por empresa..."
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    className="pl-8 w-full sm:max-w-sm"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <IconLayoutColumns className="mr-2 h-4 w-4" />
                      Ver
                      <IconChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[150px]">
                    <DropdownMenuLabel>Alternar columnas</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {table
                      .getAllColumns()
                      .filter(
                        (column) =>
                          typeof column.accessorFn !== "undefined" && column.getCanHide()
                      )
                      .map((column) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          >
                            {column.id}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <TabsContent value={statusFilter} className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          <div className="flex items-center justify-center">
                            <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                            Cargando casos...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : table.getRowModel().rows?.length ? (
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
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          No se encontraron casos.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="flex-1 text-sm text-muted-foreground">
                  {table.getFilteredSelectedRowModel().rows.length} de{" "}
                  {totalCount} fila(s) seleccionadas.
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Filas por página</p>
                    <Select
                      value={`${table.getState().pagination.pageSize}`}
                      onValueChange={(value) => {
                        handlePageSizeChange(Number(value))
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Página {pagination.pageIndex + 1} de {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={handleFirstPage}
                      disabled={pagination.pageIndex === 0}
                    >
                      <span className="sr-only">Ir a la primera página</span>
                      <IconChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={handlePreviousPage}
                      disabled={pagination.pageIndex === 0}
                    >
                      <span className="sr-only">Ir a la página anterior</span>
                      <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={handleNextPage}
                      disabled={pagination.pageIndex >= totalPages - 1}
                    >
                      <span className="sr-only">Ir a la página siguiente</span>
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={handleLastPage}
                      disabled={pagination.pageIndex >= totalPages - 1}
                    >
                      <span className="sr-only">Ir a la última página</span>
                      <IconChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
