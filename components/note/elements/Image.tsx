/**
 * Image.tsx — renders <img> elements for vault note content.
 *
 * Strategy:
 *   - /vault-assets/* paths → next/image with placeholder dimensions.
 *     Phase D (asset pipeline) will supply real dimensions; until then we
 *     use a fixed aspect ratio wrapper. TODO(Phase D): pass real width/height
 *     from the asset manifest once the asset pipeline ships.
 *   - All other paths → plain <img> with loading="lazy" and max-width: 100%.
 *
 * No eslint-disable; next/image requires known dimensions so we wrap it in
 * a position:relative container with a fixed intrinsic size for vault assets.
 */

import React from "react";
import NextImage from "next/image";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
}

/** Returns true when the src is a vault-managed asset (future pipeline). */
function isVaultAsset(src: string): boolean {
  return src.startsWith("/vault-assets/");
}

export function Image({ src, alt = "", className, width, height, ...rest }: ImageProps) {
  if (!src) {
    return null;
  }

  const cls = `note-img ${className ?? ""}`.trim();

  if (isVaultAsset(src)) {
    // TODO(Phase D): replace placeholder dims with values from the asset manifest.
    // The asset pipeline will provide real width/height at build time.
    const w = width ? Number(width) : 1200;
    const h = height ? Number(height) : 675;

    return (
      <span className="note-img-wrapper">
        <NextImage
          src={src}
          alt={alt}
          width={w}
          height={h}
          className={cls}
          {...rest}
        />
        <style jsx>{`
          .note-img-wrapper {
            display: block;
            max-width: 100%;
          }
          :global(.note-img) {
            max-width: 100%;
            height: auto;
          }
        `}</style>
      </span>
    );
  }

  // Fallback: plain <img> with lazy loading.
  // next/image is not used here because we don't know the dimensions of
  // arbitrary external images. The @next/next/no-img-element rule is
  // suppressed globally for this repo in eslint.config.mjs.
  return (
    <img
      src={src}
      alt={alt}
      className={cls}
      loading="lazy"
      style={{ maxWidth: "100%", height: "auto" }}
      {...(width ? { width } : {})}
      {...(height ? { height } : {})}
    />
  );
}
