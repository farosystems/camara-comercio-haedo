import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up"],
  ignoredRoutes: ["/api/webhook", "/api/permissions/(.*)"],
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in",
  afterAuth: (auth, req, evt) => {
    // Si el usuario está autenticado y está en la página de sign-in, redirigir a home
    if (auth.userId && req.nextUrl.pathname === "/sign-in") {
      return Response.redirect(new URL("/home", req.url));
    }
    
    // Si el usuario no está autenticado y no está en una ruta pública, redirigir a sign-in
    if (!auth.userId && !auth.isPublicRoute) {
      return Response.redirect(new URL("/sign-in", req.url));
    }
    
    // Si el usuario está autenticado y está en la raíz "/", redirigir a home
    if (auth.userId && req.nextUrl.pathname === "/") {
      return Response.redirect(new URL("/home", req.url));
    }
  },
  debug: false,
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
