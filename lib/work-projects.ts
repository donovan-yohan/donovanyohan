import { unstable_cache } from "next/cache";

export interface CuratedGithubProject {
  repo: string;
  title: string;
  blurb: string;
  tags: string[];
  accent: string;
  language?: string | null;
  githubUrl?: string | null;
  viewUrl?: string;
  image?: string;
  imageBg?: string;
}

export interface WorkProject extends CuratedGithubProject {
  githubUrl?: string | null;
  language?: string | null;
  latestCommitAt?: string | null;
  sortDate?: string | null;
}

const GITHUB_OWNER = "donovan-yohan";
export const WORK_PROJECTS_REVALIDATE_SECONDS = 24 * 60 * 60;
const WORK_PROJECTS_CACHE_MS = WORK_PROJECTS_REVALIDATE_SECONDS * 1000;

let workProjectsCache: { expiresAt: number; projects: WorkProject[] } | null = null;
let workProjectsPromise: Promise<WorkProject[]> | null = null;

/**
 * Source-owned shortlist for the WORK section. Edit this list when Donovan
 * decides which repos are portfolio-worthy; the build enriches/sorts it by the
 * latest public commit authored by the GitHub account when the API is reachable.
 */
export const CURATED_GITHUB_PROJECTS: CuratedGithubProject[] = [
  {
    repo: "relay-ide",
    title: "Relay IDE",
    blurb:
      "A remote web interface for steering real coding-agent sessions from anywhere without pretending the terminal stopped existing.",
    tags: ["agents", "developer tooling", "typescript"],
    accent: "#78dcff",
    language: "TypeScript",
    image: "/img/work/relay-ide-preview.webp",
    imageBg: "#07111f",
  },
  {
    repo: "hermes-plugin-dynamic-workflows",
    title: "Dynamic Workflows",
    blurb:
      "A Hermes plugin prototype for letting agents turn plans into executable, inspectable workflows instead of vibes in a transcript.",
    tags: ["agents", "hermes", "python"],
    accent: "#ffe066",
    language: "Python",
    image: "/img/work/dynamic-workflows-preview.webp",
    imageBg: "#1e3a5f",
  },
  {
    repo: "hermes-plugin-remote-hosts",
    title: "Remote Hosts",
    blurb:
      "A Hermes plugin for explicit SSH-backed remote host tools, because invisible shell access is how you get haunted later.",
    tags: ["hermes", "ssh", "python"],
    accent: "#22c55e",
    language: "Python",
    image: "/img/work/remote-hosts-preview.webp",
    imageBg: "#111827",
  },
  {
    repo: "hermes-plugin-carabiner",
    title: "Carabiner Memory",
    blurb:
      "A Hermes plugin for Honcho-backed collaboration memory: handoffs, peer feedback, and agent relationship episodes that actually persist.",
    tags: ["hermes", "memory", "python"],
    accent: "#ea5b6f",
    language: "Python",
    image: "/img/work/carabiner-preview.webp",
    imageBg: "#211529",
  },
  {
    repo: "hermes-plugin-comfyui-image-backend",
    title: "ComfyUI Backend",
    blurb:
      "A ComfyUI image-generation backend for Hermes, bridging local node graphs into the image_generate tool path.",
    tags: ["hermes", "image gen", "python"],
    accent: "#ff4fd8",
    language: "Python",
    image: "/img/work/comfyui-image-backend-preview.webp",
    imageBg: "#151320",
  },
  {
    repo: "hermes-plugin-talent-roster",
    title: "Talent Roster",
    blurb:
      "A Hermes plugin for teammate roster routing and Kanban-backed profile assignment across specialist agents.",
    tags: ["hermes", "kanban", "python"],
    accent: "#2dd4bf",
    language: "Python",
    image: "/img/work/talent-roster-preview.webp",
    imageBg: "#0b1220",
  },
  {
    repo: "quartiles",
    title: "lexitiles",
    blurb:
      "A mobile-first word-building puzzle with a tiny surface area and a very annoying amount of product taste packed into it.",
    tags: ["word game", "mobile", "typescript"],
    accent: "#5865f2",
    language: "TypeScript",
    viewUrl: "https://lexitiles.donovanyohan.com",
    image: "/img/work/lexitiles-preview.webp",
    imageBg: "#11151d",
  },
  {
    repo: "typeline-svelte",
    title: "typeline",
    blurb:
      "A full typing game for tuning feel, rhythm, and input feedback without dragging a bloated product surface behind it.",
    tags: ["typing", "svelte", "typescript"],
    accent: "#00e5ef",
    language: "TypeScript",
    githubUrl: null,
    viewUrl: "https://typeline.app",
    image: "/img/work/typeline-preview.webp",
    imageBg: "#1967ff",
  },
  {
    repo: "sample-sound",
    title: "sample-sound",
    blurb:
      "A tiny browser soundboard for fast meme/audio triggers, keyboard shortcuts, and exactly the amount of chaos the room deserves.",
    tags: ["soundboard", "audio", "javascript"],
    accent: "#ff2d70",
    language: "JavaScript",
    githubUrl: null,
    viewUrl: "https://soundboard.donovanyohan.com",
    image: "/img/work/sample-sound-preview.webp",
    imageBg: "#08060d",
  },
  {
    repo: "open-music-player",
    title: "Open Music Player",
    blurb:
      "A local-first music player experiment aimed at waveform-heavy, DJ-ish listening instead of yet another dead-flat playlist table.",
    tags: ["music", "mobile", "dart"],
    accent: "#ff82c8",
    language: "Dart",
    image: "/img/work/open-music-player-preview.webp",
    imageBg: "#101014",
  },
  {
    repo: "belayer",
    title: "Belayer",
    blurb:
      "A multi-repo autonomous coding-agent orchestrator built around supervision, recovery, and making agents leave useful evidence behind.",
    tags: ["agents", "orchestration", "go"],
    accent: "#ea5b6f",
    language: "Go",
    image: "/img/work/belayer-preview.webp",
    imageBg: "#101820",
  },
  {
    repo: "donovanyohan",
    title: "donovanyohan.com",
    blurb:
      "This site: a public portfolio wired into a private writing vault, with the privacy boundary treated like load-bearing infrastructure.",
    tags: ["portfolio", "next.js", "vault"],
    accent: "#ffe600",
    language: "TypeScript",
    viewUrl: "https://donovanyohan.com",
    image: "/img/work/donovanyohan-preview.webp",
    imageBg: "#ffffff",
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
    `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/commits?author=${GITHUB_OWNER}&per_page=1`
  );
  return commits?.[0]?.commit?.author?.date;
};

const loadWorkProjects = async (): Promise<WorkProject[]> => {
  const projects = await Promise.all(
    CURATED_GITHUB_PROJECTS.map(async (project, index) => {
      const [repoMeta, latestCommitAt] = await Promise.all([
        fetchJson<GithubRepoResponse>(
          `https://api.github.com/repos/${GITHUB_OWNER}/${project.repo}`
        ),
        latestAuthoredCommit(project.repo),
      ]);
      const sortDate = latestCommitAt ?? repoMeta?.pushed_at;
      return {
        ...project,
        githubUrl:
          project.githubUrl === null
            ? null
            : (project.githubUrl ??
              repoMeta?.html_url ??
              `https://github.com/${GITHUB_OWNER}/${project.repo}`),
        language: repoMeta?.language ?? project.language ?? null,
        latestCommitAt: latestCommitAt ?? null,
        sortDate: sortDate ?? `1970-01-01T00:00:00.${String(999 - index).padStart(3, "0")}Z`,
      } satisfies WorkProject;
    })
  );

  return projects.sort((a, b) => {
    const viewDelta = Number(Boolean(b.viewUrl)) - Number(Boolean(a.viewUrl));
    if (viewDelta !== 0) return viewDelta;
    return (b.sortDate ?? "").localeCompare(a.sortDate ?? "");
  });
};

const loadCachedWorkProjects = unstable_cache(loadWorkProjects, ["work-projects-v5"], {
  revalidate: WORK_PROJECTS_REVALIDATE_SECONDS,
});

export const getWorkProjects = async (): Promise<WorkProject[]> => {
  const now = Date.now();
  if (workProjectsCache && workProjectsCache.expiresAt > now) return workProjectsCache.projects;
  if (workProjectsPromise) return workProjectsPromise;

  workProjectsPromise = loadCachedWorkProjects().then((projects) => {
    workProjectsCache = {
      expiresAt: Date.now() + WORK_PROJECTS_CACHE_MS,
      projects,
    };
    return projects;
  });

  try {
    return await workProjectsPromise;
  } finally {
    workProjectsPromise = null;
  }
};
