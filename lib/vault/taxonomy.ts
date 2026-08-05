/**
 * taxonomy.ts — dy-journal-owned tag taxonomy parsing.
 *
 * Taxonomy is optional publishing metadata. It is read from
 * notes/.meta/taxonomy.yml and only used to label/filter tags already present on
 * notes that passed the visibility gate. Private-note tags must never generate
 * public filter tabs by themselves.
 */

import { load as yamlLoad } from "js-yaml";
import { VaultTaxonomySchema } from "./schema";
import type { VaultTaxonomy } from "./schema";

export const TAXONOMY_PATHS = [
  "notes/.meta/taxonomy.yml",
  "notes/.meta/taxonomy.yaml",
] as const;

export const EMPTY_VAULT_TAXONOMY: VaultTaxonomy = { tags: {} };

export function isTaxonomyPath(relPath: string): boolean {
  return TAXONOMY_PATHS.includes(relPath as (typeof TAXONOMY_PATHS)[number]);
}

export function parseVaultTaxonomy(content: string, sourcePath: string): VaultTaxonomy {
  const raw = yamlLoad(content) ?? {};
  const parsed = VaultTaxonomySchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const detail = issue ? `${issue.path.join(".")}: ${issue.message}` : "invalid taxonomy";
    throw new Error(`Invalid vault taxonomy at ${sourcePath}: ${detail}`);
  }
  return parsed.data;
}
