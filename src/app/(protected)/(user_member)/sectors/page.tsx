import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import ListSectors from "./_list-sectors/list-sectors";

export async function generateMetadata() {
  const locale = (await cookies()).get("locale")?.value || "en";
  const t = await getTranslations({ locale, namespace: "list_sectors" });
  return { title: `${t("sectors")} | Karma` };
}

export default async function Page() {
  return <ListSectors />;
}
