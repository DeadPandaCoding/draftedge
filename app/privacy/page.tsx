import type { Metadata } from "next";
import { LegalPage, H2, H3, P, Ul, Li, Strong } from "@/components/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — DraftEdge",
  description:
    "How DraftEdge collects, uses, stores, and protects your personal information under GDPR, CCPA, and other data privacy laws.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 22, 2026">
      <P>
        DraftEdge is a free, open-source fantasy football draft assistant. This
        Privacy Policy explains what information we collect, how we use it, the
        legal bases for processing, and the choices you have under applicable
        data privacy laws including the{" "}
        <Strong>General Data Protection Regulation (GDPR)</Strong>, the{" "}
        <Strong>California Consumer Privacy Act (CCPA/CPRA)</Strong>, and other
        regional data protection frameworks. By using DraftEdge, you agree to
        the practices described here.
      </P>

      {/* ── 1. Information we collect ──────────────────────── */}
      <H2>1. Information we collect</H2>
      <H3>1.1 Information you provide directly</H3>
      <Ul>
        <Li>
          <Strong>Account information.</Strong> When you sign up, we collect
          your name and email address. Sign-in is handled by Supabase Auth
          (email/password or Google OAuth).
        </Li>
        <Li>
          <Strong>League and draft data.</Strong> The league name, scoring
          format, league size, draft position, roster template, logged picks,
          notes, and your pick counter that you create in the app.
        </Li>
        <Li>
          <Strong>Polls and community content.</Strong> If you create or vote on
          community polls, we store your poll choices, vote timestamps, and any
          poll titles/options you submit.
        </Li>
      </Ul>

      <H3>1.2 Information collected automatically</H3>
      <Ul>
        <Li>
          <Strong>Local data (demo mode).</Strong> When you use the app without
          connecting Supabase, your account, league, and draft data are stored
          only in your browser&apos;s local storage and never leave your device.
        </Li>
        <Li>
          <Strong>Cookies and session tokens.</Strong> Strictly necessary
          cookies for authentication (Supabase session) and a consent-preference
          cookie. No analytics, advertising, or tracking cookies are set. See our{" "}
          <a
            href="/cookies"
            className="font-semibold text-emerald-300 hover:underline"
          >
            Cookie Policy
          </a>{" "}
          for full details.
        </Li>
      </Ul>

      <H3>1.3 Information we do NOT collect</H3>
      <Ul>
        <Li>
          We do not collect payment or financial information — DraftEdge is
          entirely free.
        </Li>
        <Li>
          We do not collect precise geolocation data.
        </Li>
        <Li>
          We do not collect biometric data.
        </Li>
        <Li>
          We do not use analytics or advertising trackers that profile your
          browsing behaviour across sites.
        </Li>
      </Ul>

      <H3>1.4 Categories of personal information (CCPA/CPRA)</H3>
      <P>
        Under the CCPA, the personal information we collect falls into these
        categories:
      </P>
      <Ul>
        <Li>
          <Strong>Identifiers:</Strong> name, email address, account ID.
        </Li>
        <Li>
          <Strong>Internet / network information:</Strong> session tokens
          (cookies), browser type.
        </Li>
        <Li>
          <Strong>User-generated content:</Strong> league configurations,
          draft picks, notes, poll votes.
        </Li>
      </Ul>
      <P>
        We do not sell personal information, and we do not share it for
        cross-context behavioural advertising purposes.
      </P>

      {/* ── 2. How we use your information ──────────────────── */}
      <H2>2. How we use your information</H2>
      <Ul>
        <Li>To create and manage your account and sign you in.</Li>
        <Li>
          To save your league configuration, draft state, starred players, and
          poll data and sync them across your devices.
        </Li>
        <Li>To provide, operate, and improve the DraftEdge service.</Li>
        <Li>To respond to support requests and enforce our Terms of Service.</Li>
        <Li>
          To detect, prevent, and address security incidents and fraudulent use
          of the Service.
        </Li>
      </Ul>
      <P>
        We do not use personal information for automated decision-making or
        profiling that produces legal or similarly significant effects.
      </P>

      {/* ── 3. Legal bases for processing (GDPR Art. 6) ─────── */}
      <H2>3. Legal bases for processing (GDPR Article 6)</H2>
      <P>
        If you are located in the European Economic Area (EEA), United Kingdom,
        or Switzerland, we process your personal data under the following legal
        bases:
      </P>
      <Ul>
        <Li>
          <Strong>Performance of a contract (Art. 6(1)(b)):</Strong> processing
          necessary to provide the service you requested (your account, leagues,
          and drafts).
        </Li>
        <Li>
          <Strong>Consent (Art. 6(1)(a)):</Strong> where you choose to connect
          your Google account or enable optional cookies. You may withdraw
          consent at any time without affecting the lawfulness of processing
          carried out before withdrawal.
        </Li>
        <Li>
          <Strong>Legitimate interests (Art. 6(1)(f)):</Strong> securing the
          service, preventing abuse, and improving the product. We conduct a
          balancing test before relying on legitimate interests and will provide
          details on request.
        </Li>
      </Ul>

      {/* ── 4. Data retention ─────────────────────────────── */}
      <H2>4. Data retention</H2>
      <P>
        We retain personal data only as long as necessary to provide the
        Service and for the purposes described in this policy:
      </P>
      <Ul>
        <Li>
          <Strong>Account data (name, email):</Strong> retained for the
          lifetime of your account. Deleted within 30 days of account deletion
          request.
        </Li>
        <Li>
          <Strong>League and draft data:</Strong> retained while your account
          exists or until you delete it in the app.
        </Li>
        <Li>
          <Strong>Starred players and poll data:</Strong> retained while your
          account exists.
        </Li>
        <Li>
          <Strong>Session cookies:</Strong> expire when you sign out or after
          30 days of inactivity.
        </Li>
        <Li>
          <Strong>Consent cookie:</Strong> retained for 12 months from the
          date your preference was recorded.
        </Li>
      </Ul>
      <P>
        When data is no longer needed, it is deleted or irreversibly
        anonymised. Aggregated, anonymised data that cannot identify you may be
        retained indefinitely for product improvement.
      </P>

      {/* ── 5. How we share your information ──────────────── */}
      <H2>5. How we share your information</H2>
      <Ul>
        <Li>
          <Strong>We do not sell your personal information.</Strong> DraftEdge
          has no advertising or data-brokerage relationships.
        </Li>
        <Li>
          <Strong>We do not share personal information for cross-context
          behavioural advertising.</Strong>
        </Li>
        <Li>
          <Strong>Service providers (sub-processors).</Strong> We share data
          with the limited third parties listed in Section 5.1 below, strictly
          to operate the Service.
        </Li>
        <Li>
          <Strong>Legal requirements.</Strong> We may disclose information if
          required by law, subpoena, or court order, or to protect the rights,
          property, or safety of DraftEdge, our users, or the public.
        </Li>
      </Ul>

      <H3>5.1 Sub-processors</H3>
      <P>
        The following third-party providers process personal data on our behalf:
      </P>
      <Ul>
        <Li>
          <Strong>Supabase, Inc.</Strong> — authentication, database hosting,
          and edge functions. Data is stored in Supabase&apos;s cloud
          infrastructure (AWS us-east-1). See{" "}
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
          <Strong>Google LLC</Strong> — if you choose &quot;Continue with
          Google,&quot; Google processes your sign-in per{" "}
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
        <Li>
          <Strong>Vercel, Inc.</Strong> — hosting and CDN for the DraftEdge
          application. Vercel processes HTTP requests and may log IP addresses
          for security and performance. See{" "}
          <a
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-300 hover:underline"
          >
            Vercel&apos;s privacy policy
          </a>
          .
        </Li>
      </Ul>
      <P>
        We maintain a current list of sub-processors and will notify you of
        material changes at least 30 days before any new sub-processor begins
        processing your data.
      </P>

      {/* ── 6. Cross-border data transfers ─────────────────── */}
      <H2>6. Cross-border data transfers</H2>
      <P>
        Your data may be processed in the United States or other countries
        where our sub-processors operate. When we transfer personal data from
        the EEA, UK, or Switzerland, we rely on:
      </P>
      <Ul>
        <Li>
          Standard Contractual Clauses (SCCs) approved by the European
          Commission, or
        </Li>
        <Li>
          An adequacy decision, or
        </Li>
        <Li>
          Your explicit consent for a specific transfer.
        </Li>
      </Ul>
      <P>
        You may request a copy of the applicable transfer mechanism by
        contacting us at the address below.
      </P>

      {/* ── 7. Your rights ──────────────────────────────────── */}
      <H2>7. Your rights</H2>

      <H3>7.1 GDPR rights (EEA, UK, Switzerland)</H3>
      <P>
        You have the following rights under the General Data Protection
        Regulation:
      </P>
      <Ul>
        <Li>
          <Strong>Right of access (Art. 15):</Strong> request a copy of the
          personal data we hold about you.
        </Li>
        <Li>
          <Strong>Right to rectification (Art. 16):</Strong> request
          correction of inaccurate or incomplete data.
        </Li>
        <Li>
          <Strong>Right to erasure (Art. 17):</Strong> request deletion of
          your personal data (&quot;right to be forgotten&quot;).
        </Li>
        <Li>
          <Strong>Right to restriction (Art. 18):</Strong> request that we
          limit how we use your data.
        </Li>
        <Li>
          <Strong>Right to data portability (Art. 20):</Strong> receive your
          data in a structured, commonly used, machine-readable format (JSON).
        </Li>
        <Li>
          <Strong>Right to object (Art. 21):</Strong> object to processing
          based on legitimate interests. We will cease processing unless we
          demonstrate compelling legitimate grounds.
        </Li>
        <Li>
          <Strong>Right to withdraw consent (Art. 7(3)):</Strong> withdraw
          consent at any time where processing is based on consent, without
          affecting the lawfulness of prior processing.
        </Li>
        <Li>
          <Strong>Right to lodge a complaint:</Strong> you may file a
          complaint with your local supervisory authority (e.g. the ICO in the
          UK, CNIL in France, or the relevant DPA in your country).
        </Li>
      </Ul>

      <H3>7.2 CCPA/CPRA rights (California residents)</H3>
      <P>
        If you are a California resident, the California Consumer Privacy Act
        (as amended by the CPRA) grants you the following rights:
      </P>
      <Ul>
        <Li>
          <Strong>Right to know:</Strong> request the categories and specific
          pieces of personal information we have collected about you, the
          sources, purposes, and third parties with whom we share it.
        </Li>
        <Li>
          <Strong>Right to delete:</Strong> request deletion of your personal
          information, subject to certain exceptions.
        </Li>
        <Li>
          <Strong>Right to correct:</Strong> request correction of inaccurate
          personal information.
        </Li>
        <Li>
          <Strong>Right to opt-out of sale or sharing:</Strong> we do not sell
          or share your personal information as defined by the CCPA, so no
          opt-out is necessary — but you may submit a request at any time and
          we will confirm our non-sale status.
        </Li>
        <Li>
          <Strong>Right to non-discrimination:</Strong> we will not
          discriminate against you for exercising any CCPA right.
        </Li>
      </Ul>
      <P>
        To exercise any of these rights, email{" "}
        <a
          href="mailto:support@draftedge.app"
          className="font-semibold text-emerald-300 hover:underline"
        >
          support@draftedge.app
        </a>
        . We will verify your identity before processing your request and
        respond within 45 days (extendable by an additional 45 days with
        notice).
      </P>

      <H3>7.3 Other jurisdictions</H3>
      <P>
        If you are located in a jurisdiction with data protection laws (e.g.
        Brazil&apos;s LGPD, Canada&apos;s PIPEDA, or a US state privacy law
        other than California), you may have similar rights. Contact us to
        discuss what applies to you.
      </P>

      {/* ── 8. Data security ────────────────────────────────── */}
      <H2>8. Data security</H2>
      <P>
        We implement technical and organisational measures to protect personal
        data against unauthorised access, loss, destruction, or alteration:
      </P>
      <Ul>
        <Li>
          <Strong>Encryption in transit:</Strong> all data is transmitted over
          TLS 1.2+ (HTTPS). HTTP requests are redirected to HTTPS.
        </Li>
        <Li>
          <Strong>Encryption at rest:</Strong> Supabase encrypts all database
          storage using AES-256.
        </Li>
        <Li>
          <Strong>Row-level security (RLS):</Strong> database policies ensure
          each user can only access their own data. No user can read or modify
          another user&apos;s leagues, drafts, or starred players.
        </Li>
        <Li>
          <Strong>Authentication security:</Strong> passwords are hashed with
          bcrypt via Supabase Auth. Session tokens are short-lived and
          httpOnly. We do not store plaintext passwords.
        </Li>
        <Li>
          <Strong>Access control:</Strong> administrative access to the
          Supabase database is restricted to authorised personnel via
          service-role keys with minimal required permissions.
        </Li>
        <Li>
          <Strong>No third-party tracking:</Strong> we do not embed advertising
          pixels, fingerprinting scripts, or third-party analytics that could
          introduce additional attack surface.
        </Li>
      </Ul>
      <P>
        While we strive to use commercially acceptable means to protect personal
        data, no method of transmission or storage is 100% secure. We cannot
        guarantee absolute security.
      </P>

      {/* ── 9. Breach notification ─────────────────────────── */}
      <H2>9. Data breach notification</H2>
      <P>
        In the event of a personal data breach that is likely to result in a
        risk to your rights and freedoms, we will:
      </P>
      <Ul>
        <Li>
          Notify the relevant supervisory authority within <Strong>72 hours</Strong>{" "}
          of becoming aware of the breach, as required by GDPR Article 33.
        </Li>
        <Li>
          Notify affected users without undue delay when the breach is likely
          to result in a <Strong>high risk</Strong> to their rights and freedoms
          (GDPR Article 34), providing:
          a description of the breach, the types of data involved, the likely
          consequences, and the measures taken or proposed to address it.
        </Li>
        <Li>
          Maintain a breach register documenting all breaches, even those that
          do not require notification, per GDPR Article 33(5).
        </Li>
      </Ul>

      {/* ── 10. Children's privacy ──────────────────────────── */}
      <H2>10. Children&apos;s privacy</H2>
      <P>
        DraftEdge is not directed to children under 13 (or under 16 in the
        EEA/UK). We do not knowingly collect personal information from children.
        If we learn that we have collected personal information from a child
        under the applicable age, we will delete it promptly. If you believe a
        child has provided us with personal information, please contact us.
      </P>

      {/* ── 11. Cookies ────────────────────────────────────── */}
      <H2>11. Cookies and local storage</H2>
      <P>
        We use strictly necessary cookies for authentication and a preference
        cookie to remember your consent choices. In demo mode, data is kept in
        local storage. We do not use advertising, analytics, or third-party
        tracking cookies. See our{" "}
        <a
          href="/cookies"
          className="font-semibold text-emerald-300 hover:underline"
        >
          Cookie Policy
        </a>{" "}
        for full details, including compliance with the ePrivacy Directive
        (2002/58/EC).
      </P>

      {/* ── 12. Changes ────────────────────────────────────── */}
      <H2>12. Changes to this policy</H2>
      <P>
        We may update this policy from time to time. When we make material
        changes, we will revise the &quot;Last updated&quot; date above and,
        where appropriate, notify you by email or an in-app banner at least
        <Strong> 30 days</Strong> before the changes take effect. Continued use
        of the service after changes take effect constitutes acceptance of the
        revised policy.
      </P>

      {/* ── 13. Contact ────────────────────────────────────── */}
      <H2>13. Contact</H2>
      <P>
        Questions about this policy, or to exercise any of your rights, email{" "}
        <a
          href="mailto:support@draftedge.app"
          className="font-semibold text-emerald-300 hover:underline"
        >
          support@draftedge.app
        </a>
        .
      </P>
      <P>
        If you are in the EEA and are not satisfied with our response, you have
        the right to lodge a complaint with your local data protection
        supervisory authority.
      </P>
    </LegalPage>
  );
}
