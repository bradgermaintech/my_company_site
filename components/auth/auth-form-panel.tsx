"use client";

import { useState, useTransition } from "react";
import { Chrome, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { signIn } from "next-auth/react";
import { getPrimaryDashboardRoute } from "@/lib/auth-routes";
import type { UserRole } from "@/lib/models";
import { cn } from "@/lib/utils";
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

type AuthFormPanelProps = {
  hasGoogleAuth: boolean;
};

type Mode = "signin" | "signup";

const showGoogleSignIn = false;
const showSelfSignup = false;

export function AuthFormPanel({ hasGoogleAuth }: AuthFormPanelProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleGoogleLogin() {
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  function handleCredentialsSignIn(formData: FormData) {
    setError("");

    startTransition(async () => {
      const email = String(formData.get("signin-email") ?? "");
      const password = String(formData.get("signin-password") ?? "");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard"
      });

      if (!result || result.error) {
        setError("Incorrect email or password.");
        return;
      }

      window.location.href = result.url ?? "/dashboard";
    });
  }

  function handleRegister(formData: FormData) {
    setError("");

    startTransition(async () => {
      const name = String(formData.get("signup-name") ?? "");
      const email = String(formData.get("signup-email") ?? "");
      const password = String(formData.get("signup-password") ?? "");
      const role = String(formData.get("signup-role") ?? "bidder") as UserRole;

      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role
        })
      });

      if (!registerResponse.ok) {
        const payload = (await registerResponse.json().catch(() => null)) as
          | { message?: string }
          | null;
        setError(payload?.message ?? "We could not create your account.");
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: getPrimaryDashboardRoute(role)
      });

      if (!signInResult || signInResult.error) {
        setError("Account created, but automatic sign in failed.");
        return;
      }

      window.location.href = signInResult.url ?? getPrimaryDashboardRoute(role);
    });
  }

  return (
    <Card className="border-white/10 bg-slate-950/80 text-white shadow-2xl backdrop-blur">
      <CardHeader className="gap-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl text-white">
              {showSelfSignup && mode === "signup" ? "Create account" : "Sign in"}
            </CardTitle>
            <CardDescription className="mt-1 text-slate-300">
              {showSelfSignup && mode === "signup"
                ? "Set up your role and enter the agency workspace with a real account."
                : "Access your workspace with your agency email account."}
            </CardDescription>
          </div>
 
          {showSelfSignup ? (
            <div className="grid min-w-[220px] grid-cols-2 rounded-xl border border-white/10 bg-slate-900/70 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={cn(
 
                "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                mode === "signin"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={cn(
 
                "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                mode === "signup"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              Sign up
            </button>
            </div>
          ) : null}
        </div>

        {showGoogleSignIn ? (
          <div className="grid gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={!hasGoogleAuth || isPending}
            onClick={handleGoogleLogin}
            className="h-11 border-white/12 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Chrome className="size-4" aria-hidden="true" />
            Continue with Google
          </Button>
          {!hasGoogleAuth ? (
            <p className="text-xs text-slate-400">
              Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to enable Gmail sign-in.
            </p>
          ) : null}
          </div>
        ) : null}
      </CardHeader>

      <CardContent>
        {mode === "signin" || !showSelfSignup ? (
          <form action={handleCredentialsSignIn} className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="signin-email" className="text-slate-200">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="signin-email"
                  name="signin-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@alignops.dev"
                  className="h-11 border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="signin-password" className="text-slate-200">
                Password
              </Label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="signin-password"
                  name="signin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-11 border-white/10 bg-white/5 px-9 text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={isPending} className="h-11">
              {isPending ? "Signing in" : "Continue to workspace"}
            </Button>
          </form>
        ) : (
          <form action={handleRegister} className="grid gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-name" className="text-slate-200">
                Full name
              </Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="signup-name"
                  name="signup-name"
                  type="text"
                  placeholder="Avery Brooks"
                  className="h-11 border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="signup-email" className="text-slate-200">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  name="signup-email"
                  type="email"
                  placeholder="avery@alignops.dev"
                  className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="signup-role" className="text-slate-200">
                  Role
                </Label>
                <Select
                  id="signup-role"
                  name="signup-role"
                  defaultValue="bidder"
                  className="h-11 border-white/10 bg-white/5 text-white"
                >
                  <option value="admin">Admin</option>
                  <option value="bidder">Bidder</option>
                  <option value="caller">Caller</option>
                  <option value="developer">Developer</option>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="signup-password" className="text-slate-200">
                Password
              </Label>
              <Input
                id="signup-password"
                name="signup-password"
                type="password"
                placeholder="At least 8 characters"
                className="h-11 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={isPending} className="h-11">
              {isPending ? "Creating account" : "Create account"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
