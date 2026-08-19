import { NextRequest, NextResponse } from "next/server";

/**
 * Strict Content-Security-Policy with a per-request nonce.
 *
 * Next.js reads the `x-nonce` request header during server-side rendering and
 * attaches the nonce to every framework script, page bundle, and inline script
 * it emits — so `script-src` can stay strict ('nonce-…' + 'strict-dynamic',
 * no 'unsafe-inline') without breaking the app.
 *
 * Pages must be dynamically rendered for the nonce to be applied (see
 * `export const dynamic = "force-dynamic"` in app/layout.tsx).
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  // NOTE: keep this template literal ASCII-only (comments included) — the
  // header value must be a valid HTTP ByteString.
  // Inline style attributes (React style={{ ... }}) can't carry a nonce, and
  // CSP ignores 'unsafe-inline' whenever a nonce/hash is present, so style-src
  // is intentionally nonce-free. Styles can't execute scripts; the nonce on
  // script-src is what matters for XSS.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co${isDev ? " ws://localhost:3000" : ""};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;
  // Collapse the template literal's newlines/spacing into a single-line header.
  const contentSecurityPolicyHeaderValue = cspHeader.replace(/\s{2,}/g, " ").trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes — JSON only, no inline scripts)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Plus skip router prefetches, which don't need the CSP header.
     */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
