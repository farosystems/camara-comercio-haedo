import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  ignoredRoutes: ["/api/webhook", "/api/permissions/(.*)"],
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in",
  afterAuth: (auth, req, evt) => {
    // Si el usuario está autenticado y está en la página de sign-in, redirigir a home
    if (auth.userId && req.nextUrl.pathname === "/sign-in") {
      const homeUrl = new URL("/home", req.url);
      return NextResponse.redirect(homeUrl);
    }

    // Si el usuario no está autenticado y no está en una ruta pública, redirigir a sign-in
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Si el usuario está autenticado y está en la raíz "/", redirigir a home
    if (auth.userId && req.nextUrl.pathname === "/") {
      const homeUrl = new URL("/home", req.url);
      return NextResponse.redirect(homeUrl);
    }

    // Permitir la continuación normal
    return NextResponse.next();
  },
  debug: false,
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
