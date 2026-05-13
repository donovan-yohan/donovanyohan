/**
 * pages/lab/weather.tsx — live tuner for the rough-ified weather icon
 * set. Renders all WMO categories side-by-side with sliders driving the
 * roughjs options (roughness, bowing, strokeWidth, seed) so we can dial
 * in a single look that reads cleanly at panel scale.
 *
 * Once happy with values, paste them into the RoughIcon defaults in
 * `components/lab/RoughIcon.tsx`.
 */

import Head from "next/head";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

const RoughIcon = dynamic(() => import("../../components/lab/RoughIcon"), {
  ssr: false,
});

type LucideLike = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

const ICONS: ReadonlyArray<{ Icon: LucideLike; label: string }> = [
  { Icon: Sun, label: "clear" },
  { Icon: CloudSun, label: "partly cloudy" },
  { Icon: Cloud, label: "clouds" },
  { Icon: CloudFog, label: "fog" },
  { Icon: CloudRain, label: "rain" },
  { Icon: CloudSnow, label: "snow" },
  { Icon: CloudLightning, label: "storms" },
];

type Params = {
  size: number;
  roughness: number;
  bowing: number;
  strokeWidth: number;
  seed: number;
  disableMultiStroke: boolean;
  preserveVertices: boolean;
};

const DEFAULTS: Params = {
  size: 96,
  roughness: 0.4,
  bowing: 0.4,
  strokeWidth: 1.1,
  seed: 1,
  disableMultiStroke: true,
  preserveVertices: true,
};

const SLIDERS: ReadonlyArray<{
  key: keyof Params;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}> = [
  { key: "size", label: "Size (px)", min: 32, max: 256, step: 4, hint: "Render size of each preview cell." },
  { key: "roughness", label: "Roughness", min: 0, max: 3, step: 0.05, hint: "Wobble amount. 0 = clean, 3 = sketchy chaos." },
  { key: "bowing", label: "Bowing", min: 0, max: 4, step: 0.05, hint: "How much lines curve. 0 = straight." },
  { key: "strokeWidth", label: "Stroke width", min: 0.4, max: 4, step: 0.05, hint: "Line thickness in viewBox units." },
  { key: "seed", label: "Seed", min: 1, max: 50, step: 1, hint: "Wobble RNG seed. Same seed = identical noise per render." },
];

export default function WeatherLab() {
  const [params, setParams] = useState<Params>(DEFAULTS);

  const update = <K extends keyof Params>(k: K, v: Params[K]) =>
    setParams((p) => ({ ...p, [k]: v }));

  const snippet = useMemo(
    () =>
      `// components/lab/RoughIcon.tsx defaults\nroughness: ${params.roughness}\nbowing: ${params.bowing}\nstrokeWidth: ${params.strokeWidth}\ndisableMultiStroke: ${params.disableMultiStroke}\npreserveVertices: ${params.preserveVertices}`,
    [params],
  );

  return (
    <>
      <Head>
        <title>Weather icon tuner</title>
      </Head>
      <main className="page">
        <header className="head">
          <h1>Weather icon tuner</h1>
          <p>
            All seven WMO categories rendered through{" "}
            <code>RoughIcon</code>. Tune the roughjs options below and paste
            the final values into <code>RoughIcon.tsx</code>.
          </p>
        </header>

        <section className="grid">
          {ICONS.map(({ Icon, label }) => (
            <figure key={label}>
              <RoughIcon
                Icon={Icon}
                size={params.size}
                roughness={params.roughness}
                bowing={params.bowing}
                strokeWidth={params.strokeWidth}
                seed={params.seed}
                disableMultiStroke={params.disableMultiStroke}
                preserveVertices={params.preserveVertices}
              />
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </section>

        <section className="sliders">
          {SLIDERS.map((s) => (
            <label key={s.key}>
              <div className="row">
                <span className="lbl">{s.label}</span>
                <span className="val">{params[s.key] as number}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={params[s.key] as number}
                onChange={(e) => update(s.key, Number(e.target.value) as never)}
              />
              <span className="hint">{s.hint}</span>
            </label>
          ))}
          <label className="toggle">
            <input
              type="checkbox"
              checked={params.disableMultiStroke}
              onChange={(e) => update("disableMultiStroke", e.target.checked)}
            />
            <span>disableMultiStroke</span>
            <span className="hint">
              When on, each path traces once. Off layers multiple offset
              strokes — looks like sketchy shrapnel on tiny icons.
            </span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={params.preserveVertices}
              onChange={(e) => update("preserveVertices", e.target.checked)}
            />
            <span>preserveVertices</span>
            <span className="hint">
              When on, corners stay sharp (no wobble at vertices) so the
              icon silhouette remains recognizable.
            </span>
          </label>
          <button type="button" onClick={() => setParams(DEFAULTS)}>
            Reset
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
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        figure {
          margin: 0;
          padding: 16px;
          border: 1px solid rgba(22, 20, 14, 0.18);
          border-radius: 4px;
          background: #fdfdf9;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        figcaption {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(22, 20, 14, 0.7);
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
        .toggle {
          display: grid;
          grid-template-columns: auto auto;
          column-gap: 8px;
          row-gap: 4px;
          align-items: center;
        }
        .toggle input {
          grid-row: 1;
          accent-color: #c33548;
        }
        .toggle span:first-of-type {
          grid-row: 1;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 700;
        }
        .toggle .hint {
          grid-column: 1 / -1;
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
          .sliders {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
