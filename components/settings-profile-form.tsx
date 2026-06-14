"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
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

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["admin", "bidder", "caller", "developer"]),
  timezone: z.string().min(1),
  bio: z.string().min(20),
  dailyDigest: z.boolean(),
  releaseAlerts: z.boolean(),
  interviewAlerts: z.boolean()
});

type ProfileForm = z.infer<typeof profileSchema>;

export function SettingsProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful }
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "Maya Benton",
      email: "maya@pipelineos.dev",
      role: "admin",
      timezone: "America/Los_Angeles",
      bio: "Agency operations lead focused on pipeline visibility, release approvals, and high-signal team performance.",
      dailyDigest: true,
      releaseAlerts: true,
      interviewAlerts: true
    }
  });

  function onSubmit() {
    return Promise.resolve();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card>
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
                <option value="admin">Admin</option>
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
      </Card>

      <div className="flex flex-col gap-6">
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
                  Notify admins when release or payment states change.
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
    </form>
  );
}
