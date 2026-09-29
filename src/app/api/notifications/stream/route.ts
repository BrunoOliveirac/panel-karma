import { NextRequest } from "next/server";
import { proxyEventStream } from "@/lib/utils/proxy-event-stream";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return proxyEventStream(request, "/notifications/stream");
}
