import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import Chat from "./chat";

export async function generateMetadata() {
  const locale = (await cookies()).get("locale")?.value || "en";
  const t = await getTranslations({ locale, namespace: "chat" });
  return { title: `${t("chat")} | Karma` };
}

export default async function Page() {
  return <Chat />;
}
