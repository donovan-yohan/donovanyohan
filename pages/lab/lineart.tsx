/**
 * pages/lab/lineart.tsx — live tuner for the manga line-art pipeline.
 *
 * Side-by-side: original codex PNG ↔ derived SVG line art. Sliders drive
 * the magick + potrace params on /api/lineart, debounced so each tweak
 * fires once after the user pauses. Copy-paste the final values into
 * `scripts/png-to-lineart.mjs` to bake them in.
 *
 * Dev-only — the API route bails in production because it relies on the
 * host having `magick` + `potrace` binaries.
 */

import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";

import { themeBootstrap } from "../../lib/theme-bootstrap";

type Params = {
  resize: number;
  contrastK: number;
  contrastM: number;
  blur: number;
  cannyLow: number;
  cannyHigh: number;
  lineTurd: number;
  shadowThreshold: number;
  shadowLevelLow: number;
  shadowLevelHigh: number;
  shadowTurd: number;
};

const DEFAULTS: Params = {
  resize: 2200,
  contrastK: 6,
  contrastM: 55,
  blur: 0.4,
  cannyLow: 4,
  cannyHigh: 18,
  lineTurd: 4,
  shadowThreshold: 18,
  shadowLevelLow: 10,
  shadowLevelHigh: 92,
  shadowTurd: 20,
};

const SLIDERS: ReadonlyArray<{
  key: keyof Params;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}> = [
  { key: "resize", label: "Input resize", min: 800, max: 3600, step: 100, hint: "Working width. Higher = more detail + slower." },
  { key: "contrastK", label: "Contrast strength", min: 0, max: 15, step: 0.5, hint: "Sigmoidal contrast k. Higher pulls strands out of dark regions." },
  { key: "contrastM", label: "Contrast midpoint %", min: 10, max: 90, step: 1, hint: "Where the S-curve pivots. Lower = brighten, higher = darken." },
  { key: "blur", label: "Pre-blur σ", min: 0, max: 3, step: 0.1, hint: "Noise floor before edges. 0 = sharp + noisy, 1+ = smooth." },
  { key: "cannyLow", label: "Canny low gate %", min: 0, max: 20, step: 0.5, hint: "Smallest edge to keep. Lower = catch more subtle lines." },
  { key: "cannyHigh", label: "Canny high gate %", min: 5, max: 60, step: 1, hint: "Strong-edge bar. Lower = more lines (face noise risk)." },
  { key: "lineTurd", label: "Line turdsize", min: 1, max: 40, step: 1, hint: "Min pixel area for a line. Higher = drop short fragments." },
  { key: "shadowThreshold", label: "Shadow threshold %", min: 0, max: 60, step: 1, hint: "Black-ink cutoff. Lower = less coverage, higher = chunkier shadows." },
  { key: "shadowLevelLow", label: "Shadow level low %", min: 0, max: 40, step: 1, hint: "Black point. Pixels under this go full black before threshold." },
  { key: "shadowLevelHigh", label: "Shadow level high %", min: 50, max: 100, step: 1, hint: "White point. Pixels over this go full white before threshold." },
  { key: "shadowTurd", label: "Shadow turdsize", min: 1, max: 150, step: 1, hint: "Min pixel area for a shadow blob. Drops speckle." },
];

const useDebounced = <T,>(value: T, ms: number): T => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
};

export default function LineartLab() {
  const [params, setParams] = useState<Params>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const debouncedParams = useDebounced(params, 300);
  const abortRef = useRef<AbortController | null>(null);

  const query = useMemo(() => {
    const qs = new URLSearchParams();
    for (const k of Object.keys(debouncedParams) as (keyof Params)[]) {
      qs.set(k, String(debouncedParams[k]));
    }
    return qs.toString();
  }, [debouncedParams]);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setErr(null);
    fetch(`/api/lineart?${query}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.text();
      })
      .then((text) => {
        if (ctrl.signal.aborted) return;
        setSvg(text);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        setErr(String(e));
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [query]);

  const update = (k: keyof Params, v: number) =>
    setParams((p) => ({ ...p, [k]: v }));

  const snippet = useMemo(() => {
    return `// scripts/png-to-lineart.mjs — tuned values
//   -resize ${params.resize}x
//   -sigmoidal-contrast ${params.contrastK}x${params.contrastM}%
//   -blur 0x${params.blur}
//   -canny 0x1+${params.cannyLow}%+${params.cannyHigh}%
//   potrace --turdsize ${params.lineTurd} (line)
//   -level ${params.shadowLevelLow}%,${params.shadowLevelHigh}%
//   -threshold ${params.shadowThreshold}%
//   potrace --turdsize ${params.shadowTurd} (shadow)`;
  }, [params]);

  return (
    <>
      <Head>
        <title>Lineart tuner</title>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </Head>
      <main className="page">
        <header className="head">
          <h1>Lineart tuner</h1>
          <p>
            Live tune the magick + potrace pipeline. Sliders update the
            preview after a 300ms pause. Bake the final values into{" "}
            <code>scripts/png-to-lineart.mjs</code>.
          </p>
        </header>

        <section className="stage">
          <figure>
            <figcaption>Source</figcaption>
            <img src="/img/manga/dy-studies.png" alt="source" />
          </figure>
          <figure>
            <figcaption>Lineart {loading ? "(rendering…)" : ""}</figcaption>
            <div
              className="svgPreview"
              dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
            />
            {err ? <pre className="err">{err}</pre> : null}
          </figure>
        </section>

        <section className="sliders">
          {SLIDERS.map((s) => (
            <label key={s.key}>
              <div className="row">
                <span className="lbl">{s.label}</span>
                <span className="val">{params[s.key]}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={params[s.key]}
                onChange={(e) => update(s.key, Number(e.target.value))}
              />
              <span className="hint">{s.hint}</span>
            </label>
          ))}
          <button type="button" onClick={() => setParams(DEFAULTS)}>
            Reset to defaults
          </button>
        </section>

        <pre className="snippet">{snippet}</pre>
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
        code {
          background: rgba(0, 0, 0, 0.05);
          padding: 2px 6px;
          border-radius: 2px;
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
          display: flex;
          flex-direction: column;
        }
        figcaption {
          padding: 8px 12px;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(22, 20, 14, 0.6);
          border-bottom: 1px solid rgba(22, 20, 14, 0.18);
        }
        figure img,
        .svgPreview {
          width: 100%;
          height: auto;
          aspect-ratio: 1 / 1;
          object-fit: contain;
          background: #fafafa;
        }
        .svgPreview :global(svg) {
          width: 100%;
          height: 100%;
          display: block;
        }
        .err {
          padding: 16px;
          color: #b04a3c;
          background: rgba(176, 74, 60, 0.06);
          font-size: 12px;
          white-space: pre-wrap;
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
