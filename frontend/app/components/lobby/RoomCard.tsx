"use client";

type RoomCardProps = {
  variant: "create" | "join";
  onClick: () => void;
};

export default function RoomCard({ variant, onClick }: RoomCardProps) {
  if (variant === "create") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="btn-press flex flex-1 flex-col items-center justify-center gap-2 rounded border-2 border-accent bg-accent px-6 py-8 text-bg transition-all hover:brightness-110"
      >
        <span className="font-heading text-4xl leading-none">+</span>
        <span className="font-heading text-xl tracking-widest">CREATE ROOM</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-press flex flex-1 flex-col items-center justify-center gap-2 rounded border-2 border-border bg-transparent px-6 py-8 text-text transition-all hover:border-text hover:bg-surface"
    >
      <span className="font-heading text-xl tracking-widest">JOIN ROOM</span>
      <span className="font-mono text-xs text-muted">Enter room code</span>
    </button>
  );
}
