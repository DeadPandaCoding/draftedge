/**
 * Liquid Glass aurora backdrop — a fixed, full-viewport layer of vibrant
 * multi-color gradient blobs pinned behind all content. The translucent glass
 * panels above refract and blur it (via backdrop-filter blur + saturate),
 * which is what gives the material its "liquid" depth.
 *
 * Server-safe: pure CSS keyframes, no client hooks. Purely decorative —
 * hidden from assistive technology and pointer-events.
 */
export function Aurora() {
  return (
    <div aria-hidden="true" className="aurora">
      <span className="aurora-blob aurora-blob--1" />
      <span className="aurora-blob aurora-blob--2" />
      <span className="aurora-blob aurora-blob--3" />
      <span className="aurora-blob aurora-blob--4" />
      <span className="aurora-blob aurora-blob--5" />
    </div>
  );
}
