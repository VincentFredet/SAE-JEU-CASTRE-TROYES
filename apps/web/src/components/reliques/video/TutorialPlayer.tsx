"use client";

import { Player } from "@remotion/player";
import { Explainer, EXPLAINER } from "./Explainer";

export function TutorialPlayer() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line shadow-[0_30px_60px_-35px_rgba(33,26,19,0.5)]">
      <Player
        component={Explainer}
        durationInFrames={EXPLAINER.durationInFrames}
        fps={EXPLAINER.fps}
        compositionWidth={EXPLAINER.width}
        compositionHeight={EXPLAINER.height}
        style={{ width: "100%" }}
        controls
        autoPlay
        loop
      />
    </div>
  );
}
