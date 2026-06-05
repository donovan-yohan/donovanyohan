export interface CuratedGithubProject {
  repo: string;
  title: string;
  blurb: string;
  tags: string[];
  accent: string;
  language?: string | null;
  image?: string;
  imageBg?: string;
}

export interface WorkProject extends CuratedGithubProject {
  url: string;
  language?: string | null;
  latestCommitAt?: string | null;
  sortDate?: string | null;
}

const GITHUB_OWNER = "donovan-yohan";

/**
 * Source-owned shortlist for the WORK section. Edit this list when Donovan
 * decides which repos are portfolio-worthy; the build enriches/sorts it by the
 * latest public commit authored by the GitHub account when the API is reachable.
 */
export const CURATED_GITHUB_PROJECTS: CuratedGithubProject[] = [
  {
    repo: "relay-ide",
    title: "Relay IDE",
    blurb: "A remote web interface for steering real coding-agent sessions from anywhere without pretending the terminal stopped existing.",
    tags: ["agents", "developer tooling", "typescript"],
    accent: "#78dcff",
    language: "TypeScript",
  },
  {
    repo: "hermes-plugin-dynamic-workflows",
    title: "Dynamic Workflows",
    blurb: "A Hermes plugin prototype for letting agents turn plans into executable, inspectable workflows instead of vibes in a transcript.",
    tags: ["agents", "hermes", "python"],
    accent: "#ffe066",
    language: "Python",
  },
  {
    repo: "quartiles",
    title: "Quartiles",
    blurb: "A mobile-first word-building puzzle with a tiny surface area and a very annoying amount of product taste packed into it.",
    tags: ["game", "mobile", "typescript"],
    accent: "#b4ff82",
    language: "TypeScript",
  },
  {
    repo: "open-music-player",
    title: "Open Music Player",
    blurb: "A local-first music player experiment aimed at waveform-heavy, DJ-ish listening instead of yet another dead-flat playlist table.",
    tags: ["music", "mobile", "dart"],
    accent: "#ff82c8",
    language: "Dart",
  },
  {
    repo: "belayer",
    title: "Belayer",
    blurb: "A multi-repo autonomous coding-agent orchestrator built around supervision, recovery, and making agents leave useful evidence behind.",
    tags: ["agents", "orchestration", "go"],
    accent: "#ea5b6f",
    language: "Go",
  },
  {
    repo: "donovanyohan",
    title: "donovanyohan.com",
    blurb: "This site: a public portfolio wired into a private writing vault, with the privacy boundary treated like load-bearing infrastructure.",
    tags: ["portfolio", "next.js", "vault"],
    accent: "#e07a3c",
    language: "TypeScript",
  },
];

interface GithubRepoResponse {
  html_url?: string;
  pushed_at?: string;
  language?: string | null;
}

interface GithubCommitResponse {
  commit?: {
    author?: {
      date?: string;
    };
  };
}

const githubHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const fetchJson = async <T>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(url, { headers: githubHeaders() });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const latestAuthoredCommit = async (repo: string): Promise<string | undefined> => {
  const commits = await fetchJson<GithubCommitResponse[]>(
    `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/commits?author=${GITHUB_OWNER}&per_page=1`,
  );
  return commits?.[0]?.commit?.author?.date;
};

export const getWorkProjects = async (): Promise<WorkProject[]> => {
  const projects = await Promise.all(
    CURATED_GITHUB_PROJECTS.map(async (project, index) => {
      const [repoMeta, latestCommitAt] = await Promise.all([
        fetchJson<GithubRepoResponse>(`https://api.github.com/repos/${GITHUB_OWNER}/${project.repo}`),
        latestAuthoredCommit(project.repo),
      ]);
      const sortDate = latestCommitAt ?? repoMeta?.pushed_at;
      return {
        ...project,
        url: repoMeta?.html_url ?? `https://github.com/${GITHUB_OWNER}/${project.repo}`,
        language: repoMeta?.language ?? project.language ?? null,
        latestCommitAt: latestCommitAt ?? null,
        sortDate: sortDate ?? `1970-01-01T00:00:${String(99 - index).padStart(2, "0")}Z`,
      } satisfies WorkProject;
    }),
  );

  return projects.sort((a, b) => (b.sortDate ?? "").localeCompare(a.sortDate ?? ""));
};
