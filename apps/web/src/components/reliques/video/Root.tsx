import { Composition } from "remotion";
import { Explainer, EXPLAINER } from "./Explainer";

// Point d'entrée du rendu Remotion (CLI). La page web lit la même composition via
// <Player> (cf. TutorialPlayer) ; ici on l'enregistre pour l'export vidéo/image.
export function RemotionRoot() {
  return (
    <Composition
      id="Explainer"
      component={Explainer}
      durationInFrames={EXPLAINER.durationInFrames}
      fps={EXPLAINER.fps}
      width={EXPLAINER.width}
      height={EXPLAINER.height}
    />
  );
}
