"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, Save } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { User } from "@/lib/models";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["manager", "bidder", "caller", "developer"]),
  timezone: z.string().min(1),
  bio: z.string().min(20),
  dailyDigest: z.boolean(),
  releaseAlerts: z.boolean(),
  interviewAlerts: z.boolean()
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(10, "Use at least 10 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password.")
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function SettingsProfileForm({ currentUser }: { currentUser: User }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    reset
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      timezone: "America/Los_Angeles",
      bio: `${currentUser.name} is working in the ${currentUser.role} lane and uses this workspace for pipeline visibility, interview coordination, and release follow-through.`,
      dailyDigest: true,
      releaseAlerts: true,
      interviewAlerts: true
    }
  });
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      confirmPassword: "",
      currentPassword: "",
      newPassword: ""
    }
  });

  useEffect(() => {
    reset({
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      timezone: "America/Los_Angeles",
      bio: `${currentUser.name} is working in the ${currentUser.role} lane and uses this workspace for pipeline visibility, interview coordination, and release follow-through.`,
      dailyDigest: true,
      releaseAlerts: true,
      interviewAlerts: true
    });
  }, [currentUser, reset]);

  function onSubmit() {
    return Promise.resolve();
  }

  function updatePassword(values: PasswordForm) {
    setPasswordFeedback(null);
    startPasswordTransition(() => {
      void (async () => {
        const response = await fetch("/api/profile/password", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(values)
        });
        const payload = await response.json();

        if (!response.ok) {
          setPasswordFeedback({
            tone: "error",
            message: payload.error ?? "Unable to update password."
          });
          return;
        }

        passwordForm.reset({
          confirmPassword: "",
          currentPassword: "",
          newPassword: ""
        });
        setPasswordFeedback({
          tone: "success",
          message: "Password updated successfully."
        });
      })();
    });
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Profile settings</CardTitle>
            <CardDescription>
              Manage the workspace identity and defaults visible to the agency team.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register("name")} />
                {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="role">Default role</Label>
                <Select id="role" {...register("role")}>
                  <option value="manager">Manager</option>
                  <option value="bidder">Bidder</option>
                  <option value="caller">Caller</option>
                  <option value="developer">Developer</option>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select id="timezone" {...register("timezone")}>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="UTC">UTC</option>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bio">Profile note</Label>
              <Textarea id="bio" {...register("bio")} />
              {errors.bio ? <p className="text-sm text-destructive">{errors.bio.message}</p> : null}
            </div>

            <div className="flex justify-end">
              <Button type="submit">
                <Save className="size-4" aria-hidden="true" />
                Save profile
              </Button>
            </div>
            {isSubmitSuccessful ? (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                Profile settings saved for this mock workspace.
              </p>
            ) : null}
          </CardContent>
        </form>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2 2xl:flex 2xl:flex-col">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Update password</CardTitle>
            <CardDescription>
              Change the password for your agency email sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-5">
            <form className="grid gap-4" onSubmit={passwordForm.handleSubmit(updatePassword)}>
              <PasswordField
                error={passwordForm.formState.errors.currentPassword?.message}
                label="Current password"
                registration={passwordForm.register("currentPassword")}
                visible={passwordVisible}
              />
              <PasswordField
                error={passwordForm.formState.errors.newPassword?.message}
                label="New password"
                registration={passwordForm.register("newPassword")}
                visible={passwordVisible}
              />
              <PasswordField
                error={passwordForm.formState.errors.confirmPassword?.message}
                label="Confirm new password"
                registration={passwordForm.register("confirmPassword")}
                visible={passwordVisible}
              />

              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <Button
                  type="button"
                  variant="ghost"
                  className="justify-start px-2"
                  onClick={() => setPasswordVisible((current) => !current)}
                >
                  {passwordVisible ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                  {passwordVisible ? "Hide passwords" : "Show passwords"}
                </Button>
                <Button type="submit" className="whitespace-nowrap" disabled={isPasswordPending}>
                  <KeyRound className="size-4" aria-hidden="true" />
                  {isPasswordPending ? "Updating..." : "Update password"}
                </Button>
              </div>

              {passwordFeedback ? (
                <p
                  className={
                    passwordFeedback.tone === "success"
                      ? "rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
                      : "rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
                  }
                >
                  {passwordFeedback.message}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification rules</CardTitle>
            <CardDescription>
              Keep important agency movement visible without flooding the team.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
              <Checkbox {...register("dailyDigest")} />
              <span>
                <span className="block text-sm font-semibold">Daily digest</span>
                <span className="block text-sm leading-6 text-muted-foreground">
                  Pipeline, interviews, releases, and overdue tasks every morning.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
              <Checkbox {...register("releaseAlerts")} />
              <span>
                <span className="block text-sm font-semibold">Release alerts</span>
                <span className="block text-sm leading-6 text-muted-foreground">
                  Notify managers when release or payment states change.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
              <Checkbox {...register("interviewAlerts")} />
              <span>
                <span className="block text-sm font-semibold">Interview alerts</span>
                <span className="block text-sm leading-6 text-muted-foreground">
                  Notify callers and developers before stage-critical calls.
                </span>
              </span>
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PasswordField({
  error,
  label,
  registration,
  visible
}: {
  error?: string;
  label: string;
  registration: UseFormRegisterReturn;
  visible: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input type={visible ? "text" : "password"} autoComplete="new-password" {...registration} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
