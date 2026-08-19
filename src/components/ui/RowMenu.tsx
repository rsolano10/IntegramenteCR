import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface RowMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
}

const MENU_WIDTH = 208; // w-52
const ROW_HEIGHT = 44; // min-h-11 per item
const MENU_PADDING = 12; // top/bottom border + rounded corners slack

// The "⋯" row action for data tables. Portaled to <body> and positioned
// from the trigger's own bounding box (not CSS position: absolute inside
// the row) — a table row lives inside overflow-x-auto (for horizontal
// scroll) nested in the card's overflow-hidden (for its rounded corners),
// and both clip anything that tries to escape them via absolute
// positioning. Rendering outside that DOM subtree sidesteps the clipping
// entirely, the same way any real popover implementation has to.
export function RowMenu({ items }: { items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const visible = items.filter((i) => !i.hidden);

  function toggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuHeight = visible.length * ROW_HEIGHT + MENU_PADDING;
      const opensUp = rect.bottom + menuHeight + 6 > window.innerHeight;
      setCoords({
        top: opensUp ? rect.top - menuHeight - 6 : rect.bottom + 6,
        left: Math.max(8, rect.right - MENU_WIDTH),
      });
    }
    setOpen((v) => !v);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    // Closes rather than trying to track the trigger's new position —
    // simpler and avoids a stale menu floating away from its row.
    function onScrollOrResize() {
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Más opciones"
        className="w-9 h-9 inline-flex items-center justify-center rounded-full text-tinta-tenue text-xl leading-none cursor-pointer hover:bg-campo"
      >
        ⋯
      </button>

      {open &&
        coords &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 cursor-default border-none bg-transparent p-0"
            />
            <div
              role="menu"
              style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_WIDTH }}
              className="z-40 bg-white border border-borde rounded-2xl shadow-elevada overflow-hidden"
            >
              {visible.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    item.onClick();
                  }}
                  className={`w-full text-left min-h-11 px-4 font-sans text-[14px] cursor-pointer hover:bg-campo ${
                    item.danger ? "text-alerta-texto font-semibold" : "text-tinta"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
