import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  ignoredRoutes: ["/api/webhook", "/api/permissions/(.*)"],
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in",
  afterAuth(auth, req) {
    // Si el usuario está autenticado y está en la página de sign-in, redirigir a home
    if (auth.userId && req.nextUrl.pathname === "/sign-in") {
      return NextResponse.redirect(new URL("/home", req.url));
    }

    // Si el usuario no está autenticado y no está en una ruta pública, redirigir a sign-in
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Permitir la continuación normal
    return NextResponse.next();
  },
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
