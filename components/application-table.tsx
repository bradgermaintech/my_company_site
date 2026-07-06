"use client";

import { useCallback, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type FilterFn,
  type ColumnDef,
  type ColumnFiltersState
} from "@tanstack/react-table";
import { Download, ExternalLink, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pipelineStatuses } from "@/lib/constants";
import type { JobApplication, PipelineStatus, User } from "@/lib/models";
import { formatDate } from "@/lib/utils";

type ApplicationTableProps = {
  data: JobApplication[];
  users: User[];
  title?: string;
  showFilters?: boolean;
};

export function ApplicationTable({
  data,
  users,
  title = "Application pipeline",
  showFilters = true
}: ApplicationTableProps) {
  const searchParams = useSearchParams();
  const [globalFilter, setGlobalFilter] = useState(searchParams.get("q") ?? "");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<PipelineStatus | "all">("all");
  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const applicationSearch: FilterFn<JobApplication> = (row, _columnId, filterValue) => {
    const query = String(filterValue ?? "").trim().toLowerCase();

    if (!query) {
      return true;
    }

    const application = row.original;
    const bidder = usersById.get(application.bidderId);
    const caller = usersById.get(application.callerId);
    const developer = usersById.get(application.developerId);
    const searchable = [
      application.date,
      application.jobTitle,
      application.company,
      application.jdLink,
      application.resumeVersion,
      application.status,
      application.releaseStatus,
      application.paymentStatus,
      application.notes,
      bidder?.name,
      bidder?.email,
      caller?.name,
      caller?.email,
      developer?.name,
      developer?.email
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  };

  const userNameFilter = useCallback<FilterFn<JobApplication>>((row, columnId, filterValue) => {
    const query = String(filterValue ?? "").trim().toLowerCase();

    if (!query) {
      return true;
    }

    const userId = row.getValue<string>(columnId);
    const user = usersById.get(userId);

    return [user?.name, user?.email].filter(Boolean).join(" ").toLowerCase().includes(query);
  }, [usersById]);

  const filteredData = useMemo(() => {
    return statusFilter === "all"
      ? data
      : data.filter((application) => application.status === statusFilter);
  }, [data, statusFilter]);

  const columns = useMemo<ColumnDef<JobApplication>[]>(
    () => [
      {
        id: "datePicker",
        header: "Date picker",
        enableColumnFilter: false,
        cell: ({ row }) => (
          <Input
            aria-label={`Follow-up date for ${row.original.company}`}
            type="date"
            defaultValue={row.original.date}
            suppressHydrationWarning
            className="h-9 min-w-[140px]"
          />
        )
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.date)
      },
      {
        accessorKey: "jobTitle",
        header: "Job title",
        cell: ({ row }) => (
          <div className="min-w-[220px]">
            <p className="font-semibold text-foreground">{row.original.jobTitle}</p>
            <p className="text-xs text-muted-foreground">{row.original.company}</p>
          </div>
        )
      },
      {
        accessorKey: "company",
        header: "Company"
      },
      {
        accessorKey: "jdLink",
        header: "JD link",
        cell: ({ row }) => (
          <a
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            href={row.original.jdLink}
            target="_blank"
            rel="noreferrer"
          >
            Open
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        )
      },
      {
        accessorKey: "resumeVersion",
        header: "Resume version"
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        accessorKey: "callerId",
        header: "Caller assigned",
        filterFn: userNameFilter,
        cell: ({ row }) => usersById.get(row.original.callerId)?.name
      },
      {
        accessorKey: "developerId",
        header: "Developer assigned",
        filterFn: userNameFilter,
        cell: ({ row }) => usersById.get(row.original.developerId)?.name
      },
      {
        accessorKey: "releaseStatus",
        header: "Release",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              aria-label={`Release ready for ${row.original.company}`}
              defaultChecked={row.original.releaseStatus !== "not-ready"}
              suppressHydrationWarning
            />
            <StatusBadge status={row.original.releaseStatus} />
          </div>
        )
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <p className="max-w-[280px] truncate text-muted-foreground">
            {row.original.notes}
          </p>
        )
      }
    ],
    [userNameFilter, usersById]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
      columnFilters
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: applicationSearch,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  function exportFilteredRows() {
    const visibleRows = table.getFilteredRowModel().rows.map((row) => row.original);
    const headers = [
      "Date",
      "Job title",
      "Company",
      "JD link",
      "Status",
      "Resume version",
      "Bidder",
      "Caller",
      "Developer",
      "Release status",
      "Payment status",
      "Notes",
      "Updated"
    ];

    const escapeCsv = (value: string | number | null | undefined) =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;

    const rows = visibleRows.map((application) => [
      application.date,
      application.jobTitle,
      application.company,
      application.jdLink,
      application.status,
      application.resumeVersion,
      usersById.get(application.bidderId)?.name,
      usersById.get(application.callerId)?.name,
      usersById.get(application.developerId)?.name,
      application.releaseStatus,
      application.paymentStatus,
      application.notes,
      application.updatedAt
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `alignops-application-pipeline-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle>{title}</CardTitle>
        {showFilters ? (
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9 md:w-[260px]"
                placeholder="Filter job, company, notes"
              />
            </div>
            <Select
              aria-label="Status filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as PipelineStatus | "all")
              }
              className="md:w-[170px]"
            >
              <option value="all">All statuses</option>
              {pipelineStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={exportFilteredRows}
              disabled={table.getFilteredRowModel().rows.length === 0}
            >
              <Download className="size-4" />
              Export
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
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
            <TableRow>
              {table.getLeafHeaders().map((header) => (
                <TableHead key={`${header.id}-filter`} className="normal-case">
                  {header.column.getCanFilter() ? (
                    <Input
                      value={(header.column.getFilterValue() as string | undefined) ?? ""}
                      onChange={(event) => header.column.setFilterValue(event.target.value)}
                      placeholder="Filter"
                      className="h-8 min-w-[120px] text-xs"
                    />
                  ) : null}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
