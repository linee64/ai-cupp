"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

export interface RemotePlayerState {
  playerId: string;      // unique key (player_name + room_code)
  playerName: string;
  team: "attack" | "defend";
  x: number;
  y: number;
  z: number;
  yaw: number;
  activeWeapon: 1 | 2;
  shootTick: number;
  throwTick: number;
}

/**
 * Broadcasts the local player's position every BROADCAST_INTERVAL ms
 * and returns an array of all other players' states via Supabase Presence.
 */
export function usePresence({
  roomCode,
  playerName,
  team,
  getPosition,
  enabled,
}: {
  roomCode: string;
  playerName: string;
  team: "attack" | "defend";
  /** Called every broadcast tick — return current {x, y, z, yaw, activeWeapon, shootTick, throwTick} */
  getPosition: () => {
    x: number;
    y: number;
    z: number;
    yaw: number;
    activeWeapon: 1 | 2;
    shootTick: number;
    throwTick: number;
  };
  enabled: boolean;
}): RemotePlayerState[] {
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayerState[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const BROADCAST_INTERVAL = 80; // ms — ~12 position updates per second

  useEffect(() => {
    if (!enabled || !roomCode || !playerName) return;

    const playerId = `${roomCode}:${playerName}`;
    const channelName = `presence:${roomCode}`;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: playerId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<RemotePlayerState>();
        const others: RemotePlayerState[] = [];

        for (const key of Object.keys(state)) {
          if (key === playerId) continue;
          // presenceState returns array of presences per key
          const presence = state[key][0];
          if (presence) others.push(presence as unknown as RemotePlayerState);
        }
        setRemotePlayers(others);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Start broadcasting position
          const broadcast = async () => {
            const pos = getPosition();
            await channel.track({
              playerId,
              playerName,
              team,
              x: Math.round(pos.x * 100) / 100,
              y: Math.round(pos.y * 100) / 100,
              z: Math.round(pos.z * 100) / 100,
              yaw: Math.round(pos.yaw * 1000) / 1000,
              activeWeapon: pos.activeWeapon,
              shootTick: pos.shootTick,
              throwTick: pos.throwTick,
            });
          };

          await broadcast();
          intervalRef.current = setInterval(broadcast, BROADCAST_INTERVAL);
        }
      });

    channelRef.current = channel;

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, roomCode, playerName, team]);

  return remotePlayers;
}
