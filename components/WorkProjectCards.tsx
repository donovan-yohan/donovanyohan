import type { WorkProject } from "../lib/work-projects";
import { gm500, gm800, cp400 } from "../global/fonts";

interface WorkProjectCardsProps {
  projects: WorkProject[];
}

const GithubIcon = () => (
  <svg
    className="githubIcon"
    aria-hidden="true"
    viewBox="0 0 16 16"
    width="16"
    height="16"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M8 0C3.58 0 0 3.67 0 8.2c0 3.63 2.29 6.7 5.47 7.79.4.08.55-.18.55-.4 0-.2-.01-.86-.01-1.56-2.01.38-2.53-.5-2.69-.95-.09-.23-.48-.95-.82-1.14-.28-.15-.68-.52-.01-.53.63-.01 1.08.59 1.23.83.72 1.24 1.87.89 2.33.68.07-.53.28-.89.51-1.1-1.78-.21-3.64-.91-3.64-4.05 0-.89.31-1.63.82-2.2-.08-.21-.36-1.04.08-2.17 0 0 .67-.22 2.2.84A7.42 7.42 0 0 1 8 3.97c.68 0 1.36.09 2 .27 1.52-1.06 2.19-.84 2.19-.84.44 1.13.16 1.96.08 2.17.51.57.82 1.3.82 2.2 0 3.15-1.87 3.84-3.65 4.05.29.26.54.75.54 1.52 0 1.1-.01 1.98-.01 2.25 0 .22.15.48.55.4A8.14 8.14 0 0 0 16 8.2C16 3.67 12.42 0 8 0Z"
    />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg
    className="externalLinkIcon"
    aria-hidden="true"
    viewBox="0 0 16 16"
    width="15"
    height="15"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M10.75 1.5a.75.75 0 0 0 0 1.5h1.19L6.47 8.47a.75.75 0 1 0 1.06 1.06L13 4.06v1.19a.75.75 0 0 0 1.5 0v-3A.75.75 0 0 0 13.75 1.5h-3Z"
    />
    <path
      fill="currentColor"
      d="M3.25 3.5A1.75 1.75 0 0 0 1.5 5.25v7.5c0 .97.78 1.75 1.75 1.75h7.5c.97 0 1.75-.78 1.75-1.75V9.5a.75.75 0 0 0-1.5 0v3.25a.25.25 0 0 1-.25.25h-7.5a.25.25 0 0 1-.25-.25v-7.5A.25.25 0 0 1 3.25 5H6.5a.75.75 0 0 0 0-1.5H3.25Z"
    />
  </svg>
);

const formatCommitDate = (iso?: string | null): string | null => {
  if (!iso || iso.startsWith("1970-01-01T00:00:00.")) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `UPDATED ${date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    })
    .toUpperCase()}`;
};

const WorkProjectCards = ({ projects }: WorkProjectCardsProps) => (
  <div className="workProjectGrid" aria-label="Selected deployed and public projects">
    {projects.map((project, index) => {
      const updatedLabel = formatCommitDate(project.latestCommitAt ?? project.sortDate);

      return (
        <article
          className="workProjectCard"
          key={project.repo}
          style={{
            ["--project-accent" as string]: project.accent,
            ["--project-image-bg" as string]: project.imageBg ?? "transparent",
          }}
        >
          <div className={`workProjectMeta ${gm500.className}`}>
            <span>#{String(index + 1).padStart(2, "0")}</span>
            <span>{project.language ?? "repo"}</span>
          </div>
          <div className="workProjectCover" aria-hidden>
            {project.imageLight && project.imageDark ? (
              <>
                <img className="workProjectImage workProjectImageLight" src={project.imageLight} alt="" />
                <img className="workProjectImage workProjectImageDark" src={project.imageDark} alt="" />
              </>
            ) : project.image ? (
              <img className="workProjectImage" src={project.image} alt="" />
            ) : (
              <div className="workProjectMonogram">
                {project.title
                  .split(/\s+/)
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 3)}
              </div>
            )}
          </div>
          <div className="workProjectBody">
            <h3 className={`workProjectTitle ${gm800.className}`}>{project.title}</h3>
            <p className={`workProjectBlurb ${cp400.className}`}>{project.blurb}</p>
          </div>
          <div className={`workProjectTags ${gm500.className}`}>
            {project.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
          <footer className={`workProjectFooter ${gm500.className}`}>
            <span>{updatedLabel ?? (project.viewUrl ? "LIVE PROJECT" : "")}</span>
            <span className="workProjectLinks">
              {project.githubUrl ? (
                <a
                  className="workProjectLink"
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${project.title} GitHub repository`}
                  title={`${project.title} GitHub repository`}
                >
                  <GithubIcon />
                  <span>Repo</span>
                </a>
              ) : null}
              {project.viewUrl ? (
                <a
                  className="workProjectLink"
                  href={project.viewUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLinkIcon />
                  <span>View</span>
                </a>
              ) : null}
            </span>
          </footer>
        </article>
      );
    })}

    <style jsx>{`
      .workProjectGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--u);
      }
      .workProjectCard {
        --project-accent: var(--accent);
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 420px;
        border: 1px solid var(--rule);
        border-radius: 2px;
        background: var(--paper-2);
        color: var(--ink);
        overflow: hidden;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04);
      }
      .workProjectCard::before {
        content: "";
        position: absolute;
        inset: 0 0 auto;
        height: 5px;
        background: var(--project-accent);
      }
      .workProjectMeta,
      .workProjectFooter {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        font-size: 11px;
        letter-spacing: 0.14em;
        line-height: 1;
        text-transform: uppercase;
      }
      .workProjectMeta {
        padding: 18px var(--u) 10px;
        color: var(--ink-mute);
      }
      .workProjectCover {
        display: grid;
        place-items: center;
        min-height: 150px;
        margin: 0 var(--u);
        border: 1px solid var(--rule);
        background:
          linear-gradient(
            135deg,
            color-mix(in srgb, var(--project-accent) 24%, transparent),
            transparent 55%
          ),
          var(--paper);
      }
      .workProjectImage {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: var(--project-image-bg, transparent);
      }
      .workProjectImageDark {
        display: none;
      }
      :global(html[data-theme="dark"]) .workProjectImageLight {
        display: none;
      }
      :global(html[data-theme="dark"]) .workProjectImageDark {
        display: block;
      }
      .workProjectMonogram {
        font-size: clamp(48px, 7vw, 92px);
        font-weight: 800;
        letter-spacing: -0.08em;
        color: var(--ink);
        opacity: 0.88;
      }
      .workProjectBody {
        flex: 1 1 auto;
        padding: var(--u);
      }
      .workProjectTitle {
        margin: 0 0 10px;
        font-size: clamp(24px, 2.2vw, 34px);
        line-height: 1.02;
        letter-spacing: -0.03em;
      }
      .workProjectBlurb {
        margin: 0;
        font-size: clamp(17px, 1.35vw, 20px);
        line-height: 1.35;
        color: var(--ink-soft);
      }
      .workProjectTags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 0 var(--u) var(--u);
      }
      .workProjectTags span {
        border: 1px solid var(--ink-faint);
        border-radius: 2px;
        color: var(--ink-mute);
        font-size: 10px;
        letter-spacing: 0.12em;
        line-height: 1;
        padding: 6px 8px;
        text-transform: uppercase;
      }
      .workProjectFooter {
        border-top: 1px solid var(--rule);
        color: var(--ink-mute);
        padding: 12px var(--u);
      }
      .workProjectFooter > span:first-child {
        flex: 1 1 auto;
        min-width: 0;
      }
      .workProjectFooter a {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: var(--ink);
        text-decoration: underline;
        text-decoration-thickness: 1px;
        text-underline-offset: 4px;
      }
      .workProjectLinks {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
        margin-left: auto;
        gap: 10px;
        min-width: max-content;
      }
      .workProjectLink {
        white-space: nowrap;
      }
      .githubIcon {
        display: block;
        width: 16px;
        height: 16px;
      }
      .externalLinkIcon {
        display: block;
        width: 15px;
        height: 15px;
      }
      .workProjectFooter a:hover {
        text-decoration-thickness: 2px;
      }
      @media (max-width: 1180px) {
        .workProjectGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 720px) {
        .workProjectGrid {
          grid-template-columns: 1fr;
        }
        .workProjectCard {
          min-height: 0;
        }
      }
    `}</style>
  </div>
);

export default WorkProjectCards;
