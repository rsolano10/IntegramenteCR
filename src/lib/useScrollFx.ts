import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function clamp(v: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

// Cubic ease-out — used everywhere a scroll-linked value needs to settle
// gently instead of arriving linearly.
export function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

// Fires once when the element crosses into the middle band of the
// viewport, then stops observing. Restricting the trigger area to roughly
// the center (rather than "just touched the bottom edge") means the
// fade+rise transition actually plays out while the element is near where
// the eye is looking, instead of finishing while it's still low on screen.
// Used for simple fade+rise reveals on section content.
export function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "-28% 0px -28% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// A continuous 0→1 value tracking how close an element's center has come
// to the viewport's center as the page scrolls — the primitive behind the
// "assembles itself" plan-preview card. 0 as its center enters from the
// bottom half of the screen, 1 exactly when it's vertically centered, so
// the scroll-linked motion culminates right where the eye actually is,
// not while the element is still low on screen. Reversible on scroll-up.
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(() => (prefersReducedMotion() ? 1 : 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setProgress(1);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    function update() {
      raf = 0;
      const rect = el!.getBoundingClientRect();
      const vh = window.innerHeight;
      const elCenter = rect.top + rect.height / 2;
      const distFromCenter = elCenter - vh / 2;
      setProgress(clamp(1 - distFromCenter / (vh / 2)));
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return { ref, progress };
}

// A perpetual type-then-delete loop, independent of scroll position or
// whether the element is even on screen — it just runs, always, at a slow
// steady pace, and keeps cycling for as long as the component is mounted.
export function useTypewriterLoop(
  text: string,
  opts?: { typeSpeed?: number; deleteSpeed?: number; holdFull?: number; holdEmpty?: number },
) {
  const { typeSpeed = 70, deleteSpeed = 45, holdFull = 1600, holdEmpty = 500 } = opts ?? {};
  const [display, setDisplay] = useState(() => (prefersReducedMotion() ? text : ""));

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let i = 0;
    let phase: "typing" | "holding" | "deleting" | "waiting" = "typing";
    let timer = 0;

    function tick() {
      if (phase === "typing") {
        i += 1;
        setDisplay(text.slice(0, i));
        phase = i >= text.length ? "holding" : "typing";
        timer = window.setTimeout(tick, i >= text.length ? holdFull : typeSpeed);
        return;
      }
      if (phase === "holding") {
        phase = "deleting";
        timer = window.setTimeout(tick, deleteSpeed);
        return;
      }
      if (phase === "deleting") {
        i -= 1;
        setDisplay(text.slice(0, i));
        phase = i <= 0 ? "waiting" : "deleting";
        timer = window.setTimeout(tick, i <= 0 ? holdEmpty : deleteSpeed);
        return;
      }
      // phase === "waiting"
      phase = "typing";
      timer = window.setTimeout(tick, typeSpeed);
    }

    timer = window.setTimeout(tick, typeSpeed);
    return () => window.clearTimeout(timer);
  }, [text, typeSpeed, deleteSpeed, holdFull, holdEmpty]);

  return display;
}

// Whether the page has scrolled past `threshold` px — drives the header's
// transition from transparent (over the hero) to a solid, blurred bar.
export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(() => typeof window !== "undefined" && window.scrollY > threshold);

  useEffect(() => {
    let raf = 0;
    function update() {
      raf = 0;
      setScrolled(window.scrollY > threshold);
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);

  return scrolled;
}
