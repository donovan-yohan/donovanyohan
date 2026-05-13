import dynamic from "next/dynamic";
import Head from "next/head";
import { useRef, useState } from "react";
import { Box, Card, Grid, MarginAnchor, Stack } from "../components/lab/system";
import { gm500, gm800, cp400, cp400i } from "../global/fonts";

const DotGrid = dynamic(() => import("../components/lab/DotGrid"), { ssr: false });
const HatchScene = dynamic(() => import("../components/lab/HatchScene"), { ssr: false });
const Notebook = dynamic(() => import("../components/lab/Notebook"), { ssr: false });

interface SectionProps {
  num: string;
  label: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}

const Section = ({ num, label, title, lead, children }: SectionProps) => (
  <section className="techoSection">
    <MarginAnchor sticky={false}>
      <span className={`marginNum ${gm800.className}`}>{num}</span>
      <span className={`marginLabel ${gm500.className}`}>{label}</span>
    </MarginAnchor>
    <div className="techoBody">
      <h2 className={`sectionTitle ${gm500.className}`}>{title}</h2>
      <p className={`sectionLead ${cp400.className}`}>{lead}</p>
      {children}
    </div>
  </section>
);

interface ShaderSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  desc: string;
  format?: (v: number) => string;
  monoClass: string;
  serifClass: string;
  onChange: (v: number) => void;
}

const ShaderSlider = ({
  label,
  value,
  min,
  max,
  step,
  desc,
  format,
  monoClass,
  serifClass,
  onChange,
}: ShaderSliderProps) => (
  <Stack gap={0}>
    <Stack direction="row" justify="between" align="center" gap={1}>
      <span className={`sliderLabel ${monoClass}`}>{label}</span>
      <span className={`sliderValue ${monoClass}`}>
        {format ? format(value) : value.toFixed(3)}
      </span>
    </Stack>
    <input
      type="range"
      className="sliderInput"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
    <p className={`sliderDesc ${serifClass}`}>{desc}</p>
  </Stack>
);

interface HatchPlaygroundProps {
  monoClass: string;
  serifClass: string;
}

const HatchPlayground = ({ monoClass, serifClass }: HatchPlaygroundProps) => {
  const [hatchScale, setHatchScale] = useState(16);
  const [halfWidthV, setHalfWidthV] = useState(0.07);
  const [mouseRadius, setMouseRadius] = useState(600);
  const [baseDensity, setBaseDensity] = useState(0);
  const [outlineWidth, setOutlineWidth] = useState(0.5);
  const [padding, setPadding] = useState(24);
  const [fadeWidth, setFadeWidth] = useState(0.5);
  const [thicknessJitter, setThicknessJitter] = useState(0.59);
  const [lineWobble, setLineWobble] = useState(0.89);
  const [peakDensity, setPeakDensity] = useState(1);

  return (
    <Grid cols={2} gap={1}>
      <Card>
        <Stack gap={1}>
          <span className={`shaderLabel ${monoClass}`}>preview · dy</span>
          <HatchScene
            mask={{ kind: "svg", src: "/img/dy.svg" }}
            height={416}
            hatchScale={hatchScale}
            halfWidthV={halfWidthV}
            mouseRadius={mouseRadius}
            baseDensity={baseDensity}
            outlineWidth={outlineWidth}
            padding={padding}
            fadeWidth={fadeWidth}
            thicknessJitter={thicknessJitter}
            lineWobble={lineWobble}
            peakDensity={peakDensity}
          />
        </Stack>
      </Card>
      <Card>
        <Stack gap={2}>
          <span className={`shaderLabel ${monoClass}`}>uniforms</span>
          <ShaderSlider
            label="hatchScale"
            value={hatchScale}
            min={4}
            max={32}
            step={1}
            format={(v) => `${v} px`}
            desc="Pixels per v-unit. Larger = wider line spacing and bigger crosses; smaller = tighter, denser-looking pattern."
            monoClass={monoClass}
            serifClass={serifClass}
            onChange={setHatchScale}
          />
          <ShaderSlider
            label="halfWidthV"
            value={halfWidthV}
            min={0.02}
            max={0.15}
            step={0.005}
            desc="Line half-width in v-space (the same coordinate the line grid is laid out on). Identical across every subdivision level, so every drawn line is the same thickness."
            monoClass={monoClass}
            serifClass={serifClass}
            onChange={setHalfWidthV}
          />
          <ShaderSlider
            label="mouseRadius"
            value={mouseRadius}
            min={50}
            max={600}
            step={10}
            format={(v) => `${v} px`}
            desc="Cursor influence radius in render-buffer pixels. Inside the radius, density rises smoothly toward the cursor; outside, only the base level shows."
            monoClass={monoClass}
            serifClass={serifClass}
            onChange={setMouseRadius}
          />
          <ShaderSlider
            label="baseDensity"
            value={baseDensity}
            min={0}
            max={1}
            step={0.05}
            desc="Idle density floor. 0 keeps the rest state at the sparsest level-0 spacing; raising it pre-activates the next subdivision levels everywhere, even with no cursor."
            monoClass={monoClass}
            serifClass={serifClass}
            onChange={setBaseDensity}
          />
          <ShaderSlider
            label="peakDensity"
            value={peakDensity}
            min={0}
            max={1}
            step={0.05}
            desc="Density ceiling at the cursor's centre. 1 = all subdivision levels reachable; lower = caps how many levels can ever activate, so hovering still leaves some sparsity. Always coerced to be at least baseDensity."
            monoClass={monoClass}
            serifClass={serifClass}
            onChange={setPeakDensity}
          />
          <ShaderSlider
            label="fadeWidth"
            value={fadeWidth}
            min={0}
            max={0.5}
            step={0.005}
            desc="How gradually each subdivision level fades in around its activation threshold. 0 = hard pop-in; larger = lines have long faded tails as the proximity field crosses each level. Base lines stay crisp regardless."
            monoClass={monoClass}
            serifClass={serifClass}
            onChange={setFadeWidth}
          />
          <ShaderSlider
            label="thicknessJitter"
            value={thicknessJitter}
            min={0}
            max={2}
            step={0.01}
            desc="Per-line thickness variation. Each line picks a constant multiplier in 1 ± jitter, so neighbouring strokes feel slightly heavier or lighter — like uneven pen pressure — without breaking uniformity along a single line."
            monoClass={monoClass}
            serifClass={serifClass}
            onChange={setThicknessJitter}
          />
          <ShaderSlider
            label="lineWobble"
            value={lineWobble}
            min={0}
            max={2}
            step={0.01}
            desc="Slight per-line drift along its length, driven by smooth value noise. Lines bend gently like a pen wandering off true; amplitude is clamped under the line spacing so neighbours never cross — strokes stay parallel."
            monoClass={monoClass}
            serifClass={serifClass}
            onChange={setLineWobble}
          />
          <ShaderSlider
            label="outlineWidth"
            value={outlineWidth}
            min={0.5}
            max={6}
            step={0.25}
            format={(v) => `${v.toFixed(2)} px`}
            desc="Distance (in pixels) the outline pass samples its neighbor texels. Larger = thicker, softer outline; smaller = a tight crisp ring on the mask."
            monoClass={monoClass}
            serifClass={serifClass}
            onChange={setOutlineWidth}
          />
          <ShaderSlider
            label="padding"
            value={padding}
            min={0}
            max={64}
            step={1}
            format={(v) => `${v} px`}
            desc="Padding inside the mask canvas before the glyph is drawn. 0 makes the glyph touch the edges; higher values float it inset with breathing room."
            monoClass={monoClass}
            serifClass={serifClass}
            onChange={setPadding}
          />
        </Stack>
      </Card>
    </Grid>
  );
};

const Lab = () => {
  const dotAnchorRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <Head>
        <title>Lab · Engineering notebook · iter 06</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Box className="topnav">
        <Stack
          as="div"
          direction="row"
          align="center"
          gap={2}
          className="topnavInner"
        >
          <span className={`topnavMark ${gm800.className}`}>dy</span>
          <span className={`topnavLabel ${gm500.className}`}>/lab — iter 06 · notebook</span>
          <span className={`topnavCrumbs ${gm500.className}`}>
            [index] [writing] [projects] [about]
          </span>
          <span className={`topnavLabel ${gm500.className}`}>~/log /donovan-yohan</span>
        </Stack>
      </Box>

      <Box as="header" className="hero">
        <Box as="div" className="heroInner">
          <span className={`micro ${gm500.className}`}>HOBONICHI · ENGINEERING NOTEBOOK</span>
          <h1 className={`heroTitle ${gm800.className}`}>Pages from the working notebook.</h1>
          <p className={`heroLead ${cp400.className}`}>
            A working journal — half portfolio, half lab notebook. Indexed entries on a 16px grid,
            grouped by month, filterable by type. Each entry pre-defined so it can carry its own{" "}
            <em className={cp400i.className}>colour, accent, and weight</em>.
          </p>
        </Box>
      </Box>

      <Box className="paper">
        <DotGrid spacing={16} maxRadiusBoost={1.1} anchorRef={dotAnchorRef} />

        <Box as="main" className="page">
          <div ref={dotAnchorRef} className="dotAnchor" aria-hidden />
          {/* §01 — Hatch shader (kept) */}
          <Section
            num="01"
            label="SHADER · HATCH"
            title="01 — Hatch shader · proximity reactivity"
            lead="WebGL fragment shader · text-alpha mask · 4 hatch directions ramped in by mouse
            proximity. Outline always visible, hatching fills inside."
          >
            <Grid cols={2} gap={1} mb={1}>
              <Card>
                <Stack gap={1}>
                  <span className={`shaderLabel ${gm500.className}`}>Geist Mono · 800</span>
                  <HatchScene
                    mask={{
                      kind: "text",
                      text: "Donovan Yohan.",
                      fontFamily: "Geist Mono",
                      fontWeight: 800,
                    }}
                  />
                </Stack>
              </Card>
              <Card>
                <Stack gap={1}>
                  <span className={`shaderLabel ${gm500.className}`}>Geist Mono · 500</span>
                  <HatchScene
                    mask={{
                      kind: "text",
                      text: "Donovan Yohan.",
                      fontFamily: "Geist Mono",
                      fontWeight: 500,
                    }}
                  />
                </Stack>
              </Card>
            </Grid>

            <Grid cols={2} gap={1}>
              <Card>
                <Stack gap={1}>
                  <span className={`shaderLabel ${gm500.className}`}>dy · raw SVG</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/dy.svg" alt="dy logo" className="rawSvg" />
                </Stack>
              </Card>
              <Card>
                <Stack gap={1}>
                  <span className={`shaderLabel ${gm500.className}`}>dy · piped through hatch</span>
                  <HatchScene mask={{ kind: "svg", src: "/img/dy.svg" }} height={416} padding={48} />
                </Stack>
              </Card>
            </Grid>
          </Section>

          {/* §02 — Hatch shader playground */}
          <Section
            num="02"
            label="SHADER · PLAYGROUND"
            title="02 — Hatch shader · live playground"
            lead="Drag any slider to drive the corresponding uniform on the hatch material in real time. Move the cursor over the preview to see how mouseRadius shapes the proximity field."
          >
            <HatchPlayground
              monoClass={gm500.className}
              serifClass={cp400.className}
            />
          </Section>

          {/* §03 — Engineering notebook */}
          <Section
            num="03"
            label="NOTEBOOK · INDEXED"
            title="03 — Indexed engineering notebook"
            lead="Sticky big-bold month headers. Bullet-journal filter chips counting by type. Entries on a 12-column 16px grid with per-card span, accent, and tint pre-defined so each card can carry its own brand colour and highlight."
          >
            <Notebook
              monoClass={gm500.className}
              serifClass={cp400.className}
              italicSerifClass={cp400i.className}
            />
          </Section>

          <Box as="footer" mt={4} pt={2} className="footer">
            <span className={`micro ${gm500.className}`}>
              Type locked: Geist Mono + Crimson Pro. Notebook prototype on a 16px baseline grid;
              hatch shader retained from prior iter.
            </span>
          </Box>
        </Box>
      </Box>

      <style jsx global>{`
        :root {
          --u: 16px;
          --paper: #fdfdf9;
          --paper-2: #ffffff;
          --ink: #16140e;
          --ink-soft: rgba(22, 20, 14, 0.78);
          --ink-mute: rgba(22, 20, 14, 0.55);
          --ink-faint: rgba(22, 20, 14, 0.32);
          --rule: rgba(22, 20, 14, 0.32);
          --accent: #c33548;
          --accent-soft: rgba(195, 53, 72, 0.12);
          --gutter-w: calc(12 * var(--u));
          --gutter-pad: var(--u);
          --content-pad-left: calc(var(--gutter-w) + var(--gutter-pad));
          /* Content width snaps to 16px-lattice-valid sizes for cols 2/3/4
             (192px = 12 × 16 step). Floor 944, cap 1520. 5-col rows drift
             a few px off lattice — accepted trade for reactivity. */
          --content-w: clamp(
            944px,
            round(down, 100vw - var(--content-pad-left) - 64px, 192px),
            1520px
          );
          --page-max: calc(var(--content-pad-left) + var(--content-w) + 32px);
        }
        html,
        body {
          margin: 0;
          padding: 0;
          background: var(--paper);
          color: var(--ink);
          font-family: ui-monospace, monospace;
        }
        * {
          box-sizing: border-box;
        }
        body::before {
          content: "";
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          width: var(--gutter-w);
          background: var(--paper);
          z-index: 1;
          pointer-events: none;
        }
        body::after {
          content: "";
          position: fixed;
          top: 0;
          bottom: 0;
          left: var(--gutter-w);
          width: 1px;
          background: var(--accent);
          z-index: 60;
          pointer-events: none;
        }
      `}</style>

      <style jsx global>{`
        .topnav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--paper);
          border-bottom: 1px solid var(--rule);
        }
        .topnavInner {
          max-width: var(--page-max);
          padding: 16px 32px 16px var(--content-pad-left);
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .topnavMark {
          font-size: 24px;
          letter-spacing: -0.04em;
          color: var(--ink);
          line-height: 1;
        }
        .topnavLabel,
        .topnavCrumbs {
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-mute);
        }
        .topnavCrumbs {
          margin-left: auto;
        }
        .topnavLabel:last-child {
          margin-left: 16px;
        }

        .hero {
          background: var(--paper);
          border-bottom: 1px solid var(--rule);
        }
        .heroInner {
          max-width: var(--page-max);
          padding: 96px 32px 96px var(--content-pad-left);
        }
        .micro {
          display: block;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-mute);
          margin-bottom: 32px;
        }
        .heroTitle {
          margin: 0 0 32px;
          font-size: 80px;
          line-height: 0.95;
          letter-spacing: -0.04em;
          color: var(--ink);
        }
        .heroLead {
          margin: 0;
          font-size: 22px;
          line-height: 32px;
          max-width: 720px;
          color: var(--ink-soft);
        }

        .paper {
          position: relative;
        }
        .page {
          position: relative;
          z-index: 1;
          max-width: var(--page-max);
          padding: 64px 32px 128px var(--content-pad-left);
        }
        .dotAnchor {
          width: 0;
          height: 0;
          pointer-events: none;
        }

        .techoSection {
          position: relative;
          margin-bottom: 96px;
        }
        .marginNum {
          display: block;
          font-size: 56px;
          line-height: 1;
          color: var(--ink);
          letter-spacing: -0.04em;
        }
        .marginLabel {
          display: block;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink);
          text-align: right;
        }
        .techoBody {
          min-width: 0;
          padding-top: 8px;
        }
        .sectionTitle {
          margin: 0 0 16px;
          font-size: 14px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-mute);
          font-weight: 500;
        }
        .sectionLead {
          margin: 0 0 32px;
          font-size: 19px;
          line-height: 1.5;
          max-width: 720px;
          color: var(--ink-soft);
        }

        /* HATCH SHADER */
        .shaderRow {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        .shaderCell {
          display: flex;
          flex-direction: column;
          padding: 16px;
          background: transparent;
          border: 1px solid var(--rule);
          border-radius: 2px;
        }
        .shaderLabel {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-mute);
          margin-bottom: 12px;
        }
        .logoSplit {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .logoCell {
          display: flex;
          flex-direction: column;
          padding: 16px;
          background: transparent;
          border: 1px solid var(--rule);
          border-radius: 2px;
        }
        .rawSvg {
          width: 100%;
          height: 416px;
          object-fit: contain;
          padding: 32px;
        }

        .sliderLabel {
          font-size: 11px;
          letter-spacing: 0.10em;
          text-transform: uppercase;
          color: var(--ink);
        }
        .sliderValue {
          font-size: 11px;
          letter-spacing: 0.05em;
          color: var(--ink-mute);
        }
        .sliderInput {
          appearance: none;
          width: 100%;
          height: 2px;
          background: var(--rule);
          border-radius: 2px;
          margin: 6px 0;
          cursor: pointer;
        }
        .sliderInput::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          background: var(--ink);
          border-radius: 50%;
          cursor: pointer;
        }
        .sliderInput::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: var(--ink);
          border: none;
          border-radius: 50%;
          cursor: pointer;
        }
        .sliderDesc {
          font-size: 13px;
          line-height: 1.45;
          color: var(--ink-mute);
          margin: 0;
        }

        .footer {
          margin-top: 64px;
          padding-top: 32px;
          border-top: 1px solid var(--rule);
        }

        @media (max-width: 800px) {
          .heroInner,
          .topnavInner {
            padding-left: 20px;
            padding-right: 20px;
          }
          .heroTitle {
            font-size: 44px;
          }
          .page {
            padding: 32px 20px 64px;
          }
          .topnavInner,
          .heroInner,
          .page {
            border-left-width: 0;
          }
          .techoSection {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .marginAccent {
            display: none;
          }
          .shaderRow,
          .logoSplit {
            grid-template-columns: 1fr;
          }
          .topnavCrumbs {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default Lab;
