import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contacts/:path*",
    "/lists/:path*",
    "/templates/:path*",
    "/campaigns/:path*",
    "/analytics/:path*",
    "/domains/:path*",
    "/webhooks/:path*",
    "/settings/:path*",
    "/api/contacts/:path*",
    "/api/lists/:path*",
    "/api/templates/:path*",
    "/api/campaigns/:path*",
  ],
};
