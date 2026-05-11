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

  // CanvasTexture defaults to flipY=true so screen and canvas share orientation.
  float maskAt(vec2 uv) {
    return texture2D(uMask, uv).a;
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

    // Subdivision-level → activation threshold. Level 0 anchored at -1 so it
    // is always fully visible regardless of density; the higher levels have
    // wide thresholds so an idle base density never accidentally bleeds into
    // partial-alpha level-1 lines.
    float threshold =
      m8 < 0.5                            ? -1.0 :
      (abs(m8 - 4.0) < 0.5)               ?  0.35 :
      (abs(m8 - 2.0) < 0.5
        || abs(m8 - 6.0) < 0.5)           ?  0.65 :
                                             0.90;
    // Level 0 sits at threshold = -1 so its smoothstep is fully saturated for
    // any density >= 0 regardless of uFadeWidth — base lines never fade.
    float keep = smoothstep(threshold, threshold + max(uFadeWidth, 0.0001), density);

    float thresh = halfWidthV * freq * (1.0 + tJitter);
    float aa = thresh * 0.30;
    float wave = abs(fract(v * freq + wob) - 0.5) * 2.0;
    float line = 1.0 - smoothstep(thresh, thresh + aa, wave);
    return line * keep;
  }

  void main() {
    vec2 uv = vUv;
    vec2 pixel = uv * uResolution;

    float m = maskAt(uv);

    // --- Outline (always visible) ---
    // Multi-sample neighbor differences to draw a robust ring around the mask.
    vec2 px = vec2(uOutlineWidth) / uResolution;
    float mn = maskAt(uv + vec2(0.0, px.y));
    float ms = maskAt(uv - vec2(0.0, px.y));
    float me = maskAt(uv + vec2(px.x, 0.0));
    float mw = maskAt(uv - vec2(px.x, 0.0));
    float mne = maskAt(uv + px);
    float msw = maskAt(uv - px);
    float gradient = abs(m - mn) + abs(m - ms) + abs(m - me) + abs(m - mw)
                   + abs(m - mne) * 0.5 + abs(m - msw) * 0.5;
    float outline = clamp(gradient * 0.6, 0.0, 1.0);

    float inside = step(0.5, m);

    // --- Cursor proximity drives hatching density ---
    float distToMouse = distance(pixel, uMouse);
    float proximity = 1.0 - smoothstep(0.0, uMouseRadius, distToMouse);
    proximity *= uMouseActive;

    // Combined "darkness" — base density (visible without cursor) plus
    // proximity boost capped at uPeakDensity (the max density the cursor can
    // push the local field to). 0..1 ramp drives the layered cross-hatch.
    float peak = max(uPeakDensity, uBaseDensity);
    float darkness = clamp(uBaseDensity + proximity * (peak - uBaseDensity), 0.0, 1.0);

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
}: PlaneProps) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size, gl } = useThree();
  const mouseRef = useRef(new THREE.Vector2(-9999, -9999));
  const mouseActiveRef = useRef(0);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

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
        />
      </Canvas>
    </div>
  );
};

export default HatchScene;
