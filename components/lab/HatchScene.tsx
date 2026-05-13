import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";

type Mask =
  | {
      kind: "text";
      text: string;
      fontFamily: string;
      fontWeight?: number;
      align?: "start" | "center";
      /** Reference width (in monospace 'M' widths) used for the auto-shrink
       *  fit. Useful when several text masks need the same letter size — e.g.
       *  pass `widthChars: 7` for both "DONOVAN" and "YOHAN" so the auto-shrink
       *  treats them as if they were the same length. */
      widthChars?: number;
    }
  | { kind: "svg"; src: string };

interface HatchSceneProps {
  mask: Mask;
  height?: number | string;
  inkColor?: string;
  paperColor?: string;
  hatchScale?: number;
  mouseRadius?: number;
  padding?: number;
  outlineWidth?: number;
  baseDensity?: number;
  halfWidthV?: number;
  fadeWidth?: number;
  thicknessJitter?: number;
  lineWobble?: number;
  peakDensity?: number;
  /** Duration (ms) for the per-line "pencil draw-on" intro. 0 disables. */
  introMs?: number;
  /** Delay (ms) before the intro starts. */
  introDelayMs?: number;
  /**
   * `binary` (default) treats the mask as an alpha silhouette — hatching
   * only renders inside opaque regions. `luminance` reads the mask's red
   * channel as a grayscale density map: darker source pixels push more
   * cross-hatching at that location, regardless of alpha.
   */
  densityMode?: "binary" | "luminance";
  /** Multiplier applied to (1 - luminance) when densityMode = "luminance". */
  luminanceBoost?: number;
  /**
   * Intensity (0..1) of the inverse-proximity "flashlight" effect. In
   * luminance mode, this value scales how much density the cursor can
   * *subtract* under it — 0 disables it (cursor has no effect), 1 lets
   * the cursor fully erase hatching at its centre. Use small values
   * (~0.25-0.4) paired with a wide mouseRadius for a subtle glow.
   * Has no effect in binary mode.
   */
  invertProximity?: number;
  /**
   * Fires once when the intro animation's first frame actually emits
   * uIntro > 0 — i.e. mask texture has loaded AND introDelayMs has
   * elapsed. Use this to gate UI that should only reveal once ink is
   * being laid down (e.g. fading a covering overlay).
   */
  onIntroStart?: () => void;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uMask;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uMouseActive;
  uniform vec3 uInk;
  uniform float uHatchScale;
  uniform float uMouseRadius;
  uniform float uOutlineWidth;
  uniform float uBaseDensity;
  uniform float uHalfWidthV;
  uniform float uFadeWidth;
  uniform float uThicknessJitter;
  uniform float uLineWobble;
  uniform float uPeakDensity;
  uniform float uIntro; // 0..1 pencil-draw-on progress
  uniform float uDensityMode; // 0 = binary alpha mask, 1 = luminance density map
  uniform float uLuminanceBoost; // multiplier applied to (1 - luminance)
  uniform float uInvertProximity; // 0 = cursor adds density, 1 = cursor removes it

  // CanvasTexture defaults to flipY=true so screen and canvas share orientation.
  // In binary mode we read alpha (silhouette mask). In luminance mode we read
  // the red channel as a grayscale density signal — darker pixels in the
  // source push more cross-hatching at that location.
  float maskAt(vec2 uv) {
    vec4 t = texture2D(uMask, uv);
    return t.a;
  }
  float lumAt(vec2 uv) {
    vec4 t = texture2D(uMask, uv);
    return t.r;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Smooth value noise — used for slow per-line position wobble along the
  // line's length. Smaller-than-line-spacing amplitude keeps lines parallel.
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Hatching line at given angle. All lines are drawn on a single fixed grid
  // (freq = 4 lines per uHatchScale unit). Each line's reveal threshold is
  // determined by which fractal-subdivision level it belongs to, so as density
  // rises new lines insert exactly halfway between existing ones:
  //   density 0    → 1 line per period (every 8th)   — spacing 2
  //   density 1/3  → 2 lines per period (every 4th)  — spacing 1
  //   density 2/3  → 4 lines per period (every 2nd)  — spacing 0.5
  //   density 1    → 8 lines per period (every line) — spacing 0.25
  float hatchLine(vec2 p, float angle, float halfWidthV, float density) {
    const float freq = 4.0;
    float c = cos(angle);
    float s = sin(angle);
    float v = p.x * c + p.y * s;
    float u = p.x * -s + p.y * c;   // distance along the line

    float lineIdx = floor(v * freq);
    float m8 = mod(lineIdx, 8.0);

    // Per-line slight wobble in v, smoothly varying along u. Amplitude is
    // clamped well below the line spacing (1.0 in v*freq) so neighbours
    // never visually cross — lines stay parallel.
    float wob = (vnoise(vec2(u * 0.6 + lineIdx * 7.3, lineIdx * 1.7)) - 0.5)
                * uLineWobble * 0.45;

    // Per-line thickness jitter — each line gets a constant multiplier in
    // [1 - j, 1 + j]. Constant along its length so the line keeps a uniform
    // width but neighbouring lines look slightly different.
    float tJitter = (hash(vec2(lineIdx, angle * 7.1)) - 0.5) * 2.0
                    * uThicknessJitter;

    // Subdivision-level → activation threshold. In binary mode, level 0
    // is anchored at -1 so it stays visible for any density >= 0 (the
    // hatch never disappears completely inside the mask). In luminance
    // mode every level — including level 0 — must scale with density so
    // that pure-white source pixels (density 0) render with ZERO ink at
    // all and pure-black pixels saturate the densest level.
    float level0Threshold = uDensityMode > 0.5 ? 0.0 : -1.0;
    float threshold =
      m8 < 0.5                            ? level0Threshold :
      (abs(m8 - 4.0) < 0.5)               ?  0.35 :
      (abs(m8 - 2.0) < 0.5
        || abs(m8 - 6.0) < 0.5)           ?  0.65 :
                                             0.90;
    float keep = smoothstep(threshold, threshold + max(uFadeWidth, 0.0001), density);

    float thresh = halfWidthV * freq * (1.0 + tJitter);
    float aa = thresh * 0.30;
    float wave = abs(fract(v * freq + wob) - 0.5) * 2.0;
    float line = 1.0 - smoothstep(thresh, thresh + aa, wave);

    // Per-line pencil draw-on: each line picks a staggered start and a draw
    // direction from a hash. The line is revealed progressively along its
    // length (u axis) as uIntro grows from 0 to 1. uIntro >= 1 means done —
    // reveal is forced to 1 so mid-frame uIntro never gates the steady state.
    float introStagger = hash(vec2(lineIdx + 17.3, angle * 3.7)) * 0.6;
    float introDur = 0.4;
    float lineIntro = clamp((uIntro - introStagger) / introDur, 0.0, 1.0);
    float dir = (hash(vec2(lineIdx + 5.0, angle * 11.1)) > 0.5) ? 1.0 : -1.0;
    // Normalise u to [0,1] using the screen diagonal as a generous extent.
    float diag = length(uResolution);
    float uNorm = clamp((u + diag) / (2.0 * diag), 0.0, 1.0);
    float drawnAt = dir > 0.0 ? uNorm : (1.0 - uNorm);
    float reveal = uIntro >= 1.0 ? 1.0 : step(drawnAt, lineIntro);

    return line * keep * reveal;
  }

  void main() {
    vec2 uv = vUv;
    vec2 pixel = uv * uResolution;

    // Pencil wobble on the silhouette: displace mask-sample UV with smooth
    // low-frequency noise so the hatched/outlined edges share the same
    // hand-drawn jitter as the SVG outline strokes (which use feTurbulence
    // displacement). Amplitude is small enough to read as "wavering ink",
    // not "distorted glyph".
    float nx = vnoise(uv * 22.0) - 0.5;
    float ny = vnoise(uv * 22.0 + vec2(13.7, 7.2)) - 0.5;
    vec2 wobbleUv = uv + vec2(nx, ny) * 0.008;

    float m = maskAt(wobbleUv);

    // --- Outline (always visible) ---
    // Multi-sample neighbor differences to draw a robust ring around the mask.
    vec2 px = vec2(uOutlineWidth) / uResolution;
    float mn = maskAt(wobbleUv + vec2(0.0, px.y));
    float ms = maskAt(wobbleUv - vec2(0.0, px.y));
    float me = maskAt(wobbleUv + vec2(px.x, 0.0));
    float mw = maskAt(wobbleUv - vec2(px.x, 0.0));
    float mne = maskAt(wobbleUv + px);
    float msw = maskAt(wobbleUv - px);
    float gradient = abs(m - mn) + abs(m - ms) + abs(m - me) + abs(m - mw)
                   + abs(m - mne) * 0.5 + abs(m - msw) * 0.5;
    float outline = clamp(gradient * 0.6, 0.0, 1.0);

    // --- Cursor proximity ---
    float distToMouse = distance(pixel, uMouse);
    float proximity = 1.0 - smoothstep(0.0, uMouseRadius, distToMouse);
    proximity *= uMouseActive;

    // The 'inside' term gates whether hatching renders at this pixel. In
    // binary mode we step the mask alpha at 0.5. In luminance mode the
    // whole image is hatchable — density modulates per pixel instead of
    // toggling on/off.
    float inside = uDensityMode > 0.5 ? 1.0 : step(0.5, m);

    // Combined "darkness" — base density (visible without cursor) plus
    // proximity boost capped at uPeakDensity (the max density the cursor
    // can push the local field to). In luminance mode, the per-pixel map
    // value (1 - source brightness) becomes the base; the cursor can
    // still push that local pixel toward the peak density on top.
    float peak = max(uPeakDensity, uBaseDensity);
    float darkness;
    if (uDensityMode > 0.5) {
      // Pure per-pixel density from the grayscale source. White pixels
      // (lum = 1) → darkness 0 → no hatching at all. Black pixels
      // (lum = 0) → darkness uLuminanceBoost → full density. When the
      // invert-proximity flag is set, the cursor *subtracts* density in
      // a radius — acting like a flashlight that erases hatching under
      // the mouse — letting users light up portions of the source.
      float lum = lumAt(wobbleUv);
      float lumDark = clamp((1.0 - lum) * uLuminanceBoost, 0.0, 1.0);
      darkness = clamp(lumDark - proximity * uInvertProximity, 0.0, 1.0);
    } else {
      darkness = clamp(uBaseDensity + proximity * (peak - uBaseDensity), 0.0, 1.0);
    }

    // --- Cross-hatch: two diagonals, both drawn on a single freq-4 grid with
    // fractal-subdivision reveal driven by darkness. See hatchLine for the
    // exact level ordering. Lines never move; new lines insert at the
    // halfway points of the previous subdivision step.
    vec2 hp = pixel / uHatchScale;

    float h1 = hatchLine(hp, radians(-45.0), uHalfWidthV, darkness);
    float h2 = hatchLine(hp, radians( 45.0), uHalfWidthV, darkness);

    float hatch = max(h1, h2) * inside;

    float ink = max(outline, hatch);
    gl_FragColor = vec4(uInk, ink);
  }
`;

const buildTextCanvas = (
  text: string,
  fontFamily: string,
  fontWeight: number,
  width: number,
  height: number,
  padding: number,
  align: "start" | "center" = "center",
  widthChars?: number
) => {
  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const usableW = width - padding * 2;
  // Start with fontSize sized so the *cap height* fills the container
  // (cap height ≈ 0.7 × fontSize in most fonts), then shrink if the
  // reference text overflows the usable width.
  let fontSize = Math.floor((height - padding * 2) / 0.7);
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const measureRef = () =>
    widthChars && widthChars > 0
      ? ctx.measureText("M").width * widthChars
      : ctx.measureText(text).width;
  while (measureRef() > usableW && fontSize > 12) {
    fontSize -= 2;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  }

  ctx.fillStyle = "rgba(20,18,12,1)";
  // Alphabetic baseline + explicit y. Caps are centred vertically inside the
  // canvas (matches SVG's preserveAspectRatio="xMinYMid meet" centring).
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = align === "start" ? "left" : "center";
  const x = align === "start" ? padding : width / 2;
  const capHeight = fontSize * 0.7;
  ctx.fillText(text, x, (height + capHeight) / 2);
  return canvas;
};

const buildSvgCanvas = (
  src: string,
  width: number,
  height: number,
  padding: number
): Promise<HTMLCanvasElement | null> => {
  return new Promise((resolve) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }
    ctx.scale(dpr, dpr);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const usableW = width - padding * 2;
      const usableH = height - padding * 2;
      const ratio = img.width / img.height;
      let drawW = usableW;
      let drawH = usableW / ratio;
      if (drawH > usableH) {
        drawH = usableH;
        drawW = usableH * ratio;
      }
      const dx = (width - drawW) / 2;
      const dy = (height - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);
      resolve(canvas);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
};

interface PlaneProps {
  mask: Mask;
  inkColor: string;
  hatchScale: number;
  mouseRadius: number;
  padding: number;
  outlineWidth: number;
  baseDensity: number;
  halfWidthV: number;
  fadeWidth: number;
  thicknessJitter: number;
  lineWobble: number;
  peakDensity: number;
  introMs: number;
  introDelayMs: number;
  densityMode: "binary" | "luminance";
  luminanceBoost: number;
  invertProximity: number;
  onIntroStart?: () => void;
}

const HatchPlane = ({
  mask,
  inkColor,
  hatchScale,
  mouseRadius,
  padding,
  outlineWidth,
  baseDensity,
  halfWidthV,
  fadeWidth,
  thicknessJitter,
  lineWobble,
  peakDensity,
  introMs,
  introDelayMs,
  densityMode,
  luminanceBoost,
  invertProximity,
  onIntroStart,
}: PlaneProps) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size, gl } = useThree();
  const mouseRef = useRef(new THREE.Vector2(-9999, -9999));
  const mouseActiveRef = useRef(0);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const introStartRef = useRef<number | null>(null);
  const introStartFiredRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let createdTex: THREE.Texture | null = null;

    const make = async () => {
      const w = Math.max(1, size.width);
      const h = Math.max(1, size.height);
      let canvas: HTMLCanvasElement | null = null;
      if (mask.kind === "text") {
        canvas = buildTextCanvas(
          mask.text,
          mask.fontFamily,
          mask.fontWeight ?? 500,
          w,
          h,
          padding,
          mask.align ?? "center",
          mask.widthChars
        );
      } else {
        canvas = await buildSvgCanvas(mask.src, w, h, padding);
      }
      if (cancelled || !canvas) return;
      const tex = new THREE.CanvasTexture(canvas);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      createdTex = tex;
      setTexture(tex);
    };
    make();
    return () => {
      cancelled = true;
      createdTex?.dispose();
    };
  }, [
    mask.kind,
    mask.kind === "text" ? mask.text : mask.src,
    mask.kind === "text" ? mask.fontFamily : "",
    mask.kind === "text" ? mask.fontWeight : 0,
    mask.kind === "text" ? mask.align : "",
    mask.kind === "text" ? mask.widthChars : 0,
    size.width,
    size.height,
    padding,
  ]);

  useEffect(() => {
    const canvas = gl.domElement as HTMLCanvasElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) * dpr;
      mouseRef.current.y = (rect.height - (e.clientY - rect.top)) * dpr;
      mouseActiveRef.current = 1;
    };
    const onBlur = () => {
      mouseActiveRef.current = 0;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onBlur);
    };
  }, [gl]);

  const uniforms = useMemo(
    () => ({
      uMask: { value: null as THREE.Texture | null },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uMouse: { value: new THREE.Vector2(-9999, -9999) },
      uTime: { value: 0 },
      uMouseActive: { value: 0 },
      uInk: { value: new THREE.Color(inkColor) },
      uHatchScale: { value: hatchScale },
      uMouseRadius: { value: mouseRadius },
      uOutlineWidth: { value: outlineWidth },
      uBaseDensity: { value: baseDensity },
      uHalfWidthV: { value: halfWidthV },
      uFadeWidth: { value: fadeWidth },
      uThicknessJitter: { value: thicknessJitter },
      uLineWobble: { value: lineWobble },
      uPeakDensity: { value: peakDensity },
      uIntro: { value: introMs > 0 ? 0 : 1 },
      uDensityMode: { value: densityMode === "luminance" ? 1 : 0 },
      uLuminanceBoost: { value: luminanceBoost },
      uInvertProximity: { value: invertProximity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uInk.value = new THREE.Color(inkColor);
  }, [inkColor]);
  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uHatchScale.value = hatchScale;
  }, [hatchScale]);
  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uMouseRadius.value = mouseRadius;
  }, [mouseRadius]);
  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uOutlineWidth.value = outlineWidth;
  }, [outlineWidth]);
  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uBaseDensity.value = baseDensity;
  }, [baseDensity]);
  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uHalfWidthV.value = halfWidthV;
  }, [halfWidthV]);
  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uFadeWidth.value = fadeWidth;
  }, [fadeWidth]);
  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uThicknessJitter.value = thicknessJitter;
  }, [thicknessJitter]);
  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uLineWobble.value = lineWobble;
  }, [lineWobble]);
  useEffect(() => {
    if (matRef.current) matRef.current.uniforms.uPeakDensity.value = peakDensity;
  }, [peakDensity]);
  useEffect(() => {
    if (matRef.current)
      matRef.current.uniforms.uDensityMode.value =
        densityMode === "luminance" ? 1 : 0;
  }, [densityMode]);
  useEffect(() => {
    if (matRef.current)
      matRef.current.uniforms.uLuminanceBoost.value = luminanceBoost;
  }, [luminanceBoost]);
  useEffect(() => {
    if (matRef.current)
      matRef.current.uniforms.uInvertProximity.value = invertProximity;
  }, [invertProximity]);

  useEffect(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.uMask.value = texture;
  }, [texture]);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    matRef.current.uniforms.uResolution.value.set(size.width * dpr, size.height * dpr);
    matRef.current.uniforms.uMouse.value.copy(mouseRef.current);
    matRef.current.uniforms.uMouseActive.value = mouseActiveRef.current;

    // Pencil draw-on intro. Wait for the mask texture so the reveal is
    // synchronised with the outline appearing. While the texture is
    // still loading we hold uIntro at 0 (lines hidden) so the canvas
    // never flashes a "fully drawn" frame between mount and first paint.
    if (introMs > 0) {
      if (!texture) {
        matRef.current.uniforms.uIntro.value = 0;
      } else {
        if (introStartRef.current === null) {
          introStartRef.current = state.clock.elapsedTime * 1000;
        }
        const elapsed =
          state.clock.elapsedTime * 1000 - introStartRef.current - introDelayMs;
        const intro = Math.max(0, Math.min(1, elapsed / introMs));
        matRef.current.uniforms.uIntro.value = intro;
        if (intro > 0 && !introStartFiredRef.current) {
          introStartFiredRef.current = true;
          onIntroStart?.();
        }
      }
    } else {
      matRef.current.uniforms.uIntro.value = 1;
      if (!introStartFiredRef.current) {
        introStartFiredRef.current = true;
        onIntroStart?.();
      }
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
};

const HatchScene = ({
  mask,
  height = 240,
  inkColor = "#1a1814",
  paperColor = "transparent",
  hatchScale = 16,
  mouseRadius = 600,
  padding = 24,
  outlineWidth = 0.5,
  baseDensity = 0,
  halfWidthV = 0.07,
  fadeWidth = 0.5,
  thicknessJitter = 0.59,
  lineWobble = 0.89,
  peakDensity = 1.0,
  introMs = 1300,
  introDelayMs = 0,
  densityMode = "binary",
  luminanceBoost = 1.0,
  invertProximity = 0,
  onIntroStart,
}: HatchSceneProps) => {
  const fill = height === "100%";
  const wrapperStyle: CSSProperties = fill
    ? { position: "absolute", inset: 0, background: paperColor }
    : { width: "100%", height, position: "relative", background: paperColor };
  return (
    <div style={wrapperStyle}>
      <Canvas
        orthographic
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%" }}
      >
        <HatchPlane
          mask={mask}
          inkColor={inkColor}
          hatchScale={hatchScale}
          mouseRadius={mouseRadius}
          padding={padding}
          outlineWidth={outlineWidth}
          baseDensity={baseDensity}
          halfWidthV={halfWidthV}
          fadeWidth={fadeWidth}
          thicknessJitter={thicknessJitter}
          lineWobble={lineWobble}
          peakDensity={peakDensity}
          introMs={introMs}
          introDelayMs={introDelayMs}
          densityMode={densityMode}
          luminanceBoost={luminanceBoost}
          invertProximity={invertProximity}
          onIntroStart={onIntroStart}
        />
      </Canvas>
    </div>
  );
};

export default HatchScene;
