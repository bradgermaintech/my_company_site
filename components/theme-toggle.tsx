"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeMode = "day" | "night";
type ThemeToggleProps = {
  compact?: boolean;
};

const storageKey = "pipelineos-theme";

function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "night");
  window.localStorage.setItem(storageKey, mode);
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [mode, setMode] = useState<ThemeMode>("day");

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(storageKey) as ThemeMode | null;
    const activeMode: ThemeMode =
      storedTheme === "night" || storedTheme === "day"
        ? storedTheme
        : document.documentElement.classList.contains("dark")
          ? "night"
          : "day";

    setMode(activeMode);
    applyTheme(activeMode);
  }, []);

  function toggleTheme() {
    setMode((currentMode) => {
      const nextMode = currentMode === "day" ? "night" : "day";
      applyTheme(nextMode);
      return nextMode;
    });
  }

  const isNight = mode === "night";

  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={isNight}
      aria-label={`Switch to ${isNight ? "day" : "night"} mode`}
      onClick={toggleTheme}
      className={cn(
        "justify-between px-3",
        compact ? "h-10 w-auto gap-3" : "h-12 w-full"
      )}
    >
      <span className="flex items-center gap-2">
        {isNight ? (
          <Moon className="size-4" aria-hidden="true" />
        ) : (
          <Sun className="size-4" aria-hidden="true" />
        )}
        <span className={cn(compact && "hidden sm:inline")}>
          {isNight ? "Night mode" : "Day mode"}
        </span>
      </span>
      <span
        className={cn(
          "relative h-6 w-11 rounded-full border bg-muted transition-colors",
          isNight && "bg-primary"
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-background shadow-sm transition-transform",
            isNight && "translate-x-5"
          )}
        />
      </span>
    </Button>
  );
}
