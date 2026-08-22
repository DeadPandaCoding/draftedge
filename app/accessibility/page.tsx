import type { Metadata } from "next";
import { LegalPage, H2, P, Ul, Li, Strong } from "@/components/legal";

export const metadata: Metadata = {
  title: "Accessibility — DraftEdge",
  description:
    "DraftEdge's commitment to accessibility and the standards we follow.",
};

export default function AccessibilityPage() {
  return (
    <LegalPage title="Accessibility Statement" updated="August 22, 2026">
      <P>
        DraftEdge is committed to ensuring digital accessibility for people with
        disabilities. We continually improve the user experience for everyone and
        apply the{" "}
        <a
          href="https://www.w3.org/WAI/WCAG21/quickref/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-emerald-300 hover:underline"
        >
          Web Content Accessibility Guidelines (WCAG) 2.1
        </a>{" "}
        Level AA.
      </P>

      <H2>Measures taken</H2>
      <Ul>
        <Li>
          <Strong>Semantic HTML.</Strong> Every page uses native elements
          (&lt;nav&gt;, &lt;main&gt;, &lt;h1&gt;–&lt;h3&gt;, &lt;table&gt;,
          &lt;button&gt;) so assistive technologies can parse the structure
          without relying on visual cues.
        </Li>
        <Li>
          <Strong>Keyboard navigation.</Strong> All interactive elements —
          buttons, links, tabs, pickers, dropdowns, and the draft board — are
          reachable and operable with the keyboard alone. Visible focus rings
          appear on every focusable element.
        </Li>
        <Li>
          <Strong>Screen-reader support.</Strong> ARIA labels, live regions, and
          descriptive roles are applied to dynamic content (draft picks, trade
          results, toast notifications, consent banners). The draft board
          announces each pick with its overall and positional rank.
        </Li>
        <Li>
          <Strong>Colour contrast.</Strong> Text is designed to meet or exceed
          the 4.5:1 minimum contrast ratio against its background. We do not
          rely on colour alone to convey meaning — icons, text labels, and badges
          are always present alongside colour-coded elements.
        </Li>
        <Li>
          <Strong>Responsive design.</Strong> The layout adapts from mobile phones
          to ultrawide displays. Font sizes scale with the viewport, and content
          remains readable at 200% browser zoom.
        </Li>
        <Li>
          <Strong>Motion.</Strong> Animated effects (grain overlay, kinetic
          grid, reveal transitions) can be disabled by activating the{" "}
          <code className="rounded bg-zinc-800 px-1 py-px text-xs">
            prefers-reduced-motion
          </code>{" "}
          media query in your operating system. No content is conveyed through
          animation alone.
        </Li>
        <Li>
          <Strong>Skip links.</Strong> A &quot;Skip to content&quot; link appears
          as the first element on every page so keyboard users can bypass
          repeated navigation.
        </Li>
      </Ul>

      <H2>Pages &amp; components covered</H2>
      <P>
        This statement applies to all pages and interactive components of the
        DraftEdge web application, including the landing page, sign-in flow,
        home hub, rankings, cheat sheet, mock draft room, trade analyzer,
        research hub, player profiles, start/sit optimizer, community polls,
        advanced metrics, and legal pages.
      </P>

      <H2>Known limitations</H2>
      <P>
        We are actively working to resolve the following:
      </P>
      <Ul>
        <Li>
          <Strong>Third-party content.</Strong> Embedded links to external
          services (Supabase auth, Sleeper data) are governed by their own
          accessibility policies. We cannot guarantee their compliance.
        </Li>
        <Li>
          <Strong>Complex data tables.</Strong> The rankings and metrics tables
          contain a large amount of information. While we provide column headers,
          row labels, and sortable controls, very wide tables may be difficult
          to navigate on small screens. We recommend landscape orientation or
          desktop view for data-heavy pages.
        </Li>
        <Li>
          <Strong>Drag-and-drop.</Strong> The draft board supports mouse-based
          drag-and-drop reordering. We provide keyboard alternatives (arrow keys
          + Enter) but the drag interaction itself is not keyboard-operable.
        </Li>
      </Ul>

      <H2>Accessibility features by page</H2>
      <Ul>
        <Li>
          <Strong>Rankings / Cheat Sheet</Strong> — sortable table with column
          headers, positional filters as radio buttons, and tier-drop indicators.
        </Li>
        <Li>
          <Strong>Draft Room</Strong> — player search with type-ahead
          announcements, pick notifications via ARIA live regions, and a
          position-balance summary.
        </Li>
        <Li>
          <Strong>Trade Analyzer</Strong> — two-panel layout with labelled
          inputs, live verdict announcements, and roster-fit summaries that
          announce before/after changes.
        </Li>
        <Li>
          <Strong>Player Profiles</Strong> — structured headings for each
          metric section, stat grids with row headers, and star-toggle with
          state feedback.
        </Li>
        <Li>
          <Strong>Cookie Consent</Strong> — the consent banner is a labelled
          region with keyboard-operable toggle switches and focus-trapped modal
          for preferences.
        </Li>
      </Ul>

      <H2>Feedback</H2>
      <P>
        We welcome your feedback on the accessibility of DraftEdge. If you
        encounter a barrier or have a suggestion, please contact us at{" "}
        <a
          href="mailto:support@draftedge.app"
          className="font-semibold text-emerald-300 hover:underline"
        >
          support@draftedge.app
        </a>
        . We aim to respond within 5 business days.
      </P>

      <H2>Compatibility</H2>
      <P>
        DraftEdge is designed to work with the following assistive technologies:
      </P>
      <Ul>
        <Li>Modern desktop browsers (Chrome, Firefox, Safari, Edge)</Li>
        <Li>Mobile browsers on iOS (Safari) and Android (Chrome)</Li>
        <Li>Screen readers including NVDA, JAWS, VoiceOver, and TalkBack</Li>
        <Li>Switch access and voice control via browser-native support</Li>
      </Ul>

      <H2>Enforcement</H2>
      <P>
        This accessibility statement was last updated on August 22, 2026. We
        review and update it regularly as we add features and resolve issues.
        If you feel we are not meeting the standards described here, please
        reach out and we will work with you to provide the information or
        functionality you need.
      </P>
    </LegalPage>
  );
}
