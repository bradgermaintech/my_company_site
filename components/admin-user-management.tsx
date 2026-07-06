"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Plus, Save, Search, ShieldCheck, Trash2, UserCog, UsersRound, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type { Interview, JobApplication, User } from "@/lib/models";

const createMemberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["admin", "bidder", "caller", "developer"]),
  password: z.string().min(8)
});

type CreateMemberForm = z.infer<typeof createMemberSchema>;

type AdminUserManagementProps = {
  applications: JobApplication[];
  currentUserId: string;
  initialUsers: User[];
  interviews: Interview[];
};

type FeedbackState = {
  tone: "success" | "error";
  message: string;
} | null;

const roleLabels: Record<User["role"], string> = {
  admin: "Admin",
  bidder: "Bidder",
  caller: "Caller",
  developer: "Developer"
};

export function AdminUserManagement({
  applications,
  currentUserId,
  initialUsers,
  interviews
}: AdminUserManagementProps) {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState(initialUsers);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [memberFilter, setMemberFilter] = useState(searchParams.get("q") ?? "");
  const [roleFilter, setRoleFilter] = useState<User["role"] | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isPending, startTransition] = useTransition();
  const createForm = useForm<CreateMemberForm>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "bidder",
      password: ""
    }
  });

  const activeUsers = users.filter((user) => user.active);
  const activeAdmins = users.filter((user) => user.role === "admin" && user.active).length;
  const filteredUsers = useMemo(() => {
    const query = memberFilter.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !query ||
        [user.name, user.email, user.role]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? user.active : !user.active);

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [memberFilter, roleFilter, statusFilter, users]);

  const workloadByUser = useMemo(() => {
    return new Map(
      users.map((user) => {
        const applicationsCount = applications.filter((application) => {
          if (user.role === "bidder") {
            return application.bidderId === user.id;
          }
          if (user.role === "caller") {
            return application.callerId === user.id;
          }
          if (user.role === "developer") {
            return application.developerId === user.id;
          }
          return false;
        }).length;

        const interviewCount = interviews.filter((interview) => {
          if (user.role === "caller") {
            return interview.callerId === user.id;
          }
          if (user.role === "developer") {
            return interview.developerId === user.id;
          }
          return false;
        }).length;

        return [
          user.id,
          {
            applications: applicationsCount,
            interviews: interviewCount
          }
        ];
      })
    );
  }, [applications, interviews, users]);

  function updateUser(nextUser: User) {
    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === nextUser.id ? nextUser : user))
    );
  }

  function removeUser(userId: string) {
    setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId));
  }

  function handleCreate(values: CreateMemberForm) {
    setFeedback(null);
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(values)
        });

        const payload = await response.json();

        if (!response.ok) {
          setFeedback({
            tone: "error",
            message: payload.error ?? "Unable to create the user."
          });
          return;
        }

        setUsers((currentUsers) => [payload as User, ...currentUsers]);
        createForm.reset();
        setCreateOpen(false);
        setFeedback({
          tone: "success",
          message: "User created and ready for sign-in."
        });
      })();
    });
  }

  return (
    <>
      <div className="grid gap-6">
        <Card>
          <CardHeader className="gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <Badge variant="secondary" className="w-fit gap-2 rounded-full px-3 py-1">
                  <ShieldCheck className="size-3.5" />
                  Admin controls
                </Badge>
                <div className="space-y-1">
                  <CardTitle className="text-xl">Workspace user management</CardTitle>
                  <CardDescription>
                    Create members, adjust roles, and manage workspace access without leaving the admin surface.
                  </CardDescription>
                </div>
              </div>
              <Button type="button" size="lg" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Create member
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryStat label="Workspace members" value={users.length.toString()} icon={UsersRound} />
              <SummaryStat label="Active admins" value={activeAdmins.toString()} icon={ShieldCheck} />
              <SummaryStat label="Inactive users" value={users.filter((user) => !user.active).length.toString()} icon={UserCog} />
            </div>
          </CardHeader>
        </Card>

        {feedback ? (
          <div
            className={
              feedback.tone === "success"
                ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            }
          >
            {feedback.message}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <CardTitle>Members</CardTitle>
                <CardDescription>
                  Edit profile details, role assignment, status, and workload visibility for each workspace user.
                </CardDescription>
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_150px_150px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={memberFilter}
                    onChange={(event) => setMemberFilter(event.target.value)}
                    className="pl-9"
                    placeholder="Filter member or email"
                  />
                </div>
                <Select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value as User["role"] | "all")}
                >
                  <option value="all">All roles</option>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workload</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      currentUserId={currentUserId}
                      isPending={isPending}
                      onFeedback={setFeedback}
                      onRemoved={removeUser}
                      onUpdated={updateUser}
                      user={user}
                      workload={workloadByUser.get(user.id) ?? { applications: 0, interviews: 0 }}
                    />
                  ))}
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        No members match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-lg font-semibold text-foreground">Create member</p>
                <p className="text-sm text-muted-foreground">
                  Add a workspace user with role and temporary password.
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setCreateOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="grid gap-4 p-5">
              <Field label="Full name">
                <Input {...createForm.register("name")} placeholder="Jordan Lee" />
              </Field>
              {createForm.formState.errors.name ? (
                <p className="text-sm text-destructive">{createForm.formState.errors.name.message}</p>
              ) : null}

              <Field label="Email">
                <Input {...createForm.register("email")} placeholder="jordan@alignops.dev" />
              </Field>
              {createForm.formState.errors.email ? (
                <p className="text-sm text-destructive">{createForm.formState.errors.email.message}</p>
              ) : null}

              <Field label="Role">
                <Select {...createForm.register("role")}>
                  <option value="admin">Admin</option>
                  <option value="bidder">Bidder</option>
                  <option value="caller">Caller</option>
                  <option value="developer">Developer</option>
                </Select>
              </Field>

              <Field label="Temporary password">
                <Input
                  type="password"
                  {...createForm.register("password")}
                  placeholder="At least 8 characters"
                />
              </Field>
              {createForm.formState.errors.password ? (
                <p className="text-sm text-destructive">{createForm.formState.errors.password.message}</p>
              ) : null}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  <Plus className="size-4" />
                  Create member
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function UserRow({
  currentUserId,
  isPending,
  onFeedback,
  onRemoved,
  onUpdated,
  user,
  workload
}: {
  currentUserId: string;
  isPending: boolean;
  onFeedback: (state: FeedbackState) => void;
  onRemoved: (userId: string) => void;
  onUpdated: (user: User) => void;
  user: User;
  workload: { applications: number; interviews: number };
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<User["role"]>(user.role);
  const [active, setActive] = useState(user.active);
  const [isSaving, startTransition] = useTransition();

  function saveRow() {
    onFeedback(null);
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            email,
            role,
            active
          })
        });

        const payload = await response.json();

        if (!response.ok) {
          onFeedback({
            tone: "error",
            message: payload.error ?? "Unable to update the user."
          });
          return;
        }

        onUpdated(payload as User);
        onFeedback({
          tone: "success",
          message: `${payload.name} updated successfully.`
        });
      })();
    });
  }

  function resetPassword() {
    onFeedback(null);
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ type: "reset-password" })
        });

        const payload = await response.json();

        if (!response.ok) {
          onFeedback({
            tone: "error",
            message: payload.error ?? "Unable to reset the user password."
          });
          return;
        }

        onFeedback({
          tone: "success",
          message: `${user.name}'s temporary password is ${payload.temporaryPassword}`
        });
      })();
    });
  }

  function deleteUser() {
    if (!window.confirm(`Delete ${user.name}? Users with historical records will be archived instead.`)) {
      return;
    }

    onFeedback(null);
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/users/${user.id}`, {
          method: "DELETE"
        });
        const payload = await response.json();

        if (!response.ok) {
          onFeedback({
            tone: "error",
            message: payload.error ?? "Unable to delete the user."
          });
          return;
        }

        if (payload.mode === "archived") {
          onUpdated(payload.user as User);
          onFeedback({
            tone: "success",
            message: `${payload.user.name} was archived. ${payload.warning ?? ""}`.trim()
          });
          setActive(false);
          return;
        }

        onRemoved(user.id);
        onFeedback({
          tone: "success",
          message: `${user.name} deleted successfully.`
        });
      })();
    });
  }

  return (
    <TableRow>
      <TableCell>
        <div className="grid gap-2">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
          <Input value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
      </TableCell>
      <TableCell>
        <Select value={role} onChange={(event) => setRole(event.target.value as User["role"])}>
          {Object.entries(roleLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <StatusBadge status={active ? "approved" : "pending"} />
          <Select
            value={active ? "active" : "inactive"}
            onChange={(event) => setActive(event.target.value === "active")}
            disabled={currentUserId === user.id}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          {currentUserId === user.id ? (
            <p className="text-xs text-muted-foreground">Your account stays active.</p>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-muted-foreground">
          <p>{workload.applications} applications</p>
          <p>{workload.interviews} interviews</p>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" size="sm" disabled={isSaving || isPending} onClick={saveRow}>
            <Save className="size-4" />
            Save
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={isSaving || isPending} onClick={resetPassword}>
            <KeyRound className="size-4" />
            Reset
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isSaving || isPending || currentUserId === user.id}
            onClick={deleteUser}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

function Field({
  children,
  label
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
