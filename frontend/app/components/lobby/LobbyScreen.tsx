"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import ModeSelector from "./ModeSelector";
import RoomCard from "./RoomCard";
import PlayerList from "./PlayerList";

type Team = "attack" | "defend";

function generateRoomCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${l1}${l2}-${num}`;
}

export default function LobbyScreen() {
  const router = useRouter();
  const [callsign, setCallsign] = useState("");
  const [team, setTeam] = useState<Team>("attack");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [playTooltip, setPlayTooltip] = useState(false);

  const canPlay = callsign.trim().length > 0;

  const handleCreateRoom = () => {
    setRoomCode(generateRoomCode());
    setShowCreateModal(true);
    setCopied(false);
  };

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [roomCode]);

  const handlePlay = () => {
    if (!canPlay) {
      setPlayTooltip(true);
      setTimeout(() => setPlayTooltip(false), 2000);
      return;
    }
    router.push(`/game?team=${team}`);
  };

  return (
    <div className="relative min-h-screen">
      <div className="paint-bg">
        <div className="paint-blob paint-blob-1" />
        <div className="paint-blob paint-blob-2" />
        <div className="paint-blob paint-blob-3" />
        <div className="paint-blob paint-blob-4" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-8 py-10">
        <header className="mb-10 text-center">
          <h1 className="logo-drip font-heading text-7xl tracking-wider text-accent">
            PAINTSTRIKE
          </h1>
          <p className="mt-4 font-mono text-xs tracking-[0.3em] text-muted">
            TEAM PAINTBALL. ONE SHOT. ONE BOX.
          </p>
        </header>

        <div className="grid flex-1 grid-cols-3 gap-8">
          <section className="rounded border border-border bg-surface p-6">
            <h2 className="mb-6 font-heading text-2xl tracking-widest text-text">
              PLAYER SETUP
            </h2>

            <label className="mb-6 block">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-muted">
                Enter Callsign
              </span>
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                placeholder="ENTER CALLSIGN"
                maxLength={16}
                className="w-full border border-border bg-bg px-4 py-3 font-mono text-sm uppercase text-text placeholder:text-muted focus:border-accent focus:outline-none"
              />
            </label>

            <div className="flex flex-col gap-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Select Team
              </span>
              <button
                type="button"
                onClick={() => setTeam("attack")}
                className={[
                  "btn-press rounded border-2 px-4 py-4 font-heading text-lg tracking-widest transition-all",
                  team === "attack"
                    ? "border-accent2 bg-surface text-accent2 glow-attack"
                    : "border-border bg-bg text-muted hover:border-accent2/50",
                ].join(" ")}
              >
                🔴 ATTACK
              </button>
              <button
                type="button"
                onClick={() => setTeam("defend")}
                className={[
                  "btn-press rounded border-2 px-4 py-4 font-heading text-lg tracking-widest transition-all",
                  team === "defend"
                    ? "border-accent3 bg-surface text-accent3 glow-defend"
                    : "border-border bg-bg text-muted hover:border-accent3/50",
                ].join(" ")}
              >
                🔵 DEFEND
              </button>
            </div>
          </section>

          <section className="rounded border border-border bg-surface p-6">
            <ModeSelector />
          </section>

          <section className="rounded border border-border bg-surface p-6">
            <h2 className="mb-6 font-heading text-2xl tracking-widest text-text">
              ROOM
            </h2>

            <div className="flex gap-4">
              <RoomCard variant="create" onClick={handleCreateRoom} />
              <RoomCard
                variant="join"
                onClick={() => {
                  setShowJoinInput(true);
                  setShowCreateModal(false);
                }}
              />
            </div>

            {showJoinInput && (
              <div className="mt-6 flex flex-col gap-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="XX-0000"
                  maxLength={7}
                  className="w-full border border-border bg-bg px-4 py-3 text-center font-heading text-2xl tracking-widest text-text placeholder:text-muted focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  className="btn-press rounded border border-accent bg-transparent py-3 font-heading text-lg tracking-widest text-accent transition-all hover:bg-accent hover:text-bg"
                >
                  JOIN
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="relative mt-10 flex justify-center">
          <button
            type="button"
            onClick={handlePlay}
            disabled={!canPlay}
            className={[
              "btn-press rounded px-16 py-5 font-heading text-3xl tracking-[0.2em] transition-all",
              canPlay
                ? "bg-accent text-bg glow-play hover:brightness-110"
                : "cursor-not-allowed bg-border text-muted",
            ].join(" ")}
          >
            PLAY NOW
          </button>

          {playTooltip && !canPlay && (
            <div className="tooltip font-mono text-muted">
              Enter your callsign first
            </div>
          )}
        </div>
      </div>

      {showCreateModal &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="relative w-full max-w-md rounded border border-border bg-surface p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-press absolute right-4 top-4 font-mono text-muted hover:text-text"
                aria-label="Close"
              >
                ✕
              </button>

              <h2 className="font-heading text-3xl tracking-widest text-text">
                ROOM CREATED
              </h2>

              <p className="mt-2 font-mono text-xs text-muted">
                Share this code with your team
              </p>

              <p className="mt-6 text-center font-heading text-6xl tracking-widest text-accent">
                {roomCode}
              </p>

              <button
                type="button"
                onClick={handleCopyCode}
                className="btn-press mt-6 w-full rounded border border-border py-3 font-mono text-sm uppercase tracking-wider text-text transition-all hover:border-accent hover:text-accent"
              >
                {copied ? "COPIED!" : "COPY TO CLIPBOARD"}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="pulse-dot" />
                <span className="font-mono text-xs text-muted">
                  Waiting for players...
                </span>
              </div>

              <div className="mt-6">
                <PlayerList
                  players={
                    callsign.trim()
                      ? [{ callsign: callsign.trim(), team, isHost: true }]
                      : []
                  }
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
