"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GameProvider } from "../components/game/GameContext";
import HUD from "../components/game/HUD";
import ClickToPlayOverlay from "../components/game/ClickToPlayOverlay";
import PauseMenu from "../components/game/PauseMenu";
import Crosshair from "../components/game/Crosshair";
import ReloadWarning from "../components/game/ReloadWarning";
import OutOfAmmoOverlay from "../components/game/OutOfAmmoOverlay";
import TargetDestroyedOverlay from "../components/game/TargetDestroyedOverlay";
import WeaponViewModel from "../components/game/WeaponViewModel";
import DefendShop from "../components/game/DefendShop";

const GameCanvas = dynamic(() => import("../components/game/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-bg">
      <p className="font-heading text-2xl tracking-widest text-accent">
        LOADING ARENA...
      </p>
    </div>
  ),
});

function EscPauseHandler() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape" && document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  return null;
}

function GameContent() {
  const searchParams = useSearchParams();
  const teamParam = searchParams.get("team");
  const activeTeam: "attack" | "defend" =
    teamParam === "defend" ? "defend" : "attack";

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg">
      <GameCanvas />
      <HUD />
      <WeaponViewModel />
      <Crosshair />
      <OutOfAmmoOverlay />
      <ReloadWarning />
      <TargetDestroyedOverlay />
      <ClickToPlayOverlay />
      <PauseMenu />
      <DefendShop activeTeam={activeTeam} />
      <EscPauseHandler />
    </div>
  );
}

export default function GamePage() {
  return (
    <GameProvider>
      <Suspense fallback={<LoadingFallback />}>
        <GameContent />
      </Suspense>
    </GameProvider>
  );
}

function LoadingFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg">
      <p className="font-heading text-2xl tracking-widest text-accent">
        LOADING ARENA...
      </p>
    </div>
  );
}
