import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import ListSupports from "./_list-supports/list-supports";

export async function generateMetadata() {
  const locale = (await cookies()).get("locale")?.value || "en";
  const t = await getTranslations({ locale, namespace: "list_supports" });
  return { title: `${t("supports")} | Karma` };
}

export default async function Page() {
  return <ListSupports />;
}
