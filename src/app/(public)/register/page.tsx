import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import Register from "./register";

export async function generateMetadata() {
  const locale = (await cookies()).get("locale")?.value || "en";
  const t = await getTranslations({ locale, namespace: "register" });
  return { title: `${t("register")} | Karma` };
}

export default async function Page() {
  return <Register />;
}
