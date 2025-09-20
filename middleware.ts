// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in", "/sign-up", "/api/webhook"]);

export default clerkMiddleware({
  beforeAuth: (req) => {
    if (isPublicRoute(req)) return; // allow public routes
  },
  afterAuth: (auth, req, evt) => {
    if (!auth.userId && !isPublicRoute(req)) {
      return auth.redirectToSignIn({ returnBackUrl: req.url });
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
