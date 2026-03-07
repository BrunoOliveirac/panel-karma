import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { UserRouteMap } from "./lib/enums/user-type.enum";
import { SidebarItemMock } from "./lib/mocks/SidebarItemMock";
import { LoggedUser } from "./lib/types/logged-user";

export async function proxy(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  const userCookie = cookieStore.get("user");
  const user: LoggedUser = JSON.parse(userCookie?.value ?? "null");

  const isAuthRoute = ["/login", "/register"].includes(
    request.nextUrl.pathname,
  );

  if (!token && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const sidebarPathItems = user?.type
    ? new SidebarItemMock().getPaths(user.type)
    : [];

  if (
    (token && (isAuthRoute || request.nextUrl.pathname === "/")) ||
    (user && !sidebarPathItems.includes(request.nextUrl.pathname))
  ) {
    return NextResponse.redirect(
      new URL(UserRouteMap.get(user.type) ?? "/home", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
