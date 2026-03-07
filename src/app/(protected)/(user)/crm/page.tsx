"use client";

import { useAppStore } from "@/lib/store/use-title-store";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function CRM() {
  const t = useTranslations("crm");
  const setTitle = useAppStore((state) => state.setTitle);

  useEffect(() => {
    document.title = `${t("crm")} | Kizuna`;
    setTitle(t("crm"));
  }, [setTitle, t]);

  return <p>CRM</p>;
}
