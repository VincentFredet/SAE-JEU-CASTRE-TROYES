"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  alt: string;
  seed: string;
};

const palette = [
  "from-clay/30 via-amber/20 to-parchment",
  "from-amber/30 via-clay/15 to-cream",
  "from-pine/25 via-amber/15 to-parchment",
  "from-clay-deep/25 via-clay/15 to-sand",
  "from-sand via-amber/20 to-parchment",
];

function pick(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

// Seeded products point to SVGs that may not exist yet. We always paint a
// deterministic warm placeholder with the product initials, and reveal the
// real image only once it has loaded so a missing file never breaks the layout.
export function ProductImage({ src, alt, seed }: Props) {
  const [loaded, setLoaded] = useState(false);

  const initials = alt
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return (
    <div
      className={`relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br ${pick(seed)}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cream/40 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-clay/20 blur-2xl"
      />
      <span className="font-display text-4xl font-semibold tracking-tight text-ink/30">
        {initials || "?"}
      </span>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </div>
  );
}
