import Head from "next/head";
import dynamic from "next/dynamic";
import { useContext } from "react";
import type { GetStaticProps } from "next";

import Context from "../../components/context";
import SiteNav from "../../components/SiteNav";
import WorkProjectCards from "../../components/WorkProjectCards";
import { gm500, gm800, cp400 } from "../../global/fonts";
import { dotGridColor } from "../../lib/dot-grid-color";
import { themeBootstrap } from "../../lib/theme-bootstrap";
import type { WorkProject } from "../../lib/work-projects";
import { getWorkProjects, WORK_PROJECTS_REVALIDATE_SECONDS } from "../../lib/work-projects";

const DotGrid = dynamic(() => import("../../components/lab/DotGrid"), { ssr: false });

interface WorkIndexProps {
  projects: WorkProject[];
}

export const getStaticProps: GetStaticProps<WorkIndexProps> = async () => ({
  props: {
    projects: await getWorkProjects(),
  },
  revalidate: WORK_PROJECTS_REVALIDATE_SECONDS,
});

export default function WorkIndex({ projects }: WorkIndexProps) {
  const { theme } = useContext(Context);

  return (
    <>
      <Head>
        <title>Work — Donovan Yohan</title>
        <meta
          name="description"
          content="Selected deployed projects and public GitHub repos by Donovan Yohan, with live projects prioritized."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </Head>

      <SiteNav current="work" />
      <DotGrid color={dotGridColor(theme)} />

      <main className="workPage">
        <section className="workFrame">
          <header className="workHead">
            <span className={`workKicker ${gm500.className}`}>Selected deployed projects</span>
            <h1 className={`workTitle ${gm800.className}`}>WORK</h1>
            <p className={`workLede ${cp400.className}`}>
              Live projects come first with a View link; public repos get GitHub
              links too. The source list stays curated, while GitHub activity is
              fetched through a daily server cache instead of on every regeneration.
            </p>
          </header>

          <WorkProjectCards projects={projects} />
        </section>
      </main>

      <style jsx global>{`
        :root,
        [data-theme="light"] {
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
          --page-shell-max: 2560px;
          --page-shell-bleed-x: max(0px, calc((100vw - var(--page-shell-max)) / 2));
          --content-w: clamp(944px, round(down, 100vw - 128px, 192px), 1520px);
          --gutter-w: calc(12 * var(--u));
          --gutter-pad: var(--u);
          --content-pad-left: calc(var(--gutter-w) + var(--gutter-pad));
          --hl-1: rgba(120, 220, 255, 0.55);
          --hl-2: rgba(255, 130, 200, 0.55);
          --hl-3: rgba(180, 255, 130, 0.6);
          --hl-4: rgba(255, 224, 102, 0.55);
          --hl: var(--hl-4);
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
          --accent-soft: rgba(234, 91, 111, 0.16);
          --hl-1: rgba(60, 110, 230, 0.55);
          --hl-2: rgba(220, 70, 80, 0.55);
          --hl-3: rgba(140, 90, 230, 0.55);
          --hl-4: rgba(230, 130, 50, 0.55);
          --hl: var(--hl-4);
          --logo-bg: #c8632b;
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
      `}</style>

      <style jsx>{`
        .workPage {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: var(--page-shell-max);
          margin: 0 auto;
          padding-top: 48px;
        }
        .workFrame {
          min-height: 100vh;
          padding: 40px var(--content-pad-left) 96px;
        }
        .workHead {
          margin: -40px calc(-1 * (var(--content-pad-left) + var(--page-shell-bleed-x))) 24px;
          padding: 56px calc(var(--content-pad-left) + var(--page-shell-bleed-x)) 28px;
          border-top: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
        }
        .workKicker {
          display: block;
          margin-bottom: 6px;
          color: var(--ink-mute);
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .workTitle {
          width: fit-content;
          max-width: 100%;
          margin: 0 0 10px;
          color: var(--ink);
          font-size: clamp(44px, 7vw, 92px);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 0.95;
        }
        .workLede {
          max-width: 820px;
          margin: 0;
          color: var(--ink-soft);
          font-size: clamp(19px, 1.7vw, 25px);
          line-height: 1.42;
        }
        @media (max-width: 900px) {
          :global(:root),
          :global([data-theme="light"]),
          :global([data-theme="dark"]) {
            --gutter-w: 0px;
            --gutter-pad: 0px;
            --page-pad-x: clamp(16px, 4vw, 20px);
            --content-pad-left: var(--page-pad-x);
            --content-w: calc(100vw - (2 * var(--content-pad-left)));
            --page-shell-max: 100vw;
            --page-shell-bleed-x: 0px;
          }
          .workPage {
            padding: 0 var(--page-pad-x) 72px;
          }
          .workFrame {
            margin-left: calc(-1 * var(--page-pad-x));
            margin-right: calc(-1 * var(--page-pad-x));
            padding: 32px var(--page-pad-x) 72px;
          }
          .workHead {
            margin: -32px calc(-1 * var(--page-pad-x)) 20px;
            padding: 32px var(--page-pad-x) 22px;
          }
        }
      `}</style>
    </>
  );
}
