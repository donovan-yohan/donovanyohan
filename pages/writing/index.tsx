/**
 * pages/writing/index.tsx — public notes index (Slice 0, P14).
 *
 * Minimum-viable implementation: a plain list of public notes sorted by date
 * descending, with title and ISO date. No notebook grid, no preview cards.
 * The bullet-journal/notebook visual treatment is a separate WIP (see DESIGN.md).
 *
 * Imports ONLY from lib/vault/index (never adapter-local or adapter-github
 * directly — ESLint import/no-restricted-paths enforces this per AGENTS.md).
 *
 * P29: Adds <meta name="vault-sha"> using BUILD_VAULT_SHA env var (set at
 * build time; defaults to "dev" when not set — production should export it
 * from next.config.js env block or via Vercel env vars).
 */

import Head from "next/head";
import type { GetStaticProps } from "next";
import type { VaultNote } from "../../lib/vault/schema";
import { getPublicNotes } from "../../lib/vault";

interface Props {
  notes: VaultNote[];
  vaultSha: string;
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const notes = await getPublicNotes();
  // Notes are already sorted by date desc in getPublicNotes()
  const vaultSha = process.env.BUILD_VAULT_SHA ?? "dev";
  return { props: { notes, vaultSha } };
};

export default function WritingIndex({ notes, vaultSha }: Props) {
  return (
    <>
      <Head>
        <title>Writing — Donovan Yohan</title>
        <meta name="description" content="Notes and writing by Donovan Yohan." />
        {/* P29: records the dy-journal HEAD SHA at build time for build artifact versioning */}
        <meta name="vault-sha" content={vaultSha} />
      </Head>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 48px" }}>
        <h1>Writing</h1>

        {notes.length === 0 ? (
          <p>No notes published yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {notes.map((note) => (
              <li key={note.slug} style={{ marginBottom: 32 }}>
                <a href={`/writing/${note.slug}`}>
                  <h2 style={{ margin: "0 0 4px" }}>{note.frontmatter.title}</h2>
                </a>
                <time dateTime={note.frontmatter.date}>{note.frontmatter.date}</time>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
