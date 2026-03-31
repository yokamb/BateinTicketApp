import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isCustomer = token?.role === "CUSTOMER";
    const hasRole = Boolean(token?.professionalRole);
    const pathname = req.nextUrl.pathname;

    if (!isCustomer && !hasRole && pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    if ((isCustomer || hasRole) && pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};
