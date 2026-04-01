"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { currencyLocaleMapper } from "@/lib/mappers/curerncy-locale.mapper";
import { cn } from "@/lib/utils/cn";
import React from "react";

type Props = {
  className?: string;
  value: number; // in cents
  onChange: (value: number) => void;
};

export const InputCurrency = ({ value, onChange, className }: Props) => {
  const { data } = useAuth();
  const config = currencyLocaleMapper[data?.locale ?? "en"];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.currency,
    }).format(value / 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    onChange(Number(digits));
  };

  return (
    <input
      inputMode="numeric"
      onChange={handleChange}
      value={formatCurrency(value)}
      className={cn(
        "bg-input/30 border-primary/40 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 rounded border px-3 py-1 text-base transition-colors file:h-7 file:text-sm file:font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "data-[invalid=true]:border-red-900 data-[invalid=true]:ring-red-900",
        className,
      )}
    />
  );
};
