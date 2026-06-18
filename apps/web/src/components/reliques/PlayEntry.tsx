"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { isValidGuestName } from "@/lib/guest";
import { buttonPrimary, inputField } from "@/lib/ui";
import { Reveal } from "@/components/Reveal";
import { ReliquesOnline } from "./ReliquesOnline";

// Porte d'entrée du jeu : connecté -> jeu ; sinon choix d'un pseudo invité.
// (L'identité invité stable, qui permet la reconnexion, est gérée dans le hook.)
export function PlayEntry({ authed }: { authed: boolean }) {
  const t = useTranslations("game");
  const [name, setName] = useState("");
  const [guestName, setGuestName] = useState<string | null>(null);

  if (authed) return <ReliquesOnline />;
  if (guestName) return <ReliquesOnline guestName={guestName} />;

  const trimmed = name.trim();
  const valid = isValidGuestName(trimmed);
  const play = () => {
    if (valid) setGuestName(trimmed);
  };

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-24 h-96 w-96 rounded-full bg-clay/15 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-amber/15 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-6 py-24 text-center">
        <Reveal>
          <span className="inline-flex items-center rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {t("title")}
          </span>
        </Reveal>
        <Reveal delay={90}>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.04] tracking-tight text-ink sm:text-5xl">
            {t("guestTitle")}
          </h1>
        </Reveal>
        <Reveal delay={150}>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">{t("guestLead")}</p>
        </Reveal>

        <Reveal delay={210} className="w-full">
          <div className="mt-9 w-full text-left">
            <label htmlFor="guest-name" className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
              {t("guestNameLabel")}
            </label>
            <input
              id="guest-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") play();
              }}
              maxLength={20}
              autoFocus
              placeholder={t("guestNamePlaceholder")}
              className={`${inputField} mt-2`}
            />
            <p className="mt-2 text-xs text-ink-soft/80">{t("guestScoreNote")}</p>
            <button
              type="button"
              onClick={play}
              disabled={!valid}
              className={`${buttonPrimary} mt-5 w-full py-3.5 text-base disabled:opacity-40`}
            >
              {t("guestPlay")}
            </button>
          </div>
        </Reveal>

        <Reveal delay={280}>
          <Link href="/login" className="mt-7 text-sm font-medium text-clay transition hover:text-clay/80">
            {t("guestLoginPrompt")}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
