import type { Metadata } from "next";
import { LegalPage, H2, H3, P, Ul, Li, Strong } from "@/components/legal";

export const metadata: Metadata = {
  title: "Terms of Service — DraftEdge",
  description:
    "The terms and conditions governing your use of DraftEdge, including copyright, content licensing, anti-spam, and disclaimers.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="August 22, 2026">
      <P>
        These Terms of Service (&quot;Terms&quot;) govern your access to and
        use of DraftEdge (&quot;the Service&quot;). By creating an account or
        using the Service, you agree to be bound by these Terms. If you do not
        agree, do not use the Service.
      </P>

      {/* ── 1. The service ──────────────────────────────── */}
      <H2>1. The service</H2>
      <P>
        DraftEdge is a free fantasy football draft assistant that provides
        automated player tiers, live pick tracking, cheat sheets, trade
        analysis, research tools, and community polls powered by public data.
        The Service is provided free of charge and on an &quot;as is&quot;
        basis. DraftEdge does not process payments, handle wagers, or operate
        any form of gambling or real-money contest.
      </P>

      {/* ── 2. Eligibility ───────────────────────────────── */}
      <H2>2. Eligibility</H2>
      <P>
        You must be at least 13 years old to use the Service (or the minimum
        age required in your jurisdiction). By using the Service, you represent
        that you meet this requirement and have the legal capacity to enter into
        these Terms.
      </P>

      {/* ── 3. Accounts ──────────────────────────────────── */}
      <H2>3. Accounts</H2>
      <P>
        You are responsible for maintaining the confidentiality of your account
        credentials and for all activity that occurs under your account. You
        agree to provide accurate information and to notify us promptly of any
        unauthorised use of your account. We are not liable for any loss
        arising from unauthorised use of your credentials.
      </P>

      {/* ── 4. Acceptable use ────────────────────────────── */}
      <H2>4. Acceptable use</H2>
      <P>You agree not to:</P>
      <Ul>
        <Li>
          Use the Service for any unlawful purpose or in violation of these
          Terms.
        </Li>
        <Li>
          Attempt to gain unauthorised access to the Service, other users&apos;
          accounts, or our systems.
        </Li>
        <Li>
          Interfere with or disrupt the integrity or performance of the
          Service.
        </Li>
        <Li>
          Scrape, harvest, crawl, or otherwise collect data from the Service in
          bulk using automated means (bots, crawlers, scrapers) without our
          prior written consent.
        </Li>
        <Li>
          Misrepresent your affiliation with any person or entity.
        </Li>
        <Li>
          Upload or transmit viruses, malware, or any code of a destructive
          nature.
        </Li>
        <Li>
          Use the Service to send unsolicited bulk messages, spam, or chain
          letters.
        </Li>
        <Li>
          Circumvent or attempt to circumvent any rate limiting, access control,
          or security measures.
        </Li>
      </Ul>

      {/* ── 5. Your content ───────────────────────────────── */}
      <H2>5. Your content</H2>
      <P>
        You retain ownership of the league configurations, notes, draft
        strategies, poll content, and other materials you create in the Service
        (&quot;Your Content&quot;). By using the Service, you grant us a{" "}
        <Strong>limited, non-exclusive, revocable licence</Strong> to store,
        process, and display Your Content solely to provide and improve the
        Service. This licence terminates when you delete Your Content or your
        account.
      </P>
      <P>
        You are solely responsible for ensuring that Your Content does not
        violate any law, regulation, or third-party right. We reserve the right
        to remove content that violates these Terms or applicable law.
      </P>

      {/* ── 6. Intellectual property ──────────────────────── */}
      <H2>6. Intellectual property</H2>

      <H3>6.1 DraftEdge code and branding</H3>
      <P>
        DraftEdge is open-source software. The application code is licensed
        under the{" "}
        <a
          href="https://opensource.org/licenses/MIT"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-emerald-300 hover:underline"
        >
          MIT License
        </a>
        . You may use, modify, and distribute the code in accordance with that
        licence.
      </P>
      <P>
        The DraftEdge name, logo, wordmark, and visual branding are our
        proprietary trade dress and may not be used, reproduced, or
        redistributed without prior written permission.
      </P>

      <H3>6.2 Content licensing and attribution</H3>
      <P>
        Player statistics, rankings, and projections displayed in the Service
        are derived from publicly available data sources. When using or
        redistributing data obtained from DraftEdge, you agree to provide
        attribution as follows:
      </P>
      <Ul>
        <Li>
          <Strong>Player data:</Strong> sourced from the{" "}
          <a
            href="https://docs.sleeper.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-300 hover:underline"
          >
            Sleeper API
          </a>{" "}
          (non-commercial use permitted under Sleeper&apos;s Terms of Service).
        </Li>
        <Li>
          <Strong>Usage metrics (snap counts, target share, air yards):</Strong>{" "}
          sourced from{" "}
          <a
            href="https://github.com/nflverse/nflverse-data"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-300 hover:underline"
          >
            nflverse
          </a>
          , released under the{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-300 hover:underline"
          >
            Creative Commons Attribution 4.0 International (CC BY 4.0)
          </a>{" "}
          licence. Attribution: &quot;Data from nflverse, licensed under CC BY
          4.0.&quot;
        </Li>
        <Li>
          <Strong>Consensus projections:</Strong> may include data from{" "}
          <a
            href="https://www.fantasypros.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-300 hover:underline"
          >
            FantasyPros
          </a>{" "}
          when an API key is configured, subject to FantasyPros&apos;s Terms of
          Use.
        </Li>
      </Ul>
      <P>
        You may not misrepresent DraftEdge-generated content as your own
        original analysis without attribution.
      </P>

      {/* ── 7. Copyright and DMCA ────────────────────────── */}
      <H2>7. Copyright and DMCA takedown policy</H2>
      <P>
        We respect the intellectual property rights of others. If you believe
        that content available through DraftEdge infringes your copyright, you
        may submit a takedown request under the Digital Millennium Copyright
        Act (17 U.S.C. § 512) or equivalent applicable law.
      </P>
      <P>To file a takedown notice, send the following to{" "}
        <a
          href="mailto:support@draftedge.app"
          className="font-semibold text-emerald-300 hover:underline"
        >
          support@draftedge.app
        </a>
        :</P>
      <Ul>
        <Li>
          A physical or electronic signature of the copyright owner or
          authorised agent.
        </Li>
        <Li>
          Identification of the copyrighted work claimed to have been
          infringed.
        </Li>
        <Li>
          Identification of the material claimed to be infringing, with
          sufficient detail for us to locate it.
        </Li>
        <Li>
          Your contact information (name, address, phone number, email).
        </Li>
        <Li>
          A statement that you have a good-faith belief that the use is not
          authorised by the copyright owner, its agent, or the law.
        </Li>
        <Li>
          A statement, under penalty of perjury, that the information in the
          notice is accurate and that you are the copyright owner or authorised
          to act on the owner&apos;s behalf.
        </Li>
      </Ul>

      <H3>7.1 Repeat infringer policy</H3>
      <P>
        In accordance with the DMCA and other applicable law, we have adopted a
        policy of terminating, in appropriate circumstances and at our sole
        discretion, the accounts of users who are deemed to be repeat
        infringers. We may also, at our sole discretion, limit access to the
        Service or terminate the accounts of any user who infringes any
        intellectual property rights of others, whether or not there is any
        repeat infringement.
      </P>

      <H3>7.2 Counter-notification</H3>
      <P>
        If your content was removed due to a DMCA takedown and you believe the
        removal was erroneous or that you have authorisation from the copyright
        owner, you may file a counter-notification. The counter-notification
        must include your name, address, phone number, the removed content URL,
        and a statement under penalty of perjury that the removal was a mistake.
        We will forward valid counter-notifications to the original complainant,
        who must file a court action within 10-14 business days or the content
        may be restored.
      </P>

      {/* ── 8. Third-party data and trademarks ────────────── */}
      <H2>8. Third-party data and trademarks</H2>
      <P>
        Player statistics, metadata, and projections are sourced from public
        data, including the Sleeper API, nflverse, and FantasyPros (when
        configured). DraftEdge is <Strong>not affiliated with, endorsed by,
        or sponsored by</Strong> the National Football League (NFL), the
        National Football League Players Association (NFLPA), Sleeper, Yahoo,
        ESPN, FantasyPros, nflverse, or any NFL team or player. All trademarks,
        team names, player names, and logos belong to their respective owners
        and are used here for informational and identification purposes only.
      </P>
      <P>
        The use of any team names, player names, or logos does not imply
        endorsement by, or association with, any team, player, or league.
      </P>

      {/* ── 9. Anti-spam compliance ──────────────────────── */}
      <H2>9. Anti-spam compliance</H2>
      <P>
        DraftEdge complies with applicable anti-spam laws, including:
      </P>
      <Ul>
        <Li>
          <Strong>CAN-SPAM Act (15 U.S.C. § 7701 et seq.)</Strong> — If we
          ever send transactional or marketing emails, every email will include
          our valid physical postal address, a clear unsubscribe mechanism, and
          accurate header information. Opt-out requests will be honoured within
          10 business days.
        </Li>
        <Li>
          <Strong>CASL (Canada&apos;s Anti-Spam Legislation, S.C. 2010, c. 23)</Strong>{" "}
          — express or implied consent will be obtained before sending
          Commercial Electronic Messages (CEMs) to Canadian recipients. Every
          CEM will include sender identification, contact information, and a
          working unsubscribe mechanism.
        </Li>
      </Ul>
      <P>
        Currently, DraftEdge sends <Strong>no marketing emails</Strong>. The
        only emails sent are transactional (account verification, password
        reset) which are exempt from consent requirements under both CAN-SPAM
        and CASL. If we add newsletters or promotional emails in the future,
        prior opt-in consent will be required.
      </P>

      {/* ── 10. Fantasy sports disclaimer ─────────────────── */}
      <H2>10. Fantasy sports and gambling disclaimer</H2>
      <P>
        DraftEdge is a <Strong>research and informational tool</Strong> for
        fantasy football. It is <Strong>not</Strong> a gambling platform, a
        sports betting service, or an operator of real-money contests.
      </P>
      <Ul>
        <Li>
          DraftEdge does not accept, process, or facilitate any wagers, bets,
          or stakes.
        </Li>
        <Li>
          DraftEdge does not host, operate, or manage any fantasy sports contest
          where entry fees are charged or prizes are awarded.
        </Li>
        <Li>
          All projections, rankings, tiers, trade values, and recommendations
          are generated by algorithms and publicly available data. They are{" "}
          <Strong>estimates for entertainment and informational purposes
          only</Strong> and do not guarantee any outcome.
        </Li>
        <Li>
          Fantasy sports laws vary by jurisdiction. Some US states and
          countries restrict or prohibit certain types of fantasy contests. You
          are responsible for determining whether your use of fantasy football
          tools complies with the laws in your jurisdiction.
        </Li>
        <Li>
          Nothing in the Service constitutes financial, gambling, investment, or
          professional advice. You are solely responsible for your decisions and
          any consequences arising from them.
        </Li>
      </Ul>
      <P>
        If you or someone you know has a gambling problem, contact the{" "}
        <a
          href="https://www.ncpgambling.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-emerald-300 hover:underline"
        >
          National Council on Problem Gambling
        </a>{" "}
        at 1-800-522-4700 or text HOME to 741741.
      </P>

      {/* ── 11. No professional advice ────────────────────── */}
      <H2>11. No professional advice</H2>
      <P>
        Player projections, tiers, rankings, trade values, and start/sit
        recommendations are provided for entertainment and informational
        purposes only. They are estimates based on algorithms and historical
        data and <Strong>do not guarantee any outcome</Strong>. Nothing in the
        Service constitutes financial, gambling, tax, legal, or professional
        advice.
      </P>

      {/* ── 12. Disclaimer of warranties ──────────────────── */}
      <H2>12. Disclaimer of warranties</H2>
      <P>
        The Service is provided &quot;as is&quot; and &quot;as available,&quot;
        without warranties of any kind, express or implied, including but not
        limited to warranties of accuracy, reliability, merchantability, fitness
        for a particular purpose, or non-infringement. We do not warrant that:
      </P>
      <Ul>
        <Li>
          The Service will be uninterrupted, secure, or error-free.
        </Li>
        <Li>
          The data, projections, or rankings will be accurate, complete, or
          current.
        </Li>
        <Li>
          The Service will meet your specific requirements or expectations.
        </Li>
        <Li>
          Defects, if any, will be corrected.
        </Li>
      </Ul>

      {/* ── 13. Limitation of liability ───────────────────── */}
      <H2>13. Limitation of liability</H2>
      <P>
        To the maximum extent permitted by applicable law, DraftEdge, its
        contributors, maintainers, and licensors will not be liable for any{" "}
        <Strong>indirect, incidental, special, consequential, or punitive
        damages</Strong>, or any loss of profits, data, revenue, goodwill, or
        anticipated savings, arising out of or related to:
      </P>
      <Ul>
        <Li>Your use of or inability to use the Service.</Li>
        <Li>
          Any decisions made based on projections, rankings, or recommendations
          in the Service.
        </Li>
        <Li>
          Unauthorised access to or alteration of your data or transmissions.
        </Li>
        <Li>
          Errors, inaccuracies, or omissions in the Service or its content.
        </Li>
        <Li>
          Third-party conduct or content accessible through the Service.
        </Li>
      </Ul>
      <P>
        In no event shall our total aggregate liability exceed{" "}
        <Strong>one hundred US dollars (US $100.00)</Strong> or the amount you
        paid us in the 12 months preceding the claim, whichever is less. Since
        the Service is free, this cap is effectively US $100.00.
      </P>

      {/* ── 14. Indemnification ───────────────────────────── */}
      <H2>14. Indemnification</H2>
      <P>
        You agree to indemnify, defend, and hold harmless DraftEdge and its
        contributors from any claims, liabilities, damages, or expenses
        (including reasonable attorney fees) arising from:
      </P>
      <Ul>
        <Li>Your use of the Service.</Li>
        <Li>Your violation of these Terms.</Li>
        <Li>Your violation of any third-party right.</Li>
        <Li>Any content you submit or transmit through the Service.</Li>
      </Ul>

      {/* ── 15. Termination ────────────────────────────────── */}
      <H2>15. Termination</H2>
      <P>
        We may suspend or terminate your access to the Service at any time for
        any reason, including a breach of these Terms. You may stop using the
        Service at any time and delete your account by contacting us. Upon
        termination, your right to use the Service ceases immediately. We will
        delete your personal data within 30 days of a valid deletion request,
        subject to our retention obligations.
      </P>

      {/* ── 16. Governing law and disputes ────────────────── */}
      <H2>16. Governing law and disputes</H2>
      <P>
        These Terms are governed by the laws of the jurisdiction in which the
        Service operator is located, without regard to conflict-of-law
        principles. Any disputes will be resolved in the courts of that
        jurisdiction. You agree to attempt to resolve any dispute informally by
        contacting us before initiating formal proceedings.
      </P>

      {/* ── 17. Changes to these terms ────────────────────── */}
      <H2>17. Changes to these terms</H2>
      <P>
        We may revise these Terms from time to time. Material changes will be
        reflected by updating the &quot;Last updated&quot; date above and, where
        appropriate, notified by email or an in-app banner at least{" "}
        <Strong>30 days</Strong> before they take effect. Your continued use of
        the Service after changes take effect constitutes acceptance of the
        revised Terms. If you do not agree to the revised Terms, you must stop
        using the Service and delete your account.
      </P>

      {/* ── 18. Contact ────────────────────────────────────── */}
      <H2>18. Contact</H2>
      <P>
        Questions about these Terms? Email{" "}
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
