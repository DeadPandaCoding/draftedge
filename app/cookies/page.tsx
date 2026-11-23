import type { Metadata } from "next";
import { LegalPage, H2, H3, P, Ul, Li, Strong } from "@/components/legal";
import { CookiePreferences } from "@/components/consent";

export const metadata: Metadata = {
  title: "Cookie Policy — DraftEdge",
  description: "How DraftEdge uses cookies, browser storage, and optional analytics.",
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated="November 22, 2026">
      <P>
        This policy explains how DraftEdge uses cookies and browser storage when you visit <a href="https://draftedge.vercel.app" className="font-semibold text-emerald-300 hover:underline">draftedge.vercel.app</a>.
      </P>

      <H2>1. Cookies and browser storage</H2>
      <P>
        Cookies are small values stored by your browser. Local storage is browser storage that lets a website remember information between visits. DraftEdge uses these technologies for sign-in, consent choices, and product preferences.
      </P>

      <H2>2. What DraftEdge stores</H2>
      <H3>Necessary authentication</H3>
      <P>
        Supabase Auth uses session cookies to keep you signed in and support authenticated features. These are necessary for account access. If you use the local demo mode, demo account and session information is stored in your browser&apos;s local storage instead.
      </P>
      <H3>Consent and preferences</H3>
      <P>
        DraftEdge saves your consent choices in local storage and in a first-party <code>draftedge_consent</code> cookie. The consent cookie lasts up to one year. The app may also use local storage to remember your active league and tool preferences.
      </P>
      <H3>Optional analytics</H3>
      <P>
        Vercel Web Analytics is loaded only after you allow the analytics category in the consent manager. It helps us understand product usage. DraftEdge does not load advertising or cross-site behavioral advertising trackers.
      </P>
      <H3>Google sign-in</H3>
      <P>
        If you choose Google sign-in, Google may use cookies or similar technologies as part of its authentication flow. Those technologies are governed by Google&apos;s own privacy and cookie policies.
      </P>

      <H2>3. ESPN private league credentials</H2>
      <P>
        If you sync a private ESPN league, you may enter your <code>espn_s2</code> and <code>SWID</code> session values. DraftEdge sends them to ESPN in a server-side request to retrieve the league data you requested. The values are not saved in your DraftEdge account or stored as browser cookies by DraftEdge.
      </P>

      <H2>4. Managing your choices</H2>
      <P>
        Use the controls below or the Cookie Settings link to review or change your optional consent choices. You can also clear cookies and local storage in your browser. Clearing necessary authentication storage may sign you out or reset locally saved preferences.
      </P>
      <CookiePreferences />

      <H2>5. Contact</H2>
      <P>
        Questions about this policy? Contact <a href="mailto:anshtolat@gmail.com" className="font-semibold text-emerald-300 hover:underline">anshtolat@gmail.com</a>.
      </P>
    </LegalPage>
  );
}
