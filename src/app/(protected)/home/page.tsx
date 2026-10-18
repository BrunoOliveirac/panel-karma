import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import Home from "./home";

/**
 * Generate page metadata for the shared ticket home.
 */
export async function generateMetadata() {
  const locale = (await cookies()).get("locale")?.value || "en";
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: `${t("home")} | Karma` };
}

export default function Page() {
  return <Home />;
}
