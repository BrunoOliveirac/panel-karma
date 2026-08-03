import { endOfDay } from "date-fns";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const token = await request.text();
  const cookieStore = await cookies();

  cookieStore.set("token", token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    expires: endOfDay(new Date()),
    secure: process.env.NODE_ENV === "production",
  });

  return Response.json({ ok: true });
}
