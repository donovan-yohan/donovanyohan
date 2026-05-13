/**
 * pages/lab/grayscale.tsx — preview the codex source image as grayscale
 * with live contrast + brightness sliders. All client-side via CSS
 * filters (no server pipeline), so we can dial in tonal levels before
 * deciding how to feed the result into either:
 *   - The line-art bake (`scripts/png-to-lineart.mjs`), or
 *   - A future grayscale-driven HatchScene mode (density = darkness map
 *     instead of binary alpha mask).
 */

import Head from "next/head";
import { useMemo, useState } from "react";

type Params = {
  brightness: number;
  contrast: number;
  invert: number;
  grain: number;
};

const DEFAULTS: Params = {
  brightness: 100,
  contrast: 110,
  invert: 0,
  grain: 0,
};

const SLIDERS: ReadonlyArray<{
  key: keyof Params;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint: string;
}> = [
  { key: "brightness", label: "Brightness", min: 0, max: 250, step: 1, unit: "%", hint: "100 = neutral. <100 darkens, >100 brightens." },
  { key: "contrast", label: "Contrast", min: 0, max: 300, step: 1, unit: "%", hint: "100 = neutral. Higher pushes whites whiter + darks darker." },
  { key: "invert", label: "Invert", min: 0, max: 100, step: 1, unit: "%", hint: "0 = normal, 100 = full invert (skin dark, hair light)." },
  { key: "grain", label: "Saturate floor", min: 0, max: 100, step: 1, unit: "%", hint: "0 = pure grayscale, 100 = full colour back. Toggle to compare." },
];

export default function GrayscaleLab() {
  const [params, setParams] = useState<Params>(DEFAULTS);

  const filter = useMemo(() => {
    const sat = 1 - params.grain / 100;
    return [
      `grayscale(${sat})`,
      `brightness(${params.brightness}%)`,
      `contrast(${params.contrast}%)`,
      `invert(${params.invert}%)`,
    ].join(" ");
  }, [params]);

  const snippet = useMemo(() => {
    // Convert the CSS filter values back into magick command-line flags
    // so the operator can paste them into the bake script if they want
    // a baked grayscale source instead of a runtime filter.
    const brightnessShift = params.brightness - 100;
    const contrastK = (params.contrast / 100) * 4; // rough sigmoidal mapping
    return [
      `# magick equivalents`,
      `magick input.png \\`,
      `  -colorspace Gray \\`,
      `  -brightness-contrast ${brightnessShift}x${params.contrast - 100} \\`,
      `  ${params.invert ? "-negate \\" : ""}`,
      `  output-gray.png`,
      ``,
      `# OR via sigmoidal-contrast`,
      `magick input.png -colorspace Gray -sigmoidal-contrast ${contrastK.toFixed(1)}x50% ${params.invert ? "-negate " : ""}output-gray.png`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [params]);

  return (
    <>
      <Head>
        <title>Grayscale tuner</title>
      </Head>
      <main className="page">
        <header className="head">
          <h1>Grayscale tuner</h1>
          <p>
            Preview the codex source as grayscale with live brightness +
            contrast. CSS-filter based — instant feedback. Use the
            snippet at the bottom to bake the same tonal mapping into a
            magick command.
          </p>
        </header>

        <section className="stage">
          <figure>
            <figcaption>Original</figcaption>
            <img src="/img/manga/dy-studies.png" alt="source" />
          </figure>
          <figure>
            <figcaption>Filtered</figcaption>
            <img
              src="/img/manga/dy-studies.png"
              alt="grayscale preview"
              style={{ filter }}
            />
          </figure>
        </section>

        <section className="sliders">
          {SLIDERS.map((s) => (
            <label key={s.key}>
              <div className="row">
                <span className="lbl">{s.label}</span>
                <span className="val">
                  {params[s.key]}
                  {s.unit}
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={params[s.key]}
                onChange={(e) =>
                  setParams((p) => ({ ...p, [s.key]: Number(e.target.value) }))
                }
              />
              <span className="hint">{s.hint}</span>
            </label>
          ))}
          <button type="button" onClick={() => setParams(DEFAULTS)}>
            Reset
          </button>
        </section>

        <pre className="snippet">{snippet}</pre>

        <p className="note">
          Next step idea: feed the filtered grayscale image into the
          HatchScene shader as a <em>density map</em> instead of a binary
          alpha mask. Darker pixels would render denser hatching, lighter
          pixels sparser — turning the photo into a continuous cross-hatch
          shading that responds to cursor proximity. Ping when you want
          that wired up.
        </p>
      </main>

      <style jsx>{`
        .page {
          max-width: 1400px;
          margin: 0 auto;
          padding: 48px 32px 96px;
          font-family: ui-monospace, monospace;
          color: #16140e;
        }
        h1 {
          margin: 0 0 8px;
          font-size: 28px;
          letter-spacing: -0.02em;
        }
        p {
          margin: 0 0 32px;
          color: rgba(22, 20, 14, 0.7);
          font-family: ui-serif, Georgia, serif;
        }
        .stage {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        figure {
          margin: 0;
          border: 1px solid rgba(22, 20, 14, 0.18);
          border-radius: 4px;
          overflow: hidden;
          background: #fdfdf9;
        }
        figcaption {
          padding: 8px 12px;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(22, 20, 14, 0.6);
          border-bottom: 1px solid rgba(22, 20, 14, 0.18);
        }
        figure img {
          width: 100%;
          height: auto;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          display: block;
        }
        .sliders {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px 32px;
          margin-bottom: 32px;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .lbl {
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 700;
        }
        .val {
          font-variant-numeric: tabular-nums;
          color: #c33548;
          font-weight: 700;
        }
        input[type="range"] {
          width: 100%;
          accent-color: #c33548;
        }
        .hint {
          font-size: 12px;
          color: rgba(22, 20, 14, 0.55);
          font-family: ui-serif, Georgia, serif;
        }
        button {
          grid-column: 1 / -1;
          padding: 10px 16px;
          background: #16140e;
          color: #fdfdf9;
          border: 0;
          border-radius: 2px;
          font-family: inherit;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          justify-self: start;
        }
        .snippet {
          background: rgba(22, 20, 14, 0.06);
          padding: 16px 20px;
          border-radius: 2px;
          font-size: 12px;
          line-height: 1.6;
          white-space: pre-wrap;
          overflow-x: auto;
        }
        .note {
          margin-top: 24px;
          padding: 16px 20px;
          border-left: 3px solid #c33548;
          background: rgba(195, 53, 72, 0.05);
        }
        @media (max-width: 900px) {
          .stage,
          .sliders {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
