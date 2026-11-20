"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IntlLocaleMap } from "@/lib/mappers/intl-locale.mapper";
import {
  calendarCells,
  dateFromIso,
  matchPreset,
  PERIOD_PRESETS,
  PeriodPreset,
  presetRange,
  shiftMonth,
  toIsoDate,
  visibleMonths,
  weekdayIsoDates,
  weekStartsOn,
} from "@/lib/utils/calendar-day";
import { cn } from "@/lib/utils/cn";

type PeriodPickerProps = {
  startDate: string;
  endDate: string;
  className?: string;
  onChange: (startDate: string, endDate: string) => void;
};

type Draft = {
  start: string;
  end: string;
};

function ordered(start: string, end: string): Draft {
  if (start && end && end < start) return { start: end, end: start };
  return { start, end };
}

export function PeriodPicker({
  startDate,
  endDate,
  className,
  onChange,
}: PeriodPickerProps) {
  const t = useTranslations("period");
  const format = useFormatter();
  const locale = useLocale();
  const intlLocale = IntlLocaleMap.get(locale)?.locale ?? "en-US";
  const weekStart = weekStartsOn(intlLocale);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    start: startDate,
    end: endDate,
  });
  const [leftMonth, setLeftMonth] = useState(() =>
    toIsoDate(new Date()).slice(0, 7),
  );
  const [rightMonth, setRightMonth] = useState(() =>
    shiftMonth(toIsoDate(new Date()).slice(0, 7), 1),
  );

  const today = toIsoDate(new Date());
  const activePreset = matchPreset(draft.start, draft.end, today);

  function formatDate(isoDate: string) {
    return format.dateTime(dateFromIso(isoDate), { dateStyle: "medium" });
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      const months = visibleMonths(startDate, endDate, today);
      setDraft(ordered(startDate, endDate));
      setLeftMonth(months.left);
      setRightMonth(months.right);
    }

    setOpen(next);
  }

  function choosePreset(preset: PeriodPreset) {
    const range = presetRange(preset, today);
    const months = visibleMonths(range.startDate, range.endDate, today);
    setDraft({ start: range.startDate, end: range.endDate });
    setLeftMonth(months.left);
    setRightMonth(months.right);
  }

  function selectDay(iso: string) {
    setDraft((current) => {
      if (!current.start || current.end) return { start: iso, end: "" };
      if (iso < current.start) return { start: iso, end: current.start };
      return { start: current.start, end: iso };
    });
  }

  function shiftLeft(delta: number) {
    const next = shiftMonth(leftMonth, delta);
    setLeftMonth(next);
    if (next >= rightMonth) setRightMonth(shiftMonth(next, 1));
  }

  function shiftRight(delta: number) {
    const next = shiftMonth(rightMonth, delta);
    setRightMonth(next);
    if (next <= leftMonth) setLeftMonth(shiftMonth(next, -1));
  }

  function clear() {
    const months = visibleMonths("", "", today);
    setDraft({ start: "", end: "" });
    setLeftMonth(months.left);
    setRightMonth(months.right);
  }

  function apply() {
    const start = draft.start;
    const end = draft.end || draft.start;
    setOpen(false);

    if (start === startDate && end === endDate) return;
    onChange(start, end);
  }

  const rangeLabel =
    draft.start && draft.end
      ? `${formatDate(draft.start)} — ${formatDate(draft.end)}`
      : draft.start
        ? formatDate(draft.start)
        : "—";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="period-picker-trigger"
          aria-label={`${t("start_date")}: ${startDate ? formatDate(startDate) : t("start_date")}. ${t("end_date")}: ${endDate ? formatDate(endDate) : t("end_date")}`}
          className={cn(
            "border-primary/40 bg-input/30 hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full min-w-0 items-center justify-start overflow-hidden rounded border px-3 text-left text-sm transition-colors outline-none focus-visible:ring-[3px] sm:w-auto",
            className,
          )}
        >
          <span className="flex min-w-0 max-w-full items-center gap-2">
            <span
              className={cn(
                "min-w-0 truncate text-sm",
                !startDate && "text-muted-foreground",
              )}
            >
              {startDate ? formatDate(startDate) : t("start_date")}
            </span>

            <span className="shrink-0 text-muted-foreground">—</span>

            <span
              className={cn(
                "min-w-0 truncate text-sm",
                !endDate && "text-muted-foreground",
              )}
            >
              {endDate ? formatDate(endDate) : t("end_date")}
            </span>
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        collisionPadding={12}
        className="w-[min(44rem,calc(100vw-1.5rem))] gap-0 overflow-hidden p-0"
      >
        <div className="flex max-h-[min(40rem,calc(100dvh-1.5rem))] min-h-0 w-full min-w-0 flex-col md:flex-row">
          <div className="grid shrink-0 grid-cols-2 gap-1 border-b border-border p-2 md:flex md:w-44 md:min-h-0 md:flex-col md:overflow-y-auto md:border-r md:border-b-0 md:p-3">
            {PERIOD_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                data-slot={`period-preset-${preset}`}
                aria-pressed={activePreset === preset}
                onClick={() => choosePreset(preset)}
                className={cn(
                  "min-w-0 rounded-lg px-2.5 py-2 text-left text-sm leading-snug transition-colors md:px-3 md:whitespace-nowrap",
                  activePreset === preset
                    ? "bg-primary/20 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t(preset)}
              </button>
            ))}

            <div
              data-slot="period-preset-custom"
              aria-current={activePreset === "custom" ? "true" : undefined}
              className={cn(
                "min-w-0 rounded-lg px-2.5 py-2 text-left text-sm leading-snug md:px-3 md:whitespace-nowrap",
                activePreset === "custom"
                  ? "bg-primary/20 text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {t("custom_range")}
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-3 md:flex-row md:justify-center">
              <MonthCalendar
                panel="left"
                today={today}
                weekStart={weekStart}
                month={leftMonth}
                start={draft.start}
                end={draft.end}
                onShift={shiftLeft}
                onSelect={selectDay}
              />

              <MonthCalendar
                panel="right"
                today={today}
                weekStart={weekStart}
                month={rightMonth}
                start={draft.start}
                end={draft.end}
                onShift={shiftRight}
                onSelect={selectDay}
                className="max-md:hidden"
              />
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-3 py-3">
              <p
                className="min-w-0 flex-1 truncate text-sm"
                data-slot="period-range-label"
              >
                {rangeLabel}
              </p>

              <div className="flex shrink-0 items-center justify-end gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={clear}
                  className="rounded"
                  data-slot="period-clear"
                >
                  {t("clear")}
                </Button>

                <Button
                  size="sm"
                  type="button"
                  onClick={apply}
                  className="rounded"
                  data-slot="period-apply"
                >
                  {t("apply")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

type MonthCalendarProps = {
  month: string;
  panel: "left" | "right";
  start: string;
  end: string;
  today: string;
  weekStart: number;
  className?: string;
  onSelect: (iso: string) => void;
  onShift: (delta: number) => void;
};

function MonthCalendar({
  month,
  panel,
  start,
  end,
  today,
  weekStart,
  className,
  onSelect,
  onShift,
}: MonthCalendarProps) {
  const t = useTranslations("period");
  const format = useFormatter();
  const cells = calendarCells(month, weekStart);
  const weekdays = weekdayIsoDates(weekStart);
  const monthLabel = format.dateTime(dateFromIso(`${month}-01`), {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={cn("w-full min-w-0 md:w-auto md:min-w-58", className)}>
      <div className="mb-2 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          data-slot={`period-prev-${panel}`}
          aria-label={t("previous_month")}
          onClick={() => onShift(-1)}
        >
          <ChevronLeft />
        </Button>

        <span className="text-sm font-medium">{monthLabel}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          data-slot={`period-next-${panel}`}
          aria-label={t("next_month")}
          onClick={() => onShift(1)}
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="grid grid-cols-7">
        {weekdays.map((iso) => (
          <span
            key={iso}
            aria-hidden
            className="flex h-8 items-center justify-center text-xs text-muted-foreground"
          >
            {format.dateTime(dateFromIso(iso), { weekday: "narrow" })}
          </span>
        ))}

        {cells.map((cell) => {
          const isStart = cell.iso === start;
          const isEnd = Boolean(end) && cell.iso === end;

          const inRange = Boolean(
            start && end && cell.iso >= start && cell.iso <= end,
          );

          const isToday = cell.iso === today;

          return (
            <div key={`${panel}-${cell.iso}`} className="relative h-9">
              {inRange && !(isStart && isEnd) ? (
                <span
                  className={cn(
                    "absolute top-1/2 h-8 -translate-y-1/2 bg-primary/25",
                    isStart && "left-1/2 right-0",
                    isEnd && "right-1/2 left-0",
                    !isStart && !isEnd && "inset-x-0",
                  )}
                />
              ) : null}

              <button
                type="button"
                aria-pressed={isStart || isEnd}
                onClick={() => onSelect(cell.iso)}
                data-slot={`period-day-${panel}-${cell.iso}`}
                aria-label={format.dateTime(dateFromIso(cell.iso), {
                  dateStyle: "medium",
                })}
                className={cn(
                  "relative z-10 mx-auto flex size-8 items-center justify-center rounded-full text-sm tabular-nums transition-colors",
                  !cell.inMonth && "text-muted-foreground/50",
                  cell.inMonth && !isStart && !isEnd && "text-foreground",
                  !isStart && !isEnd && "hover:bg-muted",
                  isToday && !isStart && !isEnd && "ring-1 ring-primary",
                  (isStart || isEnd) &&
                    "bg-primary text-primary-foreground hover:bg-primary/80",
                )}
              >
                {Number(cell.iso.slice(8))}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
