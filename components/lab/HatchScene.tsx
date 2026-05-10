import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Mask =
  | { kind: "text"; text: string; fontFamily: string; fontWeight?: number }
  | { kind: "svg"; src: string };

interface HatchSceneProps {
  mask: Mask;
  height?: number;
  inkColor?: string;
  paperColor?: string;
  hatchScale?: number;
  mouseRadius?: number;
  padding?: number;
  outlineWidth?: number;
  baseDensity?: number;
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

  // CanvasTexture defaults to flipY=true so screen and canvas share orientation.
  float maskAt(vec2 uv) {
    return texture2D(uMask, uv).a;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Hand-drawn-feel hatching line at given angle.
  // freq = lines per uHatchScale unit. thickness = line half-width (0..0.5).
  float hatchLine(vec2 p, float angle, float freq, float thickness) {
    float c = cos(angle);
    float s = sin(angle);
    float v = p.x * c + p.y * s;
    // small organic wobble along the line direction
    float wobble = (hash(vec2(floor(v * freq), floor((p.x * -s + p.y * c) * freq * 0.3))) - 0.5) * 0.05;
    float wave = abs(fract(v * freq + wobble) - 0.5) * 2.0;
    return 1.0 - smoothstep(thickness, thickness + 0.05, wave);
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
    // proximity boost. 0..1 ramp drives layered cross-hatch.
    float darkness = clamp(uBaseDensity + proximity * (1.0 - uBaseDensity), 0.0, 1.0);

    // --- 4 hatch directions, each fading in across a smooth proximity window ---
    vec2 hp = pixel / uHatchScale;

    // Direction 1: -45° (primary). Always at least faintly present once darkness > 0.
    float h1 = hatchLine(hp, radians(-45.0), 0.5, 0.08);
    // Direction 2: 45° (cross-hatch — the core "X" pattern).
    float h2 = hatchLine(hp, radians( 45.0), 0.5, 0.08);
    // Direction 3: 0° horizontal — adds the dense triple layer.
    float h3 = hatchLine(hp, radians(  0.0), 0.5, 0.08);
    // Direction 4: 90° vertical — densest fill.
    float h4 = hatchLine(hp, radians( 90.0), 0.5, 0.08);

    float l1 = h1 * smoothstep(0.00, 0.20, darkness);
    float l2 = h2 * smoothstep(0.25, 0.50, darkness);
    float l3 = h3 * smoothstep(0.50, 0.75, darkness);
    float l4 = h4 * smoothstep(0.75, 0.98, darkness);

    float hatch = max(max(l1, l2), max(l3, l4));
    hatch *= inside;

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
  padding: number
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
  let fontSize = Math.floor(height * 0.7);
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  while (ctx.measureText(text).width > usableW && fontSize > 12) {
    fontSize -= 2;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  }

  ctx.fillStyle = "rgba(20,18,12,1)";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(text, width / 2, height / 2);
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
}

const HatchPlane = ({
  mask,
  inkColor,
  hatchScale,
  mouseRadius,
  padding,
  outlineWidth,
  baseDensity,
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
          padding
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
    const onLeave = () => {
      mouseActiveRef.current = 0;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
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
  hatchScale = 8,
  mouseRadius = 280,
  padding = 24,
  outlineWidth = 2,
  baseDensity = 0.32,
}: HatchSceneProps) => {
  return (
    <div style={{ width: "100%", height, position: "relative", background: paperColor }}>
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
        />
      </Canvas>
    </div>
  );
};

export default HatchScene;
