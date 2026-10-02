"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { useTranslations } from "next-intl";

type TicketFiltersProps = {
  search: string;
  endDate: string;
  startDate: string;
  className?: string;
  onSearchChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
};

export default function TicketFilters({
  search,
  endDate,
  startDate,
  className,
  onSearchChange,
  onEndDateChange,
  onStartDateChange,
}: TicketFiltersProps) {
  const t = useTranslations("home");

  return (
    <div
      data-slot="ticket-filters"
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-center",
        className,
      )}
    >
      <Input
        value={search}
        data-slot="ticket-search"
        placeholder={t("search")}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <Input
        type="date"
        value={startDate}
        data-slot="ticket-start-date"
        aria-label={t("start_date")}
        onChange={(event) => onStartDateChange(event.target.value)}
      />
      <Input
        type="date"
        value={endDate}
        data-slot="ticket-end-date"
        aria-label={t("end_date")}
        onChange={(event) => onEndDateChange(event.target.value)}
      />
    </div>
  );
}
