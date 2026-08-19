import type { Metadata } from "next";
import { LegalPage, H2, P, Ul, Li, Strong } from "@/components/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — DraftEdge",
  description:
    "How DraftEdge collects, uses, stores, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 18, 2026">
      <P>
        DraftEdge is a free, open-source fantasy football draft assistant. This Privacy Policy
        explains what information we collect, how we use it, and the choices you have. By using
        DraftEdge, you agree to the practices described here.
      </P>

      <H2>Information we collect</H2>
      <Ul>
        <Li>
          <Strong>Account information.</Strong> When you sign up, we collect your name and email
          address. Sign-in is handled by Supabase Auth (email/password or Google OAuth).
        </Li>
        <Li>
          <Strong>League and draft data.</Strong> The league name, scoring format, league size,
          draft position, roster template, logged picks, notes, and your pick counter that you
          create in the app.
        </Li>
        <Li>
          <Strong>Local data.</Strong> When you use the app without connecting Supabase (demo mode),
          your account, league, and draft data are stored only in your browser&apos;s local storage
          and never leave your device.
        </Li>
        <Li>
          <Strong>Player data.</Strong> Player names, teams, positions, and related public metadata
          are fetched from the public Sleeper API. This is public sports data and is not personal
          information about you.
        </Li>
      </Ul>

      <H2>How we use your information</H2>
      <Ul>
        <Li>To create and manage your account and sign you in.</Li>
        <Li>To save your league configuration and draft state and sync it across your devices.</Li>
        <Li>To provide, operate, and improve the DraftEdge service.</Li>
        <Li>To respond to support requests and enforce our Terms of Service.</Li>
      </Ul>

      <H2>Legal bases for processing</H2>
      <Ul>
        <Li>
          <Strong>Performance of a contract:</Strong> processing necessary to provide the service
          you requested (your account, leagues, and drafts).
        </Li>
        <Li>
          <Strong>Consent:</Strong> where you choose to connect your Google account or enable
          optional cookies.
        </Li>
        <Li>
          <Strong>Legitimate interests:</Strong> securing the service and preventing abuse.
        </Li>
      </Ul>

      <H2>How we store and protect your data</H2>
      <P>
        When Supabase is configured, your account, league, and draft data are stored in a Supabase
        Postgres database protected by row-level security, so you can only access your own data.
        Supabase provides industry-standard encryption in transit and at rest. No data is sold,
        rented, or shared with advertisers.
      </P>
      <P>
        We retain your data for as long as your account exists or as needed to provide the service.
        You can delete your leagues from within the app; to delete your account and its data,
        contact us at the address below.
      </P>

      <H2>Third-party services</H2>
      <Ul>
        <Li>
          <Strong>Supabase</Strong> — authentication and database hosting. See{" "}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-300 hover:underline"
          >
            Supabase&apos;s privacy policy
          </a>
          .
        </Li>
        <Li>
          <Strong>Sleeper</Strong> — we fetch public player metadata from the Sleeper API. No
          personal information is sent to Sleeper.
        </Li>
        <Li>
          <Strong>Google</Strong> — if you choose &quot;Continue with Google,&quot; Google processes
          your sign-in per{" "}
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

      <H2>Cookies and local storage</H2>
      <P>
        We use strictly necessary cookies for authentication and a preference cookie to remember
        your consent choices. In demo mode, data is kept in local storage. We do not use advertising
        or third-party tracking cookies. See our{" "}
        <a href="/cookies" className="font-semibold text-emerald-300 hover:underline">
          Cookie Policy
        </a>{" "}
        for details.
      </P>

      <H2>Your rights</H2>
      <P>
        Depending on your jurisdiction, you may have the right to access, correct, export, or delete
        your personal information, and to withdraw consent where processing is based on consent. To
        exercise these rights, contact us at the address below.
      </P>

      <H2>Children&apos;s privacy</H2>
      <P>
        DraftEdge is not directed to children under 13, and we do not knowingly collect personal
        information from them.
      </P>

      <H2>Changes to this policy</H2>
      <P>
        We may update this policy from time to time. When we do, we will revise the &quot;Last
        updated&quot; date above. Continued use of the service after changes take effect constitutes
        acceptance of the revised policy.
      </P>

      <H2>Contact</H2>
      <P>
        Questions about this policy or your data? Email{" "}
        <a href="mailto:support@draftedge.app" className="font-semibold text-emerald-300 hover:underline">
          support@draftedge.app
        </a>
        .
      </P>
    </LegalPage>
  );
}
