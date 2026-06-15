"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  alt: string;
  seed: string;
};

const palette = [
  "from-rose-200 to-orange-200 dark:from-rose-900 dark:to-orange-950",
  "from-sky-200 to-indigo-200 dark:from-sky-900 dark:to-indigo-950",
  "from-emerald-200 to-teal-200 dark:from-emerald-900 dark:to-teal-950",
  "from-violet-200 to-fuchsia-200 dark:from-violet-900 dark:to-fuchsia-950",
  "from-amber-200 to-lime-200 dark:from-amber-900 dark:to-lime-950",
];

function pick(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

// Seeded products point to SVGs that may not exist yet. We always paint a
// deterministic colored placeholder with the product initials, and reveal the
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
      className={`relative grid aspect-[4/3] place-items-center overflow-hidden bg-gradient-to-br ${pick(seed)}`}
    >
      <span className="text-3xl font-black tracking-tight text-zinc-700/70 dark:text-zinc-100/70">
        {initials || "?"}
      </span>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </div>
  );
}
