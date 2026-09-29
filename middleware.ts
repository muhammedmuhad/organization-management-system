export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/committee/:path*",
    "/faculties/:path*",
    "/households/:path*",
    "/finance/:path*",
    "/events/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};