"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import {
  applicationInputSchema,
  paymentStatusOptions,
  pipelineStatusOptions,
  releaseStatusOptions,
  type ApplicationInput
} from "@/lib/application-schema";
import { formatDate } from "@/lib/utils";
import type { JobApplication, User } from "@/lib/models";

type ApplicationCrudWorkbenchProps = {
  currentUser: User;
  initialApplications: JobApplication[];
  users: User[];
};

type FormMode = "create" | "edit";

type FeedbackState = {
  tone: "success" | "error";
  message: string;
} | null;

function getDefaultValues({
  bidders,
  callers,
  developers,
  currentUser,
  application
}: {
  bidders: User[];
  callers: User[];
  developers: User[];
  currentUser: User;
  application?: JobApplication | null;
}): ApplicationInput {
  if (application) {
    return {
      date: application.date,
      jobTitle: application.jobTitle,
      company: application.company,
      jdLink: application.jdLink,
      bidderId: application.bidderId,
      callerId: application.callerId,
      developerId: application.developerId,
      status: application.status,
      resumeVersion: application.resumeVersion,
      releaseStatus: application.releaseStatus,
      paymentStatus: application.paymentStatus,
      notes: application.notes
    };
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    jobTitle: "",
    company: "",
    jdLink: "",
    bidderId:
      currentUser.role === "bidder"
        ? currentUser.id
        : (bidders[0]?.id ?? ""),
    callerId: callers[0]?.id ?? "",
    developerId: developers[0]?.id ?? "",
    status: "Bid",
    resumeVersion: "v1.0",
    releaseStatus: "not-ready",
    paymentStatus: "unbilled",
    notes: ""
  };
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function ApplicationCrudWorkbench({
  currentUser,
  initialApplications,
  users
}: ApplicationCrudWorkbenchProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [selectedId, setSelectedId] = useState(initialApplications[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof pipelineStatusOptions)[number] | "all">("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "mine">("all");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobApplication | null>(null);
  const [isPending, startTransition] = useTransition();

  const bidders = useMemo(() => users.filter((user) => user.role === "bidder" && user.active), [users]);
  const callers = useMemo(() => users.filter((user) => user.role === "caller" && user.active), [users]);
  const developers = useMemo(() => users.filter((user) => user.role === "developer" && user.active), [users]);
  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const canCreate = currentUser.role === "admin" || currentUser.role === "bidder";

  const filteredApplications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return applications
      .filter((application) => {
        if (statusFilter !== "all" && application.status !== statusFilter) {
          return false;
        }

        if (scopeFilter === "mine") {
          if (currentUser.role === "bidder" && application.bidderId !== currentUser.id) {
            return false;
          }

          if (currentUser.role === "caller" && application.callerId !== currentUser.id) {
            return false;
          }

          if (currentUser.role === "developer" && application.developerId !== currentUser.id) {
            return false;
          }
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          application.jobTitle,
          application.company,
          application.notes,
          application.resumeVersion
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => {
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      });
  }, [applications, currentUser.id, currentUser.role, scopeFilter, search, statusFilter]);

  const selectedApplication = useMemo(() => {
    if (!filteredApplications.length) {
      return applications.find((application) => application.id === selectedId) ?? null;
    }

    return (
      filteredApplications.find((application) => application.id === selectedId) ??
      filteredApplications[0]
    );
  }, [applications, filteredApplications, selectedId]);

  useEffect(() => {
    if (!selectedApplication && filteredApplications[0]) {
      setSelectedId(filteredApplications[0].id);
      return;
    }

    if (selectedApplication?.id && selectedApplication.id !== selectedId) {
      setSelectedId(selectedApplication.id);
    }
  }, [filteredApplications, selectedApplication, selectedId]);

  const activeCount = applications.filter((application) => application.status !== "Rejected").length;
  const offerCount = applications.filter((application) => application.status === "Offer").length;
  const paidCount = applications.filter((application) => application.paymentStatus === "paid").length;
  const blockedCount = applications.filter((application) => application.releaseStatus === "not-ready").length;

  const openCreate = () => {
    setFeedback(null);
    setEditingApplication(null);
    setFormMode("create");
  };

  const openEdit = (application: JobApplication) => {
    setFeedback(null);
    setEditingApplication(application);
    setFormMode("edit");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingApplication(null);
  };

  const canManageApplication = (application: JobApplication) =>
    currentUser.role === "admin" ||
    (currentUser.role === "bidder" && application.bidderId === currentUser.id);

  const handleSave = (values: ApplicationInput) => {
    startTransition(() => {
      void (async () => {
        const endpoint =
          formMode === "edit" && editingApplication
            ? `/api/applications/${editingApplication.id}`
            : "/api/applications";
        const method = formMode === "edit" ? "PATCH" : "POST";

        try {
          const response = await fetch(endpoint, {
            method,
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(values)
          });

          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.error ?? "Unable to save the application.");
          }

          const nextApplication = payload as JobApplication;
          setApplications((currentApplications) => {
            if (formMode === "edit") {
              return currentApplications.map((application) =>
                application.id === nextApplication.id ? nextApplication : application
              );
            }

            return [nextApplication, ...currentApplications];
          });
          setSelectedId(nextApplication.id);
          setFeedback({
            tone: "success",
            message:
              formMode === "edit"
                ? "Application updated and workflow ownership stayed in sync."
                : "Application created and added to the live pipeline."
          });
          closeForm();
        } catch (error) {
          setFeedback({
            tone: "error",
            message: error instanceof Error ? error.message : "Unable to save the application."
          });
        }
      })();
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/applications/${deleteTarget.id}`, {
            method: "DELETE"
          });

          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.error ?? "Unable to delete the application.");
          }

          setApplications((currentApplications) =>
            currentApplications.filter((application) => application.id !== deleteTarget.id)
          );
          setSelectedId((currentSelectedId) =>
            currentSelectedId === deleteTarget.id ? "" : currentSelectedId
          );
          setFeedback({
            tone: "success",
            message: "Application deleted and related workflow records were cleared."
          });
          setDeleteTarget(null);
        } catch (error) {
          setFeedback({
            tone: "error",
            message: error instanceof Error ? error.message : "Unable to delete the application."
          });
        }
      })();
    });
  };

  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-blue-50/60 dark:to-blue-950/20">
          <CardHeader className="gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="size-3.5" />
                  Application operations
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl">Pipeline command workbench</CardTitle>
                  <CardDescription>
                    Create, update, and clean up application records with ownership, stage, and payment context in one place.
                  </CardDescription>
                </div>
              </div>
              {canCreate ? (
                <Button type="button" size="lg" onClick={openCreate}>
                  <Plus className="size-4" />
                  New application
                </Button>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryPill
                label="Tracked applications"
                value={applications.length.toString()}
                icon={BriefcaseBusiness}
                tone="blue"
              />
              <SummaryPill
                label="Active pipeline"
                value={activeCount.toString()}
                icon={ShieldCheck}
                tone="teal"
              />
              <SummaryPill
                label="Offers landed"
                value={offerCount.toString()}
                icon={Building2}
                tone="amber"
              />
              <SummaryPill
                label="Payments closed"
                value={paidCount.toString()}
                icon={CircleDollarSign}
                tone="slate"
              />
            </div>
          </CardHeader>
        </Card>

        <Card className="min-h-full">
          <CardHeader>
            <CardTitle>Workflow guardrails</CardTitle>
            <CardDescription>
              This view keeps ownership handoffs visible before interviews, releases, and payment milestones drift.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <GuardrailRow
              label="Needs release planning"
              value={blockedCount.toString()}
              detail="Records still marked as not ready"
            />
            <GuardrailRow
              label="My scope"
              value={
                applications.filter((application) => {
                  if (currentUser.role === "admin") {
                    return true;
                  }
                  if (currentUser.role === "bidder") {
                    return application.bidderId === currentUser.id;
                  }
                  if (currentUser.role === "caller") {
                    return application.callerId === currentUser.id;
                  }
                  return application.developerId === currentUser.id;
                }).length.toString()
              }
              detail="Applications currently tied to your role"
            />
            <GuardrailRow
              label="Filtered results"
              value={filteredApplications.length.toString()}
              detail="Based on your current search and stage filters"
            />
          </CardContent>
        </Card>
      </section>

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

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader className="gap-4 border-b bg-muted/20">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Application records</CardTitle>
                <CardDescription>
                  Search, filter, open detail, and take action without leaving the pipeline.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="w-fit">
                {filteredApplications.length} visible
              </Badge>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_140px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Search title, company, notes, resume"
                />
              </div>
              <Select
                aria-label="Status filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as (typeof pipelineStatusOptions)[number] | "all")
                }
              >
                <option value="all">All stages</option>
                {pipelineStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Scope filter"
                value={scopeFilter}
                onChange={(event) => setScopeFilter(event.target.value as "all" | "mine")}
              >
                <option value="all">All records</option>
                <option value="mine">My records</option>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/20 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Opportunity</th>
                    <th className="px-5 py-3 font-medium">Stage</th>
                    <th className="px-5 py-3 font-medium">Ownership</th>
                    <th className="px-5 py-3 font-medium">Finance</th>
                    <th className="px-5 py-3 font-medium">Updated</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.length ? (
                    filteredApplications.map((application) => {
                      const isSelected = application.id === selectedApplication?.id;
                      const bidder = usersById.get(application.bidderId);
                      const caller = usersById.get(application.callerId);
                      const developer = usersById.get(application.developerId);
                      const canManage = canManageApplication(application);

                      return (
                        <tr
                          key={application.id}
                          className={
                            isSelected
                              ? "cursor-pointer border-t bg-primary/5 transition-colors"
                              : "cursor-pointer border-t transition-colors hover:bg-muted/30"
                          }
                          onClick={() => setSelectedId(application.id)}
                        >
                          <td className="px-5 py-4 align-top">
                            <div className="space-y-1">
                              <div className="font-semibold text-foreground">{application.jobTitle}</div>
                              <div className="text-muted-foreground">{application.company}</div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CalendarDays className="size-3.5" />
                                {formatDate(application.date)}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="space-y-2">
                              <StatusBadge status={application.status} />
                              <div className="text-xs text-muted-foreground">{application.resumeVersion}</div>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="space-y-2 text-xs">
                              <OwnerLine label="Bidder" value={bidder?.name ?? "Unassigned"} />
                              <OwnerLine label="Caller" value={caller?.name ?? "Unassigned"} />
                              <OwnerLine label="Dev" value={developer?.name ?? "Unassigned"} />
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="space-y-2">
                              <StatusBadge status={application.releaseStatus} />
                              <StatusBadge status={application.paymentStatus} />
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top text-muted-foreground">
                            {formatUpdatedAt(application.updatedAt)}
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="flex items-center justify-end gap-2">
                              {canManage ? (
                                <>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Edit ${application.company}`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openEdit(application);
                                    }}
                                  >
                                    <Pencil className="size-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Delete ${application.company}`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setDeleteTarget(application);
                                    }}
                                  >
                                    <Trash2 className="size-4 text-destructive" />
                                  </Button>
                                </>
                              ) : (
                                <span className="text-xs font-medium text-muted-foreground">Read only</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center">
                          <div className="rounded-full bg-muted p-3">
                            <BriefcaseBusiness className="size-5 text-muted-foreground" />
                          </div>
                          <p className="font-semibold">No applications match the current filters.</p>
                          <p className="text-sm text-muted-foreground">
                            Clear the filters or create a fresh record to restart this lane.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-24">
          <CardHeader>
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle>{selectedApplication?.jobTitle ?? "No application selected"}</CardTitle>
                  <CardDescription>{selectedApplication?.company ?? "Pick a record to inspect the workflow details."}</CardDescription>
                </div>
                {selectedApplication ? <StatusBadge status={selectedApplication.status} /> : null}
              </div>
              {selectedApplication ? (
                <div className="flex flex-wrap gap-2">
                  <a
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    href={selectedApplication.jdLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open JD
                    <ArrowUpRight className="size-4" />
                  </a>
                  {canManageApplication(selectedApplication) ? (
                    <Button type="button" variant="outline" onClick={() => openEdit(selectedApplication)}>
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            {selectedApplication ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailBox
                    label="Applied"
                    value={formatDate(selectedApplication.date)}
                    icon={CalendarDays}
                  />
                  <DetailBox
                    label="Resume version"
                    value={selectedApplication.resumeVersion}
                    icon={ShieldCheck}
                  />
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Team ownership
                  </p>
                  <div className="mt-3 grid gap-3">
                    <MemberRow
                      label="Bidder"
                      user={usersById.get(selectedApplication.bidderId)}
                    />
                    <MemberRow
                      label="Caller"
                      user={usersById.get(selectedApplication.callerId)}
                    />
                    <MemberRow
                      label="Developer"
                      user={usersById.get(selectedApplication.developerId)}
                    />
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Commercial state
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusBadge status={selectedApplication.releaseStatus} />
                    <StatusBadge status={selectedApplication.paymentStatus} />
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Workflow notes
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {selectedApplication.notes}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Last updated
                  </p>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {formatUpdatedAt(selectedApplication.updatedAt)}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Choose an application from the table to review the record details.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {formMode ? (
        <ApplicationFormSheet
          application={editingApplication}
          bidders={bidders}
          callers={callers}
          currentUser={currentUser}
          developers={developers}
          isPending={isPending}
          mode={formMode}
          onClose={closeForm}
          onSubmit={handleSave}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteApplicationDialog
          application={deleteTarget}
          isPending={isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </>
  );
}

function ApplicationFormSheet({
  application,
  bidders,
  callers,
  currentUser,
  developers,
  isPending,
  mode,
  onClose,
  onSubmit
}: {
  application: JobApplication | null;
  bidders: User[];
  callers: User[];
  currentUser: User;
  developers: User[];
  isPending: boolean;
  mode: FormMode;
  onClose: () => void;
  onSubmit: (values: ApplicationInput) => void;
}) {
  const form = useForm<ApplicationInput>({
    resolver: zodResolver(applicationInputSchema),
    defaultValues: getDefaultValues({
      bidders,
      callers,
      developers,
      currentUser,
      application
    })
  });

  useEffect(() => {
    form.reset(
      getDefaultValues({
        bidders,
        callers,
        developers,
        currentUser,
        application
      })
    );
  }, [application, bidders, callers, currentUser, developers, form]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <div className="h-full w-full max-w-2xl overflow-y-auto border-l bg-background shadow-2xl">
        <div className="flex min-h-full flex-col">
          <div className="border-b px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                  {mode === "create" ? "Create application" : "Edit application"}
                </p>
                <h2 className="text-xl font-semibold text-foreground">
                  {mode === "create"
                    ? "Add a fresh opportunity to the pipeline"
                    : "Update assignment, stage, and finance details"}
                </h2>
              </div>
              <Button type="button" variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>

          <form
            className="flex flex-1 flex-col"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <div className="grid flex-1 gap-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldWrapper label="Application date" error={form.formState.errors.date?.message}>
                  <Input type="date" {...form.register("date")} />
                </FieldWrapper>
                <FieldWrapper label="Resume version" error={form.formState.errors.resumeVersion?.message}>
                  <Input placeholder="v2.3" {...form.register("resumeVersion")} />
                </FieldWrapper>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FieldWrapper label="Job title" error={form.formState.errors.jobTitle?.message}>
                  <Input placeholder="Senior Full Stack Engineer" {...form.register("jobTitle")} />
                </FieldWrapper>
                <FieldWrapper label="Company" error={form.formState.errors.company?.message}>
                  <Input placeholder="Northstar Labs" {...form.register("company")} />
                </FieldWrapper>
              </div>

              <FieldWrapper label="Job description URL" error={form.formState.errors.jdLink?.message}>
                <Input placeholder="https://company.com/jobs/role" {...form.register("jdLink")} />
              </FieldWrapper>

              <div className="grid gap-4 md:grid-cols-3">
                <FieldWrapper label="Bidder owner" error={form.formState.errors.bidderId?.message}>
                  <Select
                    {...form.register("bidderId")}
                    disabled={currentUser.role === "bidder"}
                  >
                    {bidders.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </Select>
                </FieldWrapper>
                <FieldWrapper label="Caller owner" error={form.formState.errors.callerId?.message}>
                  <Select {...form.register("callerId")}>
                    {callers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </Select>
                </FieldWrapper>
                <FieldWrapper label="Developer owner" error={form.formState.errors.developerId?.message}>
                  <Select {...form.register("developerId")}>
                    {developers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </Select>
                </FieldWrapper>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FieldWrapper label="Pipeline stage" error={form.formState.errors.status?.message}>
                  <Select {...form.register("status")}>
                    {pipelineStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </FieldWrapper>
                <FieldWrapper label="Release state" error={form.formState.errors.releaseStatus?.message}>
                  <Select {...form.register("releaseStatus")}>
                    {releaseStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </FieldWrapper>
                <FieldWrapper label="Payment state" error={form.formState.errors.paymentStatus?.message}>
                  <Select {...form.register("paymentStatus")}>
                    {paymentStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </FieldWrapper>
              </div>

              <FieldWrapper label="Workflow notes" error={form.formState.errors.notes?.message}>
                <Textarea
                  placeholder="Capture the current outreach, interview, or commercial context."
                  className="min-h-[160px]"
                  {...form.register("notes")}
                />
              </FieldWrapper>
            </div>

            <div className="flex flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? mode === "create"
                    ? "Creating..."
                    : "Saving..."
                  : mode === "create"
                    ? "Create application"
                    : "Save changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function DeleteApplicationDialog({
  application,
  isPending,
  onCancel,
  onConfirm
}: {
  application: JobApplication;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Delete application?</CardTitle>
          <CardDescription>
            This removes <span className="font-semibold text-foreground">{application.company}</span> and cascades related interviews, releases, and task links.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? "Deleting..." : "Delete application"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FieldWrapper({
  children,
  error,
  label
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

function SummaryPill({
  icon: Icon,
  label,
  tone,
  value
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  tone: "blue" | "teal" | "amber" | "slate";
  value: string;
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    teal: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
  } as const;

  return (
    <div className="rounded-lg border bg-background/75 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className={`flex size-10 items-center justify-center rounded-full ${tones[tone]}`}>
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

function GuardrailRow({
  detail,
  label,
  value
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
        <p className="text-xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function OwnerLine({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function DetailBox({
  icon: Icon,
  label,
  value
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-3 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MemberRow({
  label,
  user
}: {
  label: string;
  user?: User;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRound className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{user?.email ?? "Not assigned"}</p>
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground">{user?.name ?? "Pending"}</p>
    </div>
  );
}
