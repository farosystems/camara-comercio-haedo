import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);
const isIgnoredRoute = createRouteMatcher(["/api/webhook(.*)", "/api/permissions(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Skip ignored routes
  if (isIgnoredRoute(req)) {
    return NextResponse.next();
  }

  // Si el usuario está autenticado y está en la página de sign-in, redirigir a home
  if (userId && req.nextUrl.pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // Si el usuario no está autenticado y no está en una ruta pública, redirigir a sign-in
  if (!userId && !isPublicRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Permitir la continuación normal
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
