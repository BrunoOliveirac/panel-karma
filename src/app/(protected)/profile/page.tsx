import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import Profile from "./profile";

export async function generateMetadata() {
  const locale = (await cookies()).get("locale")?.value || "en";
  const t = await getTranslations({ locale, namespace: "profile" });
  return { title: `${t("profile")} | Karma` };
}

export default async function Page() {
  return <Profile />;
}
