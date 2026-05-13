import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import Dashboard from "./dashboard";

export async function generateMetadata() {
  const locale = (await cookies()).get("locale")?.value || "en";
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: `${t("dashboard")} | Karma` };
}

export default async function Page() {
  return <Dashboard />;
}
