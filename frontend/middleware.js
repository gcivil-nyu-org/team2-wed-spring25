export { default } from "next-auth/middleware"

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/dashboard/:path*',
        "/dashboard/:path*",
        "/profile/:path*",
    ],
}