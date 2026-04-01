import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import Login from "./login";

export async function generateMetadata() {
  const locale = (await cookies()).get("locale")?.value || "en";
  const t = await getTranslations({ locale, namespace: "login" });
  return { title: `${t("login")} | Kizuna` };
}

export default async function Page() {
  return <Login />;
}
