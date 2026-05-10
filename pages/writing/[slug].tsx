/**
 * pages/writing/[slug].tsx — public note detail page (Slice 0, P14 + P27).
 *
 * getStaticPaths returns fallback: false (P27) — prevents on-demand generation
 * of unknown slugs at request time, which is a privacy-edge attack vector.
 * Only build-time-enumerated public slugs are reachable.
 *
 * Imports ONLY from lib/vault/index (never adapter-local or adapter-github
 * directly — ESLint import/no-restricted-paths enforces this per AGENTS.md).
 *
 * Rendering:
 *   - NoteRenderer replaces the previous dangerouslySetInnerHTML block.
 *   - When note.frontmatter.type === "work" (Phase A field, optional),
 *     WorkHero is rendered above the note body with banner, subtitle, and
 *     info[] from frontmatter. Gracefully absent when type is not "work".
 */

import Head from "next/head";
import type { GetStaticPaths, GetStaticProps } from "next";
import type { VaultNote } from "../../lib/vault/schema";
import { getPublicNotes, getNoteBySlug } from "../../lib/vault";
import { NoteRenderer } from "../../components/note/NoteRenderer";
import { WorkHero } from "../../components/note/WorkHero";
import type { WorkHeroProps } from "../../components/note/WorkHero";

interface Props {
  note: VaultNote;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const notes = await getPublicNotes();
  return {
    paths: notes.map((n) => ({ params: { slug: n.slug } })),
    // P27: fallback: false prevents on-demand SSR for unknown slugs —
    // a privacy-edge attack vector (request a private slug → SSR runs → cached).
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  const note = await getNoteBySlug(slug);

  if (!note) {
    return { notFound: true };
  }

  return { props: { note } };
};

/**
 * Extracts WorkHero props from the note's frontmatter.
 * Phase A schema fields are accessed via optional chaining — gracefully
 * absent when the schema hasn't been extended yet.
 */
function extractWorkHeroProps(note: VaultNote): WorkHeroProps {
  const fm = note.frontmatter as VaultNote["frontmatter"] & {
    subtitle?: string;
    banner?: { light?: string; dark?: string };
    bgColor?: { light?: string; dark?: string };
    info?: Array<{ label: string; href?: string }>;
  };

  return {
    title: fm.title,
    subtitle: fm.subtitle,
    banner: fm.banner,
    bgColor: fm.bgColor,
    info: fm.info,
  };
}

export default function WritingSlug({ note }: Props) {
  // Phase A: type field — optional, defaults to plain note rendering.
  const noteType = (note.frontmatter.type as string | undefined) ?? null;
  const isWorkType = noteType === "work";

  return (
    <>
      <Head>
        <title>{note.frontmatter.title} — Donovan Yohan</title>
        <meta name="description" content={note.preview.excerpt ?? note.frontmatter.title} />
      </Head>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 48px" }}>
        <a href="/writing" style={{ display: "block", marginBottom: 32 }}>
          ← Writing
        </a>

        {isWorkType ? (
          // Work-type notes: render WorkHero above the body.
          // WorkHero includes the title, so we don't render it again below.
          <WorkHero {...extractWorkHeroProps(note)} />
        ) : (
          // Plain notes: simple header
          <>
            <h1>{note.frontmatter.title}</h1>
            <time dateTime={note.frontmatter.date}>{note.frontmatter.date}</time>
          </>
        )}

        {/* NoteRenderer replaces dangerouslySetInnerHTML — the body is already
            sanitized by rehype-sanitize in the vault adapter pipeline. */}
        <NoteRenderer note={note} />
      </main>
    </>
  );
}
