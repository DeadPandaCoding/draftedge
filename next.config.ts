import type { NextConfig } from "next";

// Static security headers applied to every response.
// The dynamic Content-Security-Policy (per-request nonce) lives in proxy.ts.
const securityHeaders = [
  // Clickjacking protection (superseded by CSP frame-ancestors 'none', kept
  // for older browsers).
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-sniffing of responses.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send the origin on cross-origin requests — full URL never leaks.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable high-privilege browser features we don't use.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  // Cross-origin isolation: no cross-origin window can retain an opener.
  // Safe here because Google OAuth uses a top-level redirect, not a popup.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Only same-origin resources may load our responses (fonts/images are
  // self-hosted via next/font; no cross-origin subresources are used).
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Stop advertising the framework in X-Powered-By (fingerprinting).
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
