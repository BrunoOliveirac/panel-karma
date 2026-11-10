import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Next fills `x-forwarded-for` from the socket when the header is absent.
 * Only a literal IP is forwarded, so the API can key the bucket by the browser.
 */
function browserIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const candidate =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "";

  return isIp(candidate) ? candidate : null;
}

function isIp(value: string): boolean {
  if (!value || value.length > 64) return false;

  if (value.includes(":")) return /^[0-9a-fA-F:.]+$/.test(value);

  const parts = value.split(".");
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const octet = Number(part);
    return octet >= 0 && octet <= 255;
  });
}

async function proxyRequest(
  request: NextRequest,
  path: string[],
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const targetPath = path.join("/");
  const url = `${API_URL}/${targetPath}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("Content-Type");

  if (contentType) headers.set("Content-Type", contentType);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const ip = browserIp(request);
  if (ip) headers.set("X-Forwarded-For", ip);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.text() : undefined;

  const response = await fetch(url, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseBody = await response.text();
  const responseHeaders = new Headers();
  responseHeaders.set(
    "Content-Type",
    response.headers.get("Content-Type") || "application/json",
  );

  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) responseHeaders.set("Retry-After", retryAfter);

  return new NextResponse(responseBody, {
    status: response.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}
