"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function DateRangePicker() {
  const [range, setRange] = useState("30");

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-line md:flex-row md:items-center">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <CalendarDays className="size-4" aria-hidden="true" />
        Date range
      </div>
      <Select
        aria-label="Quick date range"
        value={range}
        onChange={(event) => setRange(event.target.value)}
        className="md:w-[140px]"
      >
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
      </Select>
      <Input aria-label="Start date" type="date" defaultValue="2026-05-12" className="md:w-[150px]" />
      <Input aria-label="End date" type="date" defaultValue="2026-06-10" className="md:w-[150px]" />
      <Button type="button" variant="secondary" size="sm">
        Apply
      </Button>
    </div>
  );
}
