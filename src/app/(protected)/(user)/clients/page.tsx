import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import ListClients from "./list-clients";

export async function generateMetadata() {
  const locale = (await cookies()).get("locale")?.value || "en";
  const t = await getTranslations({ locale, namespace: "list_clients" });
  return { title: `${t("clients")} | Kizuna` };
}

export default async function Page() {
  return <ListClients />;
}
