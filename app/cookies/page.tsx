import type { Metadata } from "next";
import { LegalPage, H2, P, Ul, Li, Strong } from "@/components/legal";
import { CookiePreferences } from "@/components/consent";

export const metadata: Metadata = {
  title: "Cookie Policy — DraftEdge",
  description: "How DraftEdge uses cookies and local storage, and how to manage your choices.",
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated="August 18, 2026">
      <P>
        This policy explains how DraftEdge uses cookies and similar technologies (such as local
        storage) and the choices you have over them.
      </P>

      <H2>What are cookies?</H2>
      <P>
        Cookies are small text files stored on your device by your browser. Local storage is a
        similar browser feature that stores data on your device without sending it with every
        request. Both are used to make websites work and remember your preferences.
      </P>

      <H2>Cookies we use</H2>

      <H2>Strictly necessary</H2>
      <P>
        These are required for the Service to function and cannot be switched off. They are set only
        in response to actions you take, such as signing in.
      </P>
      <Ul>
        <Li>
          <Strong>Supabase auth cookies</Strong> (e.g. <code className="rounded bg-zinc-800 px-1 py-px text-xs">sb-*-auth-token</code>) —
          keep you signed in and secure your session. Set by Supabase Auth when you log in.
        </Li>
        <Li>
          <Strong>DraftEdge consent cookie</Strong> (<code className="rounded bg-zinc-800 px-1 py-px text-xs">draftedge_consent</code>) —
          remembers your cookie preferences for this browser.
        </Li>
      </Ul>

      <H2>Preferences</H2>
      <P>
        These remember choices you make so the Service is more convenient, such as your consent
        decision and display settings. In demo mode, your league and draft data are also saved in
        local storage on your device.
      </P>

      <H2>Analytics and marketing</H2>
      <P>
        We do not currently use analytics, advertising, or third-party tracking cookies. The consent
        manager below lets you record your preferences for these categories in advance, so they are
        respected if optional integrations are ever added.
      </P>

      <H2>Local storage (demo mode)</H2>
      <P>
        If you use DraftEdge without connecting Supabase, your account, league, and draft data are
        stored in your browser&apos;s local storage. This data never leaves your device. Clearing
        your browser data will remove it.
      </P>

      <H2>Managing your choices</H2>
      <P>
        You can update your preferences at any time below, or clear cookies and site data through
        your browser settings. Most browsers also let you block certain types of cookies.
      </P>

      <CookiePreferences />

      <H2>Contact</H2>
      <P>
        Questions about this policy? Email{" "}
        <a href="mailto:support@draftedge.app" className="font-semibold text-emerald-300 hover:underline">
          support@draftedge.app
        </a>
        .
      </P>
    </LegalPage>
  );
}
