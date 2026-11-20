"use client";

import { PeriodPicker } from "@/components/ui/period-picker";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { useTranslations } from "next-intl";

type TicketFiltersProps = {
  search: string;
  endDate: string;
  startDate: string;
  className?: string;
  onSearchChange: (value: string) => void;
  onPeriodChange: (startDate: string, endDate: string) => void;
};

export default function TicketFilters({
  search,
  endDate,
  startDate,
  className,
  onSearchChange,
  onPeriodChange,
}: TicketFiltersProps) {
  const t = useTranslations("home");

  return (
    <div
      data-slot="ticket-filters"
      className={cn(
        "flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center",
        className,
      )}
    >
      <Input
        value={search}
        data-slot="ticket-search"
        placeholder={t("search")}
        className="sm:min-w-0 sm:flex-1"
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <PeriodPicker
        endDate={endDate}
        startDate={startDate}
        onChange={onPeriodChange}
      />
    </div>
  );
}
