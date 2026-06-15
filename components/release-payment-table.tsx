import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
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
  const applicationsById = new Map(applications.map((application) => [application.id, application]));
  const usersById = new Map(users.map((user) => [user.id, user]));

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
          </TableHeader>
          <TableBody>
            {releases.map((release) => {
              const application = applicationsById.get(release.applicationId) ?? applications[0];
              const approver = usersById.get(release.approvedBy);

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
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
