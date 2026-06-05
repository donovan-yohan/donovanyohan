import type { WorkProject } from "../lib/work-projects";
import { gm500, gm800, cp400 } from "../global/fonts";

interface WorkProjectCardsProps {
  projects: WorkProject[];
}

const formatCommitDate = (iso?: string | null): string => {
  if (!iso || iso.startsWith("1970-01-01T00:00:00.")) return "RECENCY UNKNOWN";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "RECENCY UNKNOWN";
  return `UPDATED ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).toUpperCase()}`;
};

const WorkProjectCards = ({ projects }: WorkProjectCardsProps) => (
  <div className="workProjectGrid" aria-label="Selected public GitHub projects">
    {projects.map((project, index) => (
      <article
        className="workProjectCard"
        key={project.repo}
        style={{ ["--project-accent" as string]: project.accent }}
      >
        <div className={`workProjectMeta ${gm500.className}`}>
          <span>#{String(index + 1).padStart(2, "0")}</span>
          <span>{project.language ?? "repo"}</span>
        </div>
        <div className="workProjectCover" aria-hidden>
          {project.image ? (
            <img src={project.image} alt="" />
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
          <span>{formatCommitDate(project.latestCommitAt ?? project.sortDate)}</span>
          <a href={project.url} target="_blank" rel="noreferrer">
            GitHub →
          </a>
        </footer>
      </article>
    ))}

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
          linear-gradient(135deg, color-mix(in srgb, var(--project-accent) 24%, transparent), transparent 55%),
          var(--paper);
      }
      .workProjectCover img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: var(--project-image-bg, transparent);
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
      .workProjectFooter a {
        color: var(--ink);
        text-decoration: none;
      }
      .workProjectFooter a:hover {
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 4px;
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
