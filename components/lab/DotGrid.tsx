import { useEffect, useRef } from "react";

interface DotGridProps {
  spacing?: number;
  dotRadius?: number;
  influenceRadius?: number;
  maxRadiusBoost?: number;
  color?: string;
  background?: string;
  /**
   * Optional anchor element. When provided, dots align to this element's
   * top-left corner in document coordinates instead of viewport (0, 0).
   */
  anchorRef?: React.RefObject<HTMLElement | null>;
}

const DotGrid = ({
  spacing = 16,
  dotRadius = 1,
  influenceRadius = 240,
  maxRadiusBoost = 1.5,
  color = "rgba(40, 38, 32, 0.32)",
  background = "transparent",
  anchorRef,
}: DotGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const scrollRef = useRef(0);
  const originRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const updateOrigin = () => {
      if (anchorRef?.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        originRef.current = {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
        };
      } else {
        originRef.current = { x: 0, y: 0 };
      }
    };

    const onMove = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };
    const onLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };
    const onScroll = () => {
      scrollRef.current = window.scrollY || window.pageYOffset || 0;
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      if (background !== "transparent") {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }

      const scrollY = scrollRef.current;
      const m = mouseRef.current;
      const r2 = influenceRadius * influenceRadius;
      const ox = originRef.current.x;
      const oy = originRef.current.y;
      ctx.fillStyle = color;

      // Anchor dot grid to content origin (anchor element's top-left in document
      // coordinates). Dots fall on a 16px lattice starting from origin.
      const startCol = Math.floor((0 - ox) / spacing);
      const endCol = Math.ceil((width - ox) / spacing);
      const startRow = Math.floor((scrollY - oy) / spacing);
      const endRow = Math.ceil((scrollY + height - oy) / spacing);

      for (let r = startRow; r <= endRow; r++) {
        const docY = oy + r * spacing;
        const viewY = docY - scrollY;
        if (viewY < -spacing || viewY > height + spacing) continue;
        for (let c = startCol; c <= endCol; c++) {
          const viewX = ox + c * spacing;
          if (viewX < -spacing || viewX > width + spacing) continue;

          let radius = dotRadius;
          if (m.active) {
            const dx = viewX - m.x;
            const dy = viewY - m.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < r2) {
              const proximity = 1 - Math.sqrt(d2) / influenceRadius;
              radius = dotRadius + proximity * maxRadiusBoost;
            }
          }

          ctx.beginPath();
          ctx.arc(viewX, viewY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    resize();
    onScroll();
    updateOrigin();
    window.addEventListener("resize", () => {
      resize();
      updateOrigin();
    });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [spacing, dotRadius, influenceRadius, maxRadiusBoost, color, background, anchorRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
};

export default DotGrid;
