import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";

type Props = {
  children: ReactNode;
  title: string;
  appName: string;
  tagline: string;
  aside: "left" | "right";
};

export function AuthShell({ children, title, appName, tagline, aside }: Props) {
  const asideFirst = aside === "left";

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-32 h-[28rem] w-[28rem] rounded-full bg-clay/15 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-amber/15 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-20 lg:py-24">
        <Reveal
          dir={asideFirst ? "right" : "left"}
          className={asideFirst ? "lg:order-1" : "lg:order-2"}
        >
          <div className="grain relative overflow-hidden rounded-[2.5rem] bg-ink px-9 py-14 text-cream shadow-[0_40px_80px_-40px_rgba(33,26,19,0.6)] sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-clay/40 blur-3xl animate-float"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-amber/25 blur-3xl animate-float"
              style={{ animationDelay: "2.4s" }}
            />
            <span className="relative inline-flex items-center rounded-full border border-cream/15 bg-cream/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cream/70">
              {appName}
            </span>
            <p className="relative mt-10 max-w-sm font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              {tagline}
            </p>
            <div className="relative mt-12 flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-clay" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber" />
              <span className="h-2.5 w-2.5 rounded-full bg-pine" />
            </div>
          </div>
        </Reveal>

        <Reveal
          dir="up"
          delay={120}
          className={asideFirst ? "lg:order-2" : "lg:order-1"}
        >
          <div className="mx-auto w-full max-w-md">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {title}
            </h1>
            <div className="mt-8 rounded-[2rem] border border-line bg-white/70 p-8 shadow-[0_30px_60px_-45px_rgba(33,26,19,0.4)] sm:p-9">
              {children}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
