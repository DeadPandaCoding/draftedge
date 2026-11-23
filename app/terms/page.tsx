import type { Metadata } from "next";
import { LegalPage, H2, P, Ul, Li } from "@/components/legal";

export const metadata: Metadata = {
  title: "Terms of Service — DraftEdge",
  description: "Terms and conditions for using DraftEdge and its fantasy football tools.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="November 22, 2026">
      <P>
        These Terms of Service govern your use of DraftEdge at <a href="https://draftedge.vercel.app" className="font-semibold text-emerald-300 hover:underline">draftedge.vercel.app</a> (the “Service”). By using the Service, you agree to these terms. If you do not agree, do not use the Service.
      </P>

      <H2>1. The service</H2>
      <P>
        DraftEdge provides fantasy football analysis and draft assistance through the Trade Analyzer, Cheat Sheets, Mock Drafts, Player Rankings, and Start/Sit tools. You may also connect Sleeper or ESPN Fantasy leagues to import supported league settings, rosters, and draft picks. Availability and features may change over time.
      </P>

      <H2>2. Eligibility and accounts</H2>
      <P>You must be at least 13 years old to use DraftEdge. You are responsible for your account and for keeping your sign-in credentials secure.</P>
      <P>
        If you choose to sync a private ESPN league, you are responsible for providing valid <code>espn_s2</code> and <code>SWID</code> session values. DraftEdge uses them to make read-only requests to ESPN and does not store them in your account. Do not provide credentials you are not authorized to use.
      </P>

      <H2>3. Third-party platforms</H2>
      <P>
        DraftEdge is independent and is not affiliated with, endorsed by, or sponsored by the NFL, NFL Players Association, ESPN, Sleeper, Google, or any professional sports team. Third-party names, marks, and data belong to their respective owners. League syncing depends on third-party services and may be unavailable or change if those services modify or restrict their APIs.
      </P>

      <H2>4. Acceptable use</H2>
      <P>You agree not to:</P>
      <Ul>
        <Li>Use DraftEdge for unlawful purposes or attempt to disrupt or overload the service.</Li>
        <Li>Attempt to access another user&apos;s account, synced leagues, or credentials.</Li>
        <Li>Scrape or reverse-engineer the service in a way that violates these terms or applicable law.</Li>
        <Li>Use league credentials or data without authorization.</Li>
      </Ul>

      <H2>5. Informational use only</H2>
      <P>
        Player projections, rankings, trade values, and lineup recommendations are provided for informational and entertainment purposes only. They are not financial, betting, or gambling advice. Fantasy football outcomes are uncertain, and DraftEdge does not guarantee the accuracy of data or any result in your league.
      </P>

      <H2>6. Disclaimer of warranties</H2>
      <P>
        The Service is provided “as is” and “as available,” without warranties of any kind, express or implied. We do not guarantee uninterrupted access, error-free operation, or that data, projections, rankings, or recommendations will be accurate, complete, or current.
      </P>

      <H2>7. Limitation of liability</H2>
      <P>
        To the fullest extent permitted by applicable law, DraftEdge and its contributors will not be liable for indirect, incidental, special, consequential, or punitive damages, or losses arising from your use of or inability to use the Service or decisions made using its information.
      </P>

      <H2>8. Suspension and termination</H2>
      <P>
        We may suspend or terminate access if we reasonably believe an account is being used in violation of these terms, to harm the Service or others, or for another security or legal reason.
      </P>

      <H2>9. Changes to these terms</H2>
      <P>We may revise these terms as the Service changes. The date at the top of this page shows when they were last revised. Continued use after revised terms are posted means you accept the updated terms.</P>

      <H2>10. Contact</H2>
      <P>
        Questions about these terms? Email <a href="mailto:anshtolat@gmail.com" className="font-semibold text-emerald-300 hover:underline">anshtolat@gmail.com</a>.
      </P>
    </LegalPage>
  );
}
