"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "../utils/set-locale";

export function useLocale() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeLocale(locale: string) {
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return {
    changeLocale,
    isPending,
  };
}
