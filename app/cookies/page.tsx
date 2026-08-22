import type { Metadata } from "next";
import { LegalPage, H2, H3, P, Ul, Li, Strong } from "@/components/legal";
import { CookiePreferences } from "@/components/consent";

export const metadata: Metadata = {
  title: "Cookie Policy — DraftEdge",
  description:
    "How DraftEdge uses cookies and local storage, and how to manage your choices under the ePrivacy Directive and GDPR.",
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated="August 22, 2026">
      <P>
        This policy explains how DraftEdge uses cookies and similar
        technologies (such as local storage) and the choices you have over
        them. It is designed to comply with the{" "}
        <Strong>ePrivacy Directive (2002/58/EC)</Strong>, the{" "}
        <Strong>General Data Protection Regulation (GDPR)</Strong>, the{" "}
        <Strong>California Consumer Privacy Act (CCPA/CPRA)</Strong>, and other
        applicable data protection and cookie regulations.
      </P>

      {/* ── 1. What are cookies ──────────────────────────── */}
      <H2>1. What are cookies?</H2>
      <P>
        Cookies are small text files stored on your device by your browser.
        Local storage is a similar browser feature that stores data on your
        device without sending it with every request. Both are used to make
        websites work and remember your preferences. Cookies can be{" "}
        <Strong>first-party</Strong> (set by DraftEdge) or{" "}
        <Strong>third-party</Strong> (set by an external service embedded in
        the page).
      </P>
      <P>
        Cookies can also be classified by duration:{" "}
        <Strong>session cookies</Strong> are deleted when you close your
        browser, while <Strong>persistent cookies</Strong> remain until they
        expire or are manually deleted.
      </P>

      {/* ── 2. Cookies we use ─────────────────────────────── */}
      <H2>2. Cookies and technologies we use</H2>

      <H3>2.1 Strictly necessary cookies</H3>
      <P>
        These are required for the Service to function and{" "}
        <Strong>cannot be switched off</Strong>. They are set only in response
        to actions you take, such as signing in. Under the ePrivacy Directive,
        strictly necessary cookies do not require consent because they are
        essential to the service you have explicitly requested.
      </P>
      <Ul>
        <Li>
          <Strong>Supabase auth cookies</Strong> (e.g.{" "}
          <code className="rounded bg-zinc-800 px-1 py-px text-xs">
            sb-*-auth-token
          </code>
          ) — keep you signed in and secure your session. Set by Supabase Auth
          when you log in. These are httpOnly, Secure, and SameSite=Lax
          session cookies that expire when you sign out or after 30 days of
          inactivity.
        </Li>
        <Li>
          <Strong>DraftEdge consent cookie</Strong> (
          <code className="rounded bg-zinc-800 px-1 py-px text-xs">
            draftedge_consent
          </code>
          ) — remembers your cookie preferences for this browser. A persistent
          cookie that expires after 12 months.
        </Li>
      </Ul>

      <H3>2.2 Preference cookies</H3>
      <P>
        These remember choices you make so the Service is more convenient, such
        as your consent decision, display settings, and scoring format. In demo
        mode, your league and draft data are also saved in local storage on
        your device.
      </P>
      <Ul>
        <Li>
          <Strong>Local storage data (demo mode):</Strong> account, league, and
          draft data stored entirely in your browser. This data never leaves
          your device and is cleared when you clear your browser data.
        </Li>
      </Ul>

      <H3>2.3 Analytics cookies</H3>
      <P>
        DraftEdge <Strong>does not currently use analytics cookies</Strong>. We
        do not embed Google Analytics, Mixpanel, Amplitude, Hotjar, or any
        similar analytics service. If we add analytics in the future, we will:
      </P>
      <Ul>
        <Li>
          Obtain your explicit consent before setting any analytics cookies.
        </Li>
        <Li>
          Use a privacy-focused, cookieless analytics solution where possible
          (e.g. Plausible, Fathom, or Umami).
        </Li>
        <Li>
          Update this policy to describe the specific cookies and their
          purposes.
        </Li>
      </Ul>

      <H3>2.4 Marketing / advertising cookies</H3>
      <P>
        DraftEdge <Strong>does not use marketing or advertising cookies</Strong>.
        We do not serve ads, use retargeting pixels, or participate in
        behavioural advertising networks. The consent manager below lets you
        record your preference for this category in advance, so it is respected
        if optional integrations are ever added.
      </P>

      <H3>2.5 Third-party cookies</H3>
      <P>
        DraftEdge does not embed any third-party content that sets cookies
        (e.g. no YouTube embeds, no social media widgets, no ad scripts). The
        only third-party services involved in operating the Service are:
      </P>
      <Ul>
        <Li>
          <Strong>Supabase</Strong> — sets the auth session cookie described
          above.
        </Li>
        <Li>
          <Strong>Google</Strong> — if you choose &quot;Continue with
          Google,&quot; Google may set its own cookies during the OAuth flow.
          These are governed by{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-300 hover:underline"
          >
            Google&apos;s privacy policy
          </a>
          .
        </Li>
      </Ul>

      {/* ── 3. Do Not Track ────────────────────────────────── */}
      <H2>3. Do Not Track (DNT) signals</H2>
      <P>
        DraftEdge respects the{" "}
        <Strong>Do Not Track (DNT)</Strong> and{" "}
        <Strong>Global Privacy Control (GPC)</Strong> browser signals. When a
        DNT or GPC signal is detected:
      </P>
      <Ul>
        <Li>
          We treat it as an opt-out of any optional cookies (analytics,
          marketing), even if the user has not made an explicit choice through
          our consent banner.
        </Li>
        <Li>
          We do not load any third-party scripts that would set tracking
          cookies.
        </Li>
        <Li>
          Strictly necessary cookies (auth session, consent preference) are
          still set because they are essential for the Service to function.
        </Li>
      </Ul>
      <P>
        Under the CCPA, the GPC signal is recognised as a valid opt-out of the
        &quot;sale&quot; or &quot;sharing&quot; of personal information. Since
        DraftEdge does not sell or share personal information, the GPC signal
        functions as an additional safeguard.
      </P>

      {/* ── 4. Local storage ──────────────────────────────── */}
      <H2>4. Local storage (demo mode)</H2>
      <P>
        If you use DraftEdge without connecting Supabase, your account, league,
        and draft data are stored in your browser&apos;s local storage. This
        data:
      </P>
      <Ul>
        <Li>
          Never leaves your device — no network requests are made with this
          data.
        </Li>
        <Li>
          Is not accessible to other websites or third-party scripts.
        </Li>
        <Li>
          Can be cleared at any time through your browser&apos;s settings
          (typically &quot;Clear browsing data&quot; → &quot;Site data&quot;).
        </Li>
      </Ul>

      {/* ── 5. Your choices ────────────────────────────────── */}
      <H2>5. Your choices</H2>
      <P>You can manage your cookie preferences in several ways:</P>
      <Ul>
        <Li>
          <Strong>DraftEdge consent manager:</Strong> use the interactive
          controls below to accept or reject optional cookie categories. Your
          choice is saved to both localStorage and a first-party cookie, so it
          persists across sessions.
        </Li>
        <Li>
          <Strong>Browser settings:</Strong> most browsers allow you to block
          or delete cookies. Note that blocking strictly necessary cookies may
          prevent you from signing in or using the Service.
        </Li>
        <Li>
          <Strong>Browser extensions:</Strong> privacy-focused browser
          extensions (e.g. uBlock Origin, Privacy Badger) can block or manage
          cookies on your behalf.
        </Li>
        <Li>
          <Strong>GPC/DNT:</Strong> enable Do Not Track or Global Privacy
          Control in your browser to automatically opt out of optional cookies.
        </Li>
      </Ul>

      <CookiePreferences />

      {/* ── 6. Changes ────────────────────────────────────── */}
      <H2>6. Changes to this policy</H2>
      <P>
        We may update this policy when we add new cookie categories or change
        how we use existing ones. Material changes will be reflected by
        updating the &quot;Last updated&quot; date above and will trigger a new
        consent request so you can review and update your choices.
      </P>

      {/* ── 7. Contact ────────────────────────────────────── */}
      <H2>7. Contact</H2>
      <P>
        Questions about this policy? Email{" "}
        <a
          href="mailto:support@draftedge.app"
          className="font-semibold text-emerald-300 hover:underline"
        >
          support@draftedge.app
        </a>
        .
      </P>
    </LegalPage>
  );
}
