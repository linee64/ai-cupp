"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ModeSelector from "./ModeSelector";
import RoomCard from "./RoomCard";
import PlayerList from "./PlayerList";
import { supabase } from "../../lib/supabase";
import { createRoom, joinRoom, startGame, leaveRoom, RoomPlayer } from "../../lib/rooms";

type Team = "attack" | "defend";

export default function LobbyScreen() {
  const router = useRouter();
  const [callsign, setCallsign] = useState("");
  const [team, setTeam] = useState<Team>("attack");
  
  const [lobbyState, setLobbyState] = useState<
    "idle" | "creating" | "waiting" | "joining"
  >("idle");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playTooltip, setPlayTooltip] = useState(false);

  const channelRef = useRef<any>(null);

  const canPlay = callsign.trim().length > 0;

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Robust fallback polling every 3 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (lobbyState === "waiting" && roomCode) {
      interval = setInterval(() => {
        fetchPlayers(roomCode);
        
        // Non-hosts poll to see if game status updated to starting
        if (!isHost) {
          supabase
            .from("rooms")
            .select("status")
            .eq("code", roomCode.toUpperCase())
            .maybeSingle()
            .then(({ data }) => {
              if (data && data.status === "starting") {
                router.push(
                  `/game?room=${roomCode.toUpperCase()}&player=${encodeURIComponent(
                    callsign
                  )}&team=${team}`
                );
              }
            });
        }
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lobbyState, roomCode, isHost, callsign, team, router]);


  const handleCopyCode = useCallback(async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [roomCode]);

  const handleLeaveRoomCleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setLobbyState("idle");
    setRoomCode("");
    setPlayers([]);
    setIsHost(false);
  }, []);

  async function fetchPlayers(code: string) {
    const cleanCode = code.toUpperCase();
    const { data, error: fetchErr } = await supabase
      .from("room_players")
      .select("*")
      .eq("room_code", cleanCode)
      .order("joined_at");
    
    if (fetchErr) {
      setError("Connection failed — check your internet");
      return;
    }
    setPlayers((data as RoomPlayer[]) || []);
  }

  function subscribeToRoom(code: string) {
    const cleanCode = code.toUpperCase();

    // Set up postgres changes realtime channel
    const channel = supabase
      .channel("room:" + cleanCode)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_players",
        },
        (payload: any) => {
          const record = payload.new || payload.old;
          if (record && record.room_code === cleanCode) {
            fetchPlayers(cleanCode);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
        },
        (payload: any) => {
          if (
            payload.new &&
            payload.new.code === cleanCode &&
            payload.new.status === "starting"
          ) {
            // Redirect player to game page
            router.push(
              `/game?room=${cleanCode}&player=${encodeURIComponent(
                callsign
              )}&team=${team}`
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "rooms",
        },
        (payload: any) => {
          if (payload.old && payload.old.code === cleanCode) {
            setError("Room was disbanded by the host.");
            handleLeaveRoomCleanup();
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setError("Realtime connection error. Check Supabase settings.");
        }
      });

    channelRef.current = channel;
    fetchPlayers(cleanCode);
  }

  async function handleCreateRoom() {
    if (!callsign.trim()) {
      setError("Please enter your callsign first.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const code = await createRoom(callsign.trim(), team);
      setRoomCode(code);
      setIsHost(true);
      setLobbyState("waiting");
      subscribeToRoom(code);
    } catch (e: any) {
      setError(e.message || "Failed to create room. Try again.");
    }
    setIsLoading(false);
  }

  async function handleJoinRoom() {
    if (!callsign.trim()) {
      setError("Please enter your callsign first.");
      return;
    }
    if (!joinCode.trim()) {
      setError("Please enter a room code.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const cleanCode = joinCode.toUpperCase().trim();
      await joinRoom(cleanCode, callsign.trim(), team);
      setRoomCode(cleanCode);
      setIsHost(false);
      setLobbyState("waiting");
      subscribeToRoom(cleanCode);
    } catch (e: any) {
      setError(e.message || "Could not join room.");
    }
    setIsLoading(false);
  }

  async function handleStartGame() {
    if (players.length < 2) return;
    setIsLoading(true);
    try {
      await startGame(roomCode);
    } catch (e: any) {
      setError(e.message || "Failed to start game.");
      setIsLoading(false);
    }
  }

  async function handleLeaveRoom() {
    setIsLoading(true);
    try {
      await leaveRoom(roomCode, callsign, isHost);
      handleLeaveRoomCleanup();
    } catch (e: any) {
      setError("Could not leave room properly.");
    }
    setIsLoading(false);
  }

  const handlePlayNow = () => {
    if (!canPlay) {
      setPlayTooltip(true);
      setTimeout(() => setPlayTooltip(false), 2000);
      return;
    }
    router.push(`/game?team=${team}&player=${encodeURIComponent(callsign)}`);
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

        {lobbyState === "waiting" ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <div className="w-full max-w-[600px] border border-border bg-surface p-8 rounded shadow-2xl relative">
              {/* ROOM CODE DISPLAY */}
              <div className="text-center mb-8">
                <span className="font-mono text-xs text-muted uppercase tracking-[0.2em] block mb-1">
                  ROOM CODE
                </span>
                <div className="flex items-center justify-center gap-4">
                  <span className="font-heading text-7xl text-accent tracking-[0.15em] font-bold select-all leading-none ml-6">
                    {roomCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="btn-press border border-border bg-bg/50 px-3 py-1.5 font-mono text-[10px] text-text hover:border-accent hover:text-accent rounded transition-all flex items-center justify-center min-w-[70px] uppercase font-bold"
                  >
                    {copied ? "COPIED!" : "COPY"}
                  </button>
                </div>
              </div>

              {/* PLAYER LIST */}
              <div className="mb-8">
                <h3 className="font-heading text-xl text-text tracking-widest mb-4 border-b border-border/40 pb-2 uppercase">
                  PLAYERS IN LOBBY ({players.length}/6)
                </h3>
                <div className="flex flex-col gap-2 min-h-[280px]">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="animate-slide-in-right flex items-center justify-between border border-border bg-bg/50 px-4 py-3 rounded transition-all hover:border-accent/30"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              player.team === "defend"
                                ? "var(--accent3)"
                                : "var(--accent2)",
                          }}
                        />
                        <span className="font-heading text-2xl text-text tracking-wider uppercase flex items-center gap-2">
                          {player.player_name}
                          {player.is_host && <span title="Room Host">👑</span>}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className="font-heading text-sm tracking-wider"
                          style={{
                            color:
                              player.team === "defend"
                                ? "var(--accent3)"
                                : "var(--accent2)",
                          }}
                        >
                          {player.team === "defend" ? "🛡 DEFEND" : "⚔ ATTACK"}
                        </span>

                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: player.is_host || player.is_ready ? "#4eff91" : "#666666",
                            }}
                            title={player.is_host || player.is_ready ? "Ready" : "Waiting"}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty Slots */}
                  {Array.from({ length: Math.max(0, 6 - players.length) }).map(
                    (_, index) => (
                      <div
                        key={`empty-${index}`}
                        className="flex items-center justify-between border border-dashed border-border/50 bg-bg/10 px-4 py-3.5 rounded opacity-40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full border border-dashed border-muted" />
                          <span className="font-heading text-lg text-muted tracking-wider uppercase">
                            WAITING FOR PLAYER...
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* STATUS */}
              <div className="text-center mb-6">
                {players.length < 2 ? (
                  <p className="font-mono text-xs text-muted tracking-widest uppercase pulse-text">
                    WAITING FOR PLAYERS...
                  </p>
                ) : isHost ? (
                  <button
                    type="button"
                    onClick={handleStartGame}
                    disabled={isLoading}
                    className="btn-press w-full h-[56px] bg-accent text-bg font-heading text-2xl tracking-[0.15em] hover:brightness-110 glow-play transition-all select-none uppercase border-0 cursor-pointer"
                  >
                    {isLoading ? "STARTING..." : "START GAME"}
                  </button>
                ) : (
                  <p className="font-mono text-xs text-muted tracking-widest uppercase pulse-text">
                    WAITING FOR HOST TO START...
                  </p>
                )}
              </div>

              {/* LEAVE ROOM */}
              <div className="flex justify-center border-t border-border/30 pt-6">
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  disabled={isLoading}
                  className="btn-press border border-accent2/60 hover:border-accent2 bg-transparent px-6 py-2 font-heading text-lg tracking-widest text-accent2 hover:bg-accent2/10 rounded transition-all select-none uppercase cursor-pointer"
                >
                  LEAVE ROOM
                </button>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="mt-4 w-full max-w-[600px] border border-accent2 bg-accent2/10 px-4 py-3 text-center rounded text-accent2 font-mono text-xs tracking-wider animate-slide-in-right">
                {error}
              </div>
            )}
          </div>
        ) : (
          <>
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
                    className="w-full border border-border bg-bg px-4 py-3 font-mono text-sm uppercase text-text placeholder:text-muted focus:border-accent focus:outline-none animate-none"
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
                      "btn-press rounded border-2 px-4 py-4 font-heading text-lg tracking-widest transition-all cursor-pointer",
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
                      "btn-press rounded border-2 px-4 py-4 font-heading text-lg tracking-widest transition-all cursor-pointer",
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
                      setLobbyState("joining");
                    }}
                  />
                </div>

                {lobbyState === "joining" && (
                  <div className="mt-6 flex flex-col gap-3">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="XX-0000"
                      maxLength={7}
                      className="w-full border border-border bg-bg px-4 py-3 text-center font-heading text-2xl tracking-widest text-text placeholder:text-muted focus:border-accent focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleJoinRoom}
                        disabled={isLoading}
                        className="btn-press flex-1 rounded border border-accent bg-transparent py-3 font-heading text-lg tracking-widest text-accent transition-all hover:bg-accent hover:text-bg cursor-pointer"
                      >
                        JOIN
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLobbyState("idle");
                          setJoinCode("");
                          setError("");
                        }}
                        className="btn-press rounded border border-border bg-transparent px-4 py-3 font-heading text-lg tracking-widest text-muted hover:border-accent2 hover:text-accent2 cursor-pointer"
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="relative mt-10 flex justify-center">
              <button
                type="button"
                onClick={handlePlayNow}
                disabled={!canPlay}
                className={[
                  "btn-press rounded px-16 py-5 font-heading text-3xl tracking-[0.2em] transition-all cursor-pointer border-0",
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
          </>
        )}

        {/* Global setup error display */}
        {error && lobbyState !== "waiting" && (
          <div className="mt-6 mx-auto w-full max-w-4xl border border-accent2 bg-accent2/10 px-4 py-3 text-center rounded text-accent2 font-mono text-xs tracking-wider animate-slide-in-right">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
