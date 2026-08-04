import PortfolioCardGrid, { type PortfolioCardItem, type PortfolioCardLink } from "./PortfolioCardGrid";
import type { WorkProject } from "../lib/work-projects";

interface WorkProjectCardsProps {
  projects: WorkProject[];
}

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

const toPortfolioCard = (project: WorkProject, index: number): PortfolioCardItem => {
  const updatedLabel = formatCommitDate(project.latestCommitAt ?? project.sortDate);
  const links: PortfolioCardLink[] = [];

  if (project.githubUrl) {
    links.push({
      href: project.githubUrl,
      label: "Repo",
      kind: "github",
      ariaLabel: `${project.title} GitHub repository`,
    });
  }

  if (project.viewUrl) {
    links.push({
      href: project.viewUrl,
      label: "View",
      kind: "external",
      ariaLabel: `${project.title} live project`,
    });
  }

  return {
    id: project.repo,
    indexLabel: `#${String(index + 1).padStart(2, "0")}`,
    categoryLabel: "work",
    metaLabel: project.language ?? "repo",
    title: project.title,
    blurb: project.blurb,
    tags: project.tags,
    accent: project.accent,
    image: project.image,
    imageLight: project.imageLight,
    imageDark: project.imageDark,
    imageBg: project.imageBg,
    footerLabel: updatedLabel ?? (project.viewUrl ? "LIVE PROJECT" : "PUBLIC REPO"),
    primaryHref: project.viewUrl ?? project.githubUrl ?? null,
    links,
  };
};

const WorkProjectCards = ({ projects }: WorkProjectCardsProps) => (
  <PortfolioCardGrid
    ariaLabel="Selected deployed and public projects"
    items={projects.map(toPortfolioCard)}
  />
);

export default WorkProjectCards;
