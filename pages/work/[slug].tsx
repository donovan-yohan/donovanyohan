import type { GetStaticPaths, GetStaticProps } from "next";

/**
 * dy-journal articles moved to /blog/[slug]. The source-owned WORK page now
 * lists curated GitHub repos, so /work/[slug] intentionally has no generated
 * article paths. fallback:false keeps unknown/private slugs from SSRing.
 */
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: false,
});

export const getStaticProps: GetStaticProps = async () => ({ notFound: true });

export default function LegacyWorkArticleRemoved() {
  return null;
}
