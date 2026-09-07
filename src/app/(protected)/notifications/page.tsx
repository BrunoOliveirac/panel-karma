import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import Notifications from "./notifications";

export async function generateMetadata() {
  const locale = (await cookies()).get("locale")?.value || "en";
  const t = await getTranslations({ locale, namespace: "notifications" });
  return { title: `${t("notification_center")} | Karma` };
}

export default async function Page() {
  return <Notifications />;
}
