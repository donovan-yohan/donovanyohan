/**
 * pages/writing/index.tsx — public notes index (Slice 0, P14).
 *
 * Minimum-viable implementation: a plain list of public notes sorted by date
 * descending, with title and ISO date. No notebook grid, no preview cards.
 * The bullet-journal/notebook visual treatment is a separate WIP (see DESIGN.md).
 *
 * Imports ONLY from lib/vault (the barrel) — never adapter-local, adapter-github,
 * or schema directly. ESLint import/no-restricted-paths enforces this per
 * AGENTS.md "Vault adapter — load-bearing privacy code".
 *
 * P29: Adds <meta name="vault-sha"> using BUILD_VAULT_SHA env var (set at
 * build time; defaults to "dev" when not set — production should export it
 * from next.config.js env block or via Vercel env vars).
 */

import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps } from "next";
import Main from "../../layouts/main";
import { getPublicNotes, getVaultConfig, type VaultNote } from "../../lib/vault";

interface Props {
  notes: VaultNote[];
  vaultSha: string;
  vaultConfigured: boolean;
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const notes = await getPublicNotes();
  // Notes are already sorted by date desc in getPublicNotes()
  const vaultSha = process.env.BUILD_VAULT_SHA ?? "dev";
  // P20-relaxed signal: when no vault is configured in production, the
  // empty-state copy explains it (and the build log already warns loudly).
  // getVaultConfig() returns null in that case.
  const vaultConfigured = getVaultConfig() !== null;
  return { props: { notes, vaultSha, vaultConfigured } };
};

export default function WritingIndex({ notes, vaultSha, vaultConfigured }: Props) {
  return (
    <Main>
      <Head>
        <title>Writing — Donovan Yohan</title>
        <meta name="description" content="Notes and writing by Donovan Yohan." />
        {/* P29: records the dy-journal HEAD SHA at build time for build artifact versioning */}
        <meta name="vault-sha" content={vaultSha} />
        {!vaultConfigured && (
          <meta name="vault-status" content="unconfigured" />
        )}
      </Head>

      <div className="pageRoot">
        <div className="pageContent">
          <section style={{ maxWidth: 720, margin: "0 auto", padding: "32px 0 48px" }}>
            <h1>Writing</h1>

            {notes.length === 0 ? (
              // Three debug channels when vault is unconfigured:
              //  - build log: console.warn banner from getVaultConfig()
              //  - rendered HTML: <meta name="vault-status" content="unconfigured">
              //  - visible page text: the explanatory copy below
              <p>
                {vaultConfigured
                  ? "No notes published yet."
                  : "No notes published yet — vault not configured. See VAULT.md."}
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {notes.map((note) => (
                  <li key={note.slug} style={{ marginBottom: 32 }}>
                    <Link href={`/writing/${note.slug}`}>
                      <h2 style={{ margin: "0 0 4px" }}>{note.frontmatter.title}</h2>
                    </Link>
                    <time dateTime={note.frontmatter.date}>{note.frontmatter.date}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </Main>
  );
}
