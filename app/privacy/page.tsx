import type { Metadata } from "next";
import { LegalPage, H2, H3, P, Ul, Li, Strong } from "@/components/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — DraftEdge",
  description: "Learn what information DraftEdge collects and how it is used, stored, and protected.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="November 22, 2026">
      <P>
        DraftEdge operates at <a href="https://draftedge.vercel.app" className="font-semibold text-emerald-300 hover:underline">draftedge.vercel.app</a>. This policy describes the information handled when you use the service.
      </P>

      <H2>1. Information we collect</H2>
      <H3>Account information</H3>
      <P>
        You can use email and password authentication or sign in with Google through Supabase Auth. When you use Google sign-in, DraftEdge receives basic account information made available for authentication, such as your email address and name. Google sign-in uses the basic identity scopes <Strong>openid</Strong>, <Strong>email</Strong>, and <Strong>profile</Strong>; DraftEdge does not request access to Gmail, Google Drive, or your contacts.
      </P>
      <H3>Fantasy league information</H3>
      <Ul>
        <Li><Strong>Sleeper:</Strong> If you connect an account, DraftEdge retrieves your Sleeper username and the league settings, rosters, scoring rules, and draft picks available through Sleeper&apos;s API.</Li>
        <Li><Strong>ESPN Fantasy:</Strong> If you connect a league, DraftEdge retrieves the league settings, rosters, and draft picks available through ESPN&apos;s API. For a private league, you may provide your <code>espn_s2</code> and <code>SWID</code> session values so the sync can request that league&apos;s data.</Li>
        <Li><Strong>Saved league data:</Strong> Connected league information is stored in your DraftEdge account to populate the Trade Analyzer, Cheat Sheets, Mock Drafts, Player Rankings, and Start/Sit tools.</Li>
      </Ul>
      <P>
        ESPN session values are sent by DraftEdge&apos;s server to ESPN to make the requested read-only league request. DraftEdge does not save those values in your account or in the synced league record.
      </P>
      <H3>Usage and technical information</H3>
      <P>
        Vercel and Supabase may process technical request information, such as browser and network details, to operate, secure, and troubleshoot the service. Optional Vercel Web Analytics is loaded only if you allow analytics in the consent manager.
      </P>
      <P>
        When Supabase is not configured and the app runs in local demo mode, demo account, league, and draft information is stored in your browser&apos;s local storage instead of your Supabase account.
      </P>

      <H2>2. How we use information</H2>
      <Ul>
        <Li>To authenticate your account and maintain your sign-in session.</Li>
        <Li>To retrieve and save league settings, rosters, and draft picks you choose to sync.</Li>
        <Li>To prefill and operate DraftEdge&apos;s fantasy football tools.</Li>
        <Li>To protect the service, diagnose issues, and, when you consent, understand product usage through analytics.</Li>
      </Ul>
      <P>We do not sell personal information or use Google account information for targeted advertising.</P>

      <H2>3. Service providers and third parties</H2>
      <Ul>
        <Li><Strong>Supabase:</Strong> Provides authentication and the PostgreSQL database used for account and synced league data. The <code>user_leagues</code> table uses row-level security to restrict records to their account owner.</Li>
        <Li><Strong>Vercel:</Strong> Hosts the website and provides optional Web Analytics when you grant analytics consent.</Li>
        <Li><Strong>Google:</Strong> Processes Google sign-in if you choose that option.</Li>
        <Li><Strong>Sleeper and ESPN:</Strong> Provide league information when you request a league sync. ESPN session values, if supplied, are used only for the ESPN request.</Li>
      </Ul>
      <P>These providers process information under their own privacy policies and service terms.</P>

      <H2>4. Data retention and deletion</H2>
      <P>
        Synced league records remain associated with your account until you disconnect them or request account data deletion. You can disconnect a league in DraftEdge. To request deletion of account data, email <a href="mailto:anshtolat@gmail.com" className="font-semibold text-emerald-300 hover:underline">anshtolat@gmail.com</a>. We may ask you to verify the request and may retain information where required for legal, security, or operational reasons.
      </P>
      <P>You can also revoke DraftEdge&apos;s Google account access in your Google Account settings. Revoking access does not by itself delete your DraftEdge account or previously synced league data.</P>

      <H2>5. Children&apos;s privacy</H2>
      <P>DraftEdge is not intended for children under 13, and we do not knowingly collect personal information from children under 13.</P>

      <H2>6. Changes to this policy</H2>
      <P>We may update this policy as the service changes. The date at the top of this page shows when it was last revised.</P>

      <H2>7. Contact</H2>
      <P>
        For privacy questions or data deletion requests, contact <a href="mailto:anshtolat@gmail.com" className="font-semibold text-emerald-300 hover:underline">anshtolat@gmail.com</a>.
      </P>
    </LegalPage>
  );
}
