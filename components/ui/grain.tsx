/**
 * Subtle animated film-grain overlay.
 *
 * Server-safe: the shimmer is pure CSS keyframes (see `.grain-overlay` in
 * globals.css). Decorative only — hidden from assistive technology and
 * pointer-events so it never blocks interaction.
 */
export function GrainOverlay() {
  return <div aria-hidden="true" className="grain-overlay" />;
}
