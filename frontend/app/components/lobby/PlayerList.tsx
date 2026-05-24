"use client";

type Player = {
  callsign: string;
  team: "attack" | "defend";
  isHost?: boolean;
};

type PlayerListProps = {
  players: Player[];
};

export default function PlayerList({ players }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <p className="font-mono text-xs text-muted">No players connected</p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {players.map((player) => (
        <li
          key={player.callsign}
          className="flex items-center justify-between rounded border border-border bg-bg px-3 py-2"
        >
          <span className="font-mono text-sm text-text">{player.callsign}</span>
          <span
            className="font-mono text-[10px] uppercase tracking-wider"
            style={{
              color:
                player.team === "attack" ? "var(--accent2)" : "var(--accent3)",
            }}
          >
            {player.team === "attack" ? "ATTACK" : "DEFEND"}
            {player.isHost ? " · HOST" : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
