import { useEffect } from "react";

// Called by every full-screen modal (Modal.tsx, DeleteConfirmModal.tsx —
// two separate overlay implementations, both need this) so the page behind
// a modal can't be scrolled with it visually pinned in front. Restores
// whatever the previous inline value was, not just "", in case something
// else ever sets body overflow deliberately.
export function useBodyScrollLock() {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
}
