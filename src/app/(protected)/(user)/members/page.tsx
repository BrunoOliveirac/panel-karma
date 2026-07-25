import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import ListMembers from "./_list-members/list-members";

/**
 * Generate page metadata for the members route.
 */
export async function generateMetadata() {
  const locale = (await cookies()).get("locale")?.value || "en";
  const t = await getTranslations({ locale, namespace: "list_members" });
  return { title: `${t("members")} | Karma` };
}

export default function Page() {
  return <ListMembers />;
}
