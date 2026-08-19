import type { Metadata } from "next";
import { LegalPage, H2, P, Ul, Li } from "@/components/legal";

export const metadata: Metadata = {
  title: "Terms of Service — DraftEdge",
  description: "The terms and conditions governing your use of DraftEdge.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="August 18, 2026">
      <P>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of DraftEdge
        (&quot;the Service&quot;). By creating an account or using the Service, you agree to be bound
        by these Terms. If you do not agree, do not use the Service.
      </P>

      <H2>The service</H2>
      <P>
        DraftEdge is a free fantasy football draft assistant that provides automated player tiers,
        live pick tracking, and cheat sheets powered by public data. The Service is provided free of
        charge and on an &quot;as is&quot; basis.
      </P>

      <H2>Eligibility</H2>
      <P>
        You must be at least 13 years old to use the Service. By using the Service, you represent
        that you meet this requirement.
      </P>

      <H2>Accounts</H2>
      <P>
        You are responsible for maintaining the confidentiality of your account credentials and for
        all activity that occurs under your account. You agree to provide accurate information and
        to notify us promptly of any unauthorized use of your account.
      </P>

      <H2>Acceptable use</H2>
      <P>You agree not to:</P>
      <Ul>
        <Li>Use the Service for any unlawful purpose or in violation of these Terms.</Li>
        <Li>Attempt to gain unauthorized access to the Service, other users&apos; accounts, or our systems.</Li>
        <Li>Interfere with or disrupt the integrity or performance of the Service.</Li>
        <Li>Scrape, harvest, or otherwise collect data in bulk in a way that harms the Service.</Li>
        <Li>Misrepresent your affiliation with any person or entity.</Li>
      </Ul>

      <H2>Your content</H2>
      <P>
        You retain ownership of the league configurations, notes, and other content you create in
        the Service (&quot;Your Content&quot;). By using the Service, you grant us a limited license
        to store and process Your Content solely to provide the Service. You are responsible for
        ensuring Your Content does not violate any law or third-party right.
      </P>

      <H2>Intellectual property</H2>
      <P>
        DraftEdge is open-source software, and its code is licensed under the MIT License. The
        DraftEdge name, logo, and branding are our property and may not be used without permission.
      </P>

      <H2>Third-party data and trademarks</H2>
      <P>
        Player statistics and metadata are sourced from public data, including the Sleeper API.
        DraftEdge is not affiliated with, endorsed by, or sponsored by the NFL, Sleeper, or any team
        or player. All trademarks belong to their respective owners.
      </P>

      <H2>No professional advice</H2>
      <P>
        Player projections, tiers, and rankings are provided for entertainment and informational
        purposes only. They are estimates and do not guarantee any outcome. Nothing in the Service
        constitutes financial, gambling, or professional advice.
      </P>

      <H2>Disclaimer of warranties</H2>
      <P>
        The Service is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of
        any kind, express or implied, including accuracy, reliability, merchantability, fitness for
        a particular purpose, or non-infringement. We do not warrant that the Service will be
        uninterrupted, secure, or error-free.
      </P>

      <H2>Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, DraftEdge and its contributors will not be liable for
        any indirect, incidental, special, consequential, or punitive damages, or any loss of
        profits, data, or goodwill, arising out of or related to your use of the Service.
      </P>

      <H2>Termination</H2>
      <P>
        We may suspend or terminate your access to the Service at any time for any reason, including
        a breach of these Terms. You may stop using the Service at any time and delete your account
        by contacting us.
      </P>

      <H2>Changes to these terms</H2>
      <P>
        We may revise these Terms from time to time. Material changes will be reflected by updating
        the &quot;Last updated&quot; date above. Your continued use of the Service after changes take
        effect constitutes acceptance of the revised Terms.
      </P>

      <H2>Governing law</H2>
      <P>
        These Terms are governed by the laws of the jurisdiction in which the Service operator is
        located, without regard to conflict-of-law principles. Any disputes will be resolved in the
        courts of that jurisdiction.
      </P>

      <H2>Contact</H2>
      <P>
        Questions about these Terms? Email{" "}
        <a href="mailto:support@draftedge.app" className="font-semibold text-emerald-300 hover:underline">
          support@draftedge.app
        </a>
        .
      </P>
    </LegalPage>
  );
}
