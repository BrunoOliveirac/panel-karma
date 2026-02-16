import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const token = req.cookies.get("auth");

  const isProtected = req.nextUrl.pathname === "/";
  const isLogin = req.nextUrl.pathname === "/login";

  if (!token && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
