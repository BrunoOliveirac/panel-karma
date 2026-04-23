"use client";

import { useAppStore } from "@/lib/store/use-title-store";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function Home() {
  const t = useTranslations("home");
  const setTitle = useAppStore((state) => state.setTitle);

  useEffect(() => {
    document.title = `${t("home")} | Karma`;
    setTitle(t("home"));
  }, [setTitle, t]);

  return <p>Home</p>;
}
