import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import ListProjects from "./_list-projects/list-projects";

export async function generateMetadata() {
  const locale = (await cookies()).get("locale")?.value || "en";
  const t = await getTranslations({ locale, namespace: "list_projects" });
  return { title: `${t("projects")} | Karma` };
}

export default async function Page() {
  return <ListProjects />;
}
