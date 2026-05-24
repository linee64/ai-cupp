"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "./GameContext";

type DefendShopProps = {
  activeTeam: "attack" | "defend";
};

type ShopItem = {
  id: string;
  icon: string;
  label: string;
  description: string;
  cost: number;
  hotkey: string;
  onBuy: () => boolean;
};

const panelStyle: React.CSSProperties = {
  background: "#0d1f1aee",
  border: "1px solid #1e4a3a",
  borderRadius: 2,
  boxShadow: "0 0 12px #00000088",
};

const SHOP_ITEMS: Omit<ShopItem, "onBuy">[] = [
  {
    id: "tape",
    icon: "🔧",
    label: "TAPE REPAIR",
    description: "+100 HP to Target Box",
    cost: 50,
    hotkey: "1",
  },
  {
    id: "ammo",
    icon: "🎯",
    label: "AMMO PACK",
    description: "Instant full reload (any weapon)",
    cost: 30,
    hotkey: "2",
  },
  {
    id: "speed",
    icon: "⚡",
    label: "SPEED BOOST",
    description: "Move faster for 10s",
    cost: 40,
    hotkey: "3",
  },
  {
    id: "balloon",
    icon: "💧",
    label: "BALLOON PACK",
    description: "+3 Balloon ammo",
    cost: 20,
    hotkey: "4",
  },
];

export default function DefendShop({ activeTeam }: DefendShopProps) {
  const {
    coins,
    speedBoostSecondsLeft,
    purchaseTapeRepair,
    purchaseAmmoPack,
    purchaseSpeedBoost,
    purchaseBalloonPack,
    requestPointerLock,
  } = useGame();

  const [open, setOpen] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const wasLockedRef = useRef(false);

  const buyHandlers: Record<string, () => boolean> = {
    tape: purchaseTapeRepair,
    ammo: purchaseAmmoPack,
    speed: purchaseSpeedBoost,
    balloon: purchaseBalloonPack,
  };

  const items: ShopItem[] = SHOP_ITEMS.map((item) => ({
    ...item,
    onBuy: buyHandlers[item.id],
  }));

  const toggleShop = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleBuy = useCallback((id: string, buy: () => boolean) => {
    if (!buy()) return;
    setFlashId(id);
    setTimeout(() => setFlashId(null), 350);
  }, []);

  useEffect(() => {
    if (!open) return;

    if (document.pointerLockElement) {
      wasLockedRef.current = true;
      document.exitPointerLock();
    } else {
      wasLockedRef.current = false;
    }
  }, [open]);

  const closeShop = useCallback(() => {
    setOpen(false);
    if (wasLockedRef.current) {
      requestAnimationFrame(() => {
        requestPointerLock();
      });
    }
    wasLockedRef.current = false;
  }, [requestPointerLock]);

  useEffect(() => {
    if (activeTeam !== "defend") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Tab") {
        e.preventDefault();
        if (open) {
          closeShop();
        } else {
          toggleShop();
        }
        return;
      }

      if (!open) return;

      if (e.code === "Escape") {
        e.preventDefault();
        closeShop();
        return;
      }

      const digit = e.code.replace("Digit", "");
      const item = items.find((i) => i.hotkey === digit);
      if (item) {
        e.preventDefault();
        handleBuy(item.id, item.onBuy);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeTeam, open, toggleShop, closeShop, items, handleBuy]);

  if (activeTeam !== "defend") return null;

  return (
    <>
      <div
        className="pointer-events-auto absolute bottom-28 left-1/2 z-40 -translate-x-1/2"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => (open ? closeShop() : toggleShop())}
          className="font-heading tracking-widest transition-opacity hover:opacity-90"
          style={{
            ...panelStyle,
            background: "#0d1f1add",
            padding: "10px 20px",
            color: "#c8e6c0",
            fontSize: 14,
            letterSpacing: 2,
            cursor: "pointer",
          }}
        >
          🛒 SHOP [TAB]
        </button>
      </div>

      {open && (
        <div
          className="pointer-events-auto absolute inset-0 z-40"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ ...panelStyle, width: 220, padding: "14px 12px" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2
              className="font-heading tracking-wide"
              style={{ fontSize: 20, color: "#4eff91", marginBottom: 10 }}
            >
              DEFEND SHOP
            </h2>

            <p
              className="font-mono"
              style={{ fontSize: 11, color: "#c8e6c0", marginBottom: 8 }}
            >
              💰 {coins} COINS
            </p>

            <p
              className="font-mono"
              style={{ fontSize: 9, color: "#4eff9188", marginBottom: 12 }}
            >
              Click BUY or press 1–4 · TAB to close
            </p>

            <div className="flex flex-col gap-2">
              {items.map((item) => {
                const isSpeedActive =
                  item.id === "speed" && speedBoostSecondsLeft > 0;
                const canAfford = coins >= item.cost && !isSpeedActive;

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (canAfford) handleBuy(item.id, item.onBuy);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canAfford) {
                        handleBuy(item.id, item.onBuy);
                      }
                    }}
                    style={{
                      padding: "8px 8px",
                      borderRadius: 2,
                      background: flashId === item.id ? "#4eff9133" : "transparent",
                      transition: "background 0.2s",
                      cursor: canAfford ? "pointer" : "default",
                      opacity: canAfford ? 1 : 0.65,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span style={{ fontSize: 16 }}>{item.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="font-heading tracking-wide"
                            style={{ fontSize: 13, color: "#c8e6c0" }}
                          >
                            {item.label}
                          </span>
                          <span
                            className="font-mono"
                            style={{ fontSize: 9, color: "#4eff9166" }}
                          >
                            [{item.hotkey}]
                          </span>
                        </div>
                        <p
                          className="font-mono"
                          style={{ fontSize: 9, color: "#4eff9188", marginTop: 2 }}
                        >
                          {item.description}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className="font-mono"
                            style={{
                              fontSize: 10,
                              color: canAfford ? "#ffdd00" : "#666666",
                            }}
                          >
                            {item.cost} coins
                          </span>
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBuy(item.id, item.onBuy);
                            }}
                            className="font-heading tracking-wider"
                            style={{
                              padding: "4px 10px",
                              fontSize: 11,
                              border: "1px solid #1e4a3a",
                              borderRadius: 2,
                              background: canAfford ? "#1a3528" : "#1a1a1a",
                              color: canAfford ? "#4eff91" : "#555555",
                              cursor: canAfford ? "pointer" : "not-allowed",
                              pointerEvents: "auto",
                            }}
                          >
                            {isSpeedActive
                              ? `ACTIVE ${speedBoostSecondsLeft}s`
                              : "BUY"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
