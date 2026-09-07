import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(3_000),
      });
    } catch {
      // Best-effort server-side revoke; cookie is cleared regardless.
    }
  }

  cookieStore.delete({ name: "token", path: "/" });
  return Response.json({ ok: true });
}
