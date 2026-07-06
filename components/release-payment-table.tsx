"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { JobApplication, Release, User } from "@/lib/models";
import { formatCurrency, formatDate } from "@/lib/utils";

type ReleasePaymentTableProps = {
  applications: JobApplication[];
  releases: Release[];
  users: User[];
};

export function ReleasePaymentTable({
  applications,
  releases,
  users
}: ReleasePaymentTableProps) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    company: searchParams.get("q") ?? "",
    job: "",
    amount: "",
    status: "",
    approver: "",
    paid: ""
  });
  const applicationsById = useMemo(
    () => new Map(applications.map((application) => [application.id, application])),
    [applications]
  );
  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const rows = useMemo(
    () =>
      releases
        .map((release) => {
          const application = applicationsById.get(release.applicationId) ?? applications[0];
          const approver = usersById.get(release.approvedBy);
          return { release, application, approver };
        })
        .filter(({ release, application, approver }) => {
          const paidLabel = release.paidAt ? formatDate(release.paidAt) : "Not paid";
          return (
            application.company.toLowerCase().includes(filters.company.toLowerCase()) &&
            application.jobTitle.toLowerCase().includes(filters.job.toLowerCase()) &&
            formatCurrency(release.amount).toLowerCase().includes(filters.amount.toLowerCase()) &&
            release.status.toLowerCase().includes(filters.status.toLowerCase()) &&
            (approver?.name ?? "").toLowerCase().includes(filters.approver.toLowerCase()) &&
            paidLabel.toLowerCase().includes(filters.paid.toLowerCase())
          );
        }),
    [applications, applicationsById, filters, releases, usersById]
  );

  function setFilter(key: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Release and payment tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approved by</TableHead>
              <TableHead>Paid</TableHead>
            </TableRow>
            <TableRow>
              <TableHead><Input value={filters.company} onChange={(event) => setFilter("company", event.target.value)} placeholder="Filter" className="h-8 text-xs" /></TableHead>
              <TableHead><Input value={filters.job} onChange={(event) => setFilter("job", event.target.value)} placeholder="Filter" className="h-8 text-xs" /></TableHead>
              <TableHead><Input value={filters.amount} onChange={(event) => setFilter("amount", event.target.value)} placeholder="Filter" className="h-8 text-xs" /></TableHead>
              <TableHead><Input value={filters.status} onChange={(event) => setFilter("status", event.target.value)} placeholder="Filter" className="h-8 text-xs" /></TableHead>
              <TableHead><Input value={filters.approver} onChange={(event) => setFilter("approver", event.target.value)} placeholder="Filter" className="h-8 text-xs" /></TableHead>
              <TableHead><Input value={filters.paid} onChange={(event) => setFilter("paid", event.target.value)} placeholder="Filter" className="h-8 text-xs" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ release, application, approver }) => {
              return (
                <TableRow key={release.id}>
                  <TableCell className="font-medium">{application.company}</TableCell>
                  <TableCell>{application.jobTitle}</TableCell>
                  <TableCell>{formatCurrency(release.amount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={release.status} />
                  </TableCell>
                  <TableCell>{approver?.name}</TableCell>
                  <TableCell>
                    {release.paidAt ? formatDate(release.paidAt) : "Not paid"}
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No release records match the current filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
