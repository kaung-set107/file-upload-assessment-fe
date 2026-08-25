import { NextRequest, NextResponse } from "next/server";

type Role = "admin" | "user";

const roleRoutes: {
  path: string;
  roles: Role[];
}[] = [
  {
    path: "/dashboard/users",
    roles: ["admin"],
  },
  {
    path: "/dashboard/uploads",
    roles: ["user"],
  },
];

function getJwtPayload(token: string) {
  try {
    const payload = token.split(".")[1];

    if (!payload) return null;

    return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;

  const { pathname } = request.nextUrl;

  const isDashboardRoute = pathname.startsWith("/dashboard");

  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isDashboardRoute && !token) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (token && isAuthRoute) {
    const payload = getJwtPayload(token);

    if (payload?.role === "admin") {
      return NextResponse.redirect(new URL("/dashboard/users", request.url));
    }

    return NextResponse.redirect(new URL("/dashboard/uploads", request.url));
  }

  if (token && isDashboardRoute) {
    const payload = getJwtPayload(token);

    if (!payload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const role = payload.role as Role;

    const matchedRoute = roleRoutes.find((route) =>
      pathname.startsWith(route.path),
    );

    if (matchedRoute && !matchedRoute.roles.includes(role)) {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/dashboard/users", request.url));
      }

      return NextResponse.redirect(new URL("/dashboard/uploads", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
