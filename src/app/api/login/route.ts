import { parseISO } from "date-fns";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { token, user, expirationDate } = await request.json();

  const cookieStore = await cookies();
  const expires = parseISO(expirationDate);

  cookieStore.set("token", token, { expires });
  cookieStore.set("user", JSON.stringify(user), { expires });
  cookieStore.set("expiresAt", JSON.stringify(expirationDate), { expires });

  return Response.json({ ok: true });
}
