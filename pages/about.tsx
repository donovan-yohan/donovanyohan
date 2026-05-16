/**
 * /about — horizontally-scrolling life timeline.
 *
 * Whole page is locked to 100dvh: there is no vertical scroll. Vertical
 * wheel input is captured and remapped to `scrollLeft` on a horizontal
 * scroller that fills the viewport below a fixed topnav. The hero takes
 * almost the full first screen (`calc(100vw - 128px)`); the remaining
 * 128px reveals the rail + first card of the timeline, signalling that
 * there's more to the right.
 *
 * Inside the timeline block, a rail of year markers sits on top of the
 * horizontal lane of cards. Rail and lane share the same `cardStride` /
 * `leftPad` math so ticks line up over their cards. Sketches draw on as
 * each card crosses the viewport's horizontal middle, via an
 * IntersectionObserver scoped to the scroller.
 */

import Head from "next/head";
import dynamic from "next/dynamic";
import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import { timeline } from "../global/timeline";
import { TimelineCard } from "../components/about/TimelineCard";
import { TimelineRail } from "../components/about/TimelineRail";
import { HeroComposition } from "../components/about/HeroComposition";
import SiteNav from "../components/SiteNav";
import Context from "../components/context";
import { themeBootstrap } from "../lib/theme-bootstrap";
import { gm500, gm800, cp400, cp400i } from "../global/fonts";
import { dotGridColor } from "../lib/dot-grid-color";

const DotGrid = dynamic(() => import("../components/lab/DotGrid"), { ssr: false });

// Desktop lane geometry lives in CSS variables so narrow viewports can keep
// the same horizontal timeline while shrinking cards to the viewport.
const LEFT_PAD_U = 2;
const RIGHT_PAD_U = 8;

const About = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [drawnIds, setDrawnIds] = useState<Set<string>>(() => new Set());
  const { theme } = useContext(Context);

  // Wheel hijack: deltaY → scrollLeft. Native horizontal trackpad input is
  // left alone (only fires when |deltaY| > |deltaX|).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Per-card draw-on trigger. Once drawn, an id sticks — re-scrolling past
  // doesn't restart the animation.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const targets = el.querySelectorAll<HTMLElement>("[data-tcard-id]");
    const io = new IntersectionObserver(
      (entries) => {
        setDrawnIds((prev) => {
          let next = prev;
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = entry.target.getAttribute("data-tcard-id");
            if (!id || prev.has(id)) return;
            if (next === prev) next = new Set(prev);
            next.add(id);
          });
          return next;
        });
      },
      { root: el, rootMargin: "0px -10% 0px -10%", threshold: 0.2 }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  const handleShellKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;

    const lane = el.querySelector<HTMLElement>(".aboutLane");
    const slot = el.querySelector<HTMLElement>(".aboutSlot");
    const gap = lane ? Number.parseFloat(window.getComputedStyle(lane).columnGap) || 48 : 48;
    const stride = (slot?.getBoundingClientRect().width || 448) + gap;

    let left: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "PageDown") {
      left = el.scrollLeft + stride;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "PageUp") {
      left = el.scrollLeft - stride;
    } else if (event.key === "Home") {
      left = 0;
    } else if (event.key === "End") {
      left = el.scrollWidth;
    }

    if (left === null) return;
    event.preventDefault();
    el.scrollTo({ left, behavior: "smooth" });
  };

  return (
    <>
      <Head>
        <title>About · Donovan Yohan</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </Head>

      <SiteNav current="about" />

      <div
        className="aboutShell"
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label="Horizontal about timeline. Use arrow keys, wheel, drag, or swipe to move sideways."
        onKeyDown={handleShellKeyDown}
      >
        <DotGrid
          spacing={16}
          maxRadiusBoost={1.1}
          scrollContainerRef={scrollerRef}
          color={dotGridColor(theme)}
        />

        {/* Hero panel — full-height graphic-design landing. */}
        <HeroComposition
          monoClass={gm500.className}
          monoBoldClass={gm800.className}
          serifClass={cp400.className}
          italicSerifClass={cp400i.className}
          scrollerRef={scrollerRef}
        />

        {/* Timeline block — rail on top, lane below, both fixed-width. */}
        <section className="aboutTimeline">
          <TimelineRail
            events={timeline}
            monoClass={gm500.className}
            monoBoldClass={gm800.className}
          />
          <div className="aboutLane">
            <div className="aboutLanePad" aria-hidden />
            {timeline.map((event, i) => (
              <div key={event.id} className="aboutSlot" data-tcard-id={event.id}>
                <TimelineCard
                  event={event}
                  monoClass={gm500.className}
                  monoBoldClass={gm800.className}
                  serifClass={cp400.className}
                  italicSerifClass={cp400i.className}
                  drawn={drawnIds.has(event.id)}
                  seed={i + 1}
                />
              </div>
            ))}
            <div className="aboutLanePadEnd" aria-hidden />
          </div>
        </section>
      </div>

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
          --hero-panel-w: calc(100vw - 128px);
          --timeline-card-w: calc(28 * var(--u));
          --timeline-gap: calc(3 * var(--u));
          --timeline-left-pad: calc(${LEFT_PAD_U} * var(--u));
          --timeline-right-pad: calc(${RIGHT_PAD_U} * var(--u));
          --rail-lane-h: calc(5 * var(--u));
          /* Highlighter tab colours — mirrored from the home page so the nav
             reads identically across routes. */
          --hl-1: rgba(120, 220, 255, 0.55);
          --hl-2: rgba(255, 130, 200, 0.55);
          --hl-3: rgba(180, 255, 130, 0.6);
          --hl-4: rgba(255, 224, 102, 0.55);
          --tab-resume: var(--hl-3);
          --tab-work: var(--hl-2);
          --tab-about: var(--hl-4);
          --tab-contact: var(--hl-1);
          --logo-bg: #e07a3c;
          --tab-ink: #fdfdf9;
        }
        [data-theme="dark"] {
          --paper: #0e0d0a;
          --paper-2: #16140f;
          --ink: #faf7ec;
          --ink-soft: rgba(250, 247, 236, 0.88);
          --ink-mute: rgba(250, 247, 236, 0.68);
          --ink-faint: rgba(250, 247, 236, 0.42);
          --rule: rgba(250, 247, 236, 0.22);
          --accent: #ea5b6f;
          --hl-1: rgba(60, 110, 230, 0.55);
          --hl-2: rgba(220, 70, 80, 0.55);
          --hl-3: rgba(140, 90, 230, 0.55);
          --hl-4: rgba(230, 130, 50, 0.55);
          --logo-bg: #c8632b;
        }
        html,
        body {
          margin: 0;
          padding: 0;
          height: 100%;
          background: var(--paper);
          color: var(--ink);
          font-family: ui-monospace, monospace;
          overflow: hidden;
          overscroll-behavior: none;
        }
        * {
          box-sizing: border-box;
        }

        @media (max-width: 600px) {
          :root {
            --gutter-w: calc(2 * var(--u));
            --content-pad-left: calc(2 * var(--u));
            --hero-panel-w: calc(100vw - 32px);
            --timeline-card-w: calc(100vw - 32px);
            --timeline-gap: var(--u);
            --timeline-left-pad: var(--u);
            --timeline-right-pad: calc(2 * var(--u));
            --rail-lane-h: calc(4 * var(--u));
          }
        }
      `}</style>

      <style jsx global>{`
        .aboutShell {
          position: fixed;
          top: 48px;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: row;
          align-items: stretch;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          overscroll-behavior: none;
          outline: none;
          scroll-snap-type: x proximity;
          -webkit-overflow-scrolling: touch;
        }
        .aboutShell:focus-visible {
          outline: 2px solid var(--ink);
          outline-offset: -4px;
        }
        .aboutShell::-webkit-scrollbar {
          display: none;
        }

        .aboutTimeline {
          flex: 0 0 auto;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: calc(1 * var(--u)) 0 0;
        }
        .aboutLane {
          flex: 1 1 auto;
          min-height: 0;
          display: flex;
          align-items: center;
          gap: var(--timeline-gap);
        }
        .aboutLanePad {
          flex: 0 0 var(--timeline-left-pad);
          margin-right: calc(-1 * var(--timeline-gap));
        }
        .aboutLanePadEnd {
          flex: 0 0 var(--timeline-right-pad);
          margin-left: calc(-1 * var(--timeline-gap));
        }
        .aboutSlot {
          flex: 0 0 var(--timeline-card-w);
          display: flex;
          align-items: center;
          gap: calc(0.5 * var(--u));
          height: 100%;
          scroll-snap-align: center;
        }

        @media (prefers-reduced-motion: reduce) {
          .aboutShell {
            scroll-behavior: auto;
          }
        }
      `}</style>
    </>
  );
};

export default About;
