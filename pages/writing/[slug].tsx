/**
 * pages/writing/[slug].tsx — public note detail page (Slice 0, P14 + P27).
 *
 * getStaticPaths returns fallback: false (P27) — prevents on-demand generation
 * of unknown slugs at request time, which is a privacy-edge attack vector.
 * Only build-time-enumerated public slugs are reachable.
 *
 * Imports ONLY from lib/vault/index (never adapter-local or adapter-github
 * directly — ESLint import/no-restricted-paths enforces this per AGENTS.md).
 */

import Head from "next/head";
import type { GetStaticPaths, GetStaticProps } from "next";
import type { VaultNote } from "../../lib/vault/schema";
import { getPublicNotes, getNoteBySlug } from "../../lib/vault";

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

export default function WritingSlug({ note }: Props) {
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

        <h1>{note.frontmatter.title}</h1>
        <time dateTime={note.frontmatter.date}>{note.frontmatter.date}</time>

        {/*
         * dangerouslySetInnerHTML is required here because `note.body` is
         * pre-sanitized HTML produced by lib/vault/render.ts (which applies
         * rehype-sanitize to strip <script>, <iframe>, onclick=, etc.).
         * The sanitization happens upstream in the adapter pipeline (P22);
         * rendering it as a string here is safe.
         */}
        <article
          style={{ marginTop: 32 }}
          dangerouslySetInnerHTML={{ __html: note.body }}
        />
      </main>
    </>
  );
}
