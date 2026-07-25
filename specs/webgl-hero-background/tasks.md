# WebGL Hero Background Implementation Plan

**Goal:** Replace the static video hero with a full-viewport WebGL background that renders the gl1tch logo with real-time CRT scanlines, chromatic aberration, wave distortion, and glitch slice effects.

**Architecture:** A single `<canvas>` element covers the entire viewport as a fixed background. A minimal WebGL renderer (no dependencies) draws a fullscreen quad textured with the logo PNG, then applies fragment shader effects in a single pass. The existing CSS body scanline overlay is removed (the shader handles it). The canvas respects `prefers-reduced-motion` by freezing to a static render.

**Tech Stack:** Raw WebGL2, GLSL fragment shaders, Astro client-side script (`client:load` not needed — plain `<script>`)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `site/public/logo-solid.png` | Create | Optimized logo texture (1920×1080, RGBA PNG) |
| `site/src/components/GlitchCanvas.astro` | Create | Canvas element + WebGL bootstrap script |
| `site/src/shaders/glitch.frag.glsl` | Create | Fragment shader with all effects |
| `site/src/shaders/fullscreen.vert.glsl` | Create | Passthrough vertex shader for fullscreen quad |
| `site/src/pages/index.astro` | Modify | Replace video section with GlitchCanvas, keep text overlay |
| `site/src/styles/global.css` | Modify | Remove body::before scanline overlay (shader handles it) |
| `site/src/layouts/Base.astro` | Modify | (No change needed — canvas is page-specific) |

---

## Group 1: Shader + Renderer Core

These tasks have no dependencies on each other and can run in parallel.

### Task 1: Prepare logo texture asset

**Files:**
- Create: `site/public/logo-solid.png`

- [ ] **Step 1: Convert and optimize the 4K logo to a web-friendly 1920×1080 texture**
  ```bash
  # From repo root
  convert "/mnt/c/Users/lusky/OneDrive/Pictures/gl1tch/gl1tch_4k-Solid.png" \
    -resize 1920x1080 -strip \
    site/public/logo-solid.png
  ```
  If ImageMagick isn't available:
  ```bash
  npx --yes sharp-cli -i "/mnt/c/Users/lusky/OneDrive/Pictures/gl1tch/gl1tch_4k-Solid.png" \
    -o site/public/logo-solid.png \
    resize 1920 1080
  ```

- [ ] **Step 2: Verify the output**
  ```bash
  file site/public/logo-solid.png
  # Expected: PNG image data, 1920 x 1080, 8-bit/color RGBA, non-interlaced
  ls -lh site/public/logo-solid.png
  # Expected: ~200-400 KB
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add site/public/logo-solid.png
  git commit -m "feat(hero): add optimized logo texture for WebGL background"
  ```

---

### Task 2: Write vertex shader

**Files:**
- Create: `site/src/shaders/fullscreen.vert.glsl`

- [ ] **Step 1: Create the fullscreen quad vertex shader**

  This shader needs no geometry — it generates a fullscreen triangle from `gl_VertexID`:

  ```glsl
  #version 300 es
  precision highp float;

  out vec2 vUv;

  void main() {
    // Fullscreen triangle trick — 3 vertices cover the entire clip space
    float x = float((gl_VertexID & 1) << 2);
    float y = float((gl_VertexID & 2) << 1);
    vUv = vec2(x * 0.5, 1.0 - y * 0.5);
    gl_Position = vec4(x - 1.0, y - 1.0, 0.0, 1.0);
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  mkdir -p site/src/shaders
  git add site/src/shaders/fullscreen.vert.glsl
  git commit -m "feat(hero): add fullscreen quad vertex shader"
  ```

---

### Task 3: Write fragment shader

**Files:**
- Create: `site/src/shaders/glitch.frag.glsl`

- [ ] **Step 1: Create the fragment shader with all effects**

  ```glsl
  #version 300 es
  precision highp float;

  uniform sampler2D uLogo;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uMotion; // 1.0 = animate, 0.0 = static

  in vec2 vUv;
  out vec4 fragColor;

  // --- Utility ---
  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // --- Effects ---

  // Wave distortion
  vec2 wave(vec2 uv, float t) {
    float amt = 0.003 * uMotion;
    uv.x += sin(uv.y * 12.0 + t * 0.8) * amt;
    uv.y += cos(uv.x * 10.0 + t * 0.6) * amt * 0.5;
    return uv;
  }

  // Chromatic aberration — offset R and B channels
  vec4 chromatic(sampler2D tex, vec2 uv, float t) {
    float offset = (0.002 + 0.001 * sin(t * 1.3)) * uMotion;
    float r = texture(tex, uv + vec2(offset, 0.0)).r;
    float g = texture(tex, uv).g;
    float b = texture(tex, uv - vec2(offset, 0.0)).b;
    float a = texture(tex, uv).a;
    return vec4(r, g, b, a);
  }

  // Scanlines
  float scanline(vec2 uv, float t) {
    float line = sin((uv.y * uResolution.y * 0.5) + t * 2.0) * 0.5 + 0.5;
    return mix(1.0, 0.92, line * uMotion);
  }

  // Glitch slices — random horizontal offsets that trigger occasionally
  vec2 glitchSlice(vec2 uv, float t) {
    float trigger = step(0.97, rand(vec2(floor(t * 3.0), 0.0)));
    float sliceY = rand(vec2(floor(t * 7.0), 1.0));
    float inSlice = step(abs(uv.y - sliceY), 0.03);
    float offset = (rand(vec2(floor(t * 11.0), 2.0)) - 0.5) * 0.06;
    uv.x += offset * inSlice * trigger * uMotion;
    return uv;
  }

  // Film grain
  float grain(vec2 uv, float t) {
    return (rand(uv + fract(t * 0.01)) - 0.5) * 0.04 * uMotion;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime;

    // Apply distortions
    uv = glitchSlice(uv, t);
    uv = wave(uv, t);

    // Sample with chromatic aberration
    vec4 color = chromatic(uLogo, uv, t);

    // Composite logo onto dark background
    vec3 bg = vec3(0.059, 0.09, 0.165); // matches --color-bg #0f172a
    vec3 result = mix(bg, color.rgb, color.a);

    // Scanlines
    result *= scanline(vUv, t);

    // Grain
    result += grain(vUv, t);

    // Subtle vignette
    float vig = 1.0 - 0.3 * length((vUv - 0.5) * vec2(1.2, 1.0));
    result *= vig;

    fragColor = vec4(result, 1.0);
  }
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add site/src/shaders/glitch.frag.glsl
  git commit -m "feat(hero): add glitch fragment shader with CRT + wave + aberration effects"
  ```

---

## Group 2: Astro Component + Page Integration

Depends on Group 1 (needs shader files and texture to exist).

### Task 4: Create GlitchCanvas component

**Files:**
- Create: `site/src/components/GlitchCanvas.astro`

- [ ] **Step 1: Write the Astro component**

  ```astro
  ---
  // No props needed — self-contained WebGL canvas
  ---

  <canvas
    id="glitch-bg"
    class="fixed inset-0 -z-10 h-full w-full"
    aria-hidden="true"
  ></canvas>

  <script>
    import vertSrc from '../shaders/fullscreen.vert.glsl?raw';
    import fragSrc from '../shaders/glitch.frag.glsl?raw';

    function initGlitchBg() {
      const canvas = document.getElementById('glitch-bg') as HTMLCanvasElement | null;
      if (!canvas) return;

      const gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
      if (!gl) {
        // Fallback: just leave the CSS background visible
        canvas.remove();
        return;
      }

      // --- Compile shaders ---
      function compile(type: number, source: string): WebGLShader | null {
        const shader = gl!.createShader(type);
        if (!shader) return null;
        gl!.shaderSource(shader, source);
        gl!.compileShader(shader);
        if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
          console.error('Shader compile error:', gl!.getShaderInfoLog(shader));
          gl!.deleteShader(shader);
          return null;
        }
        return shader;
      }

      const vert = compile(gl.VERTEX_SHADER, vertSrc);
      const frag = compile(gl.FRAGMENT_SHADER, fragSrc);
      if (!vert || !frag) { canvas.remove(); return; }

      const program = gl.createProgram()!;
      gl.attachShader(program, vert);
      gl.attachShader(program, frag);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        canvas.remove();
        return;
      }
      gl.useProgram(program);

      // --- Uniforms ---
      const uTime = gl.getUniformLocation(program, 'uTime');
      const uResolution = gl.getUniformLocation(program, 'uResolution');
      const uMotion = gl.getUniformLocation(program, 'uMotion');
      const uLogo = gl.getUniformLocation(program, 'uLogo');

      // --- Empty VAO for vertex-ID-based fullscreen triangle ---
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      // --- Load texture ---
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      // Placeholder 1x1 pixel while loading
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([15, 23, 42, 255]));

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        gl!.bindTexture(gl!.TEXTURE_2D, texture);
        gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, img);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      };
      img.src = '/logo-solid.png';
      gl.uniform1i(uLogo, 0);

      // --- Motion preference ---
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      let motionEnabled = !motionQuery.matches;
      motionQuery.addEventListener('change', (e) => { motionEnabled = !e.matches; });

      // --- Resize handler ---
      function resize() {
        const dpr = Math.min(window.devicePixelRatio, 2);
        const w = canvas!.clientWidth * dpr;
        const h = canvas!.clientHeight * dpr;
        if (canvas!.width !== w || canvas!.height !== h) {
          canvas!.width = w;
          canvas!.height = h;
          gl!.viewport(0, 0, w, h);
        }
      }

      // --- Render loop ---
      let raf: number;
      function frame(t: number) {
        resize();
        gl!.uniform1f(uTime, t * 0.001);
        gl!.uniform2f(uResolution, canvas!.width, canvas!.height);
        gl!.uniform1f(uMotion, motionEnabled ? 1.0 : 0.0);
        gl!.drawArrays(gl!.TRIANGLES, 0, 3);
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);

      // Cleanup on navigation (Astro View Transitions)
      document.addEventListener('astro:before-swap', () => {
        cancelAnimationFrame(raf);
        gl!.deleteProgram(program);
        gl!.deleteShader(vert);
        gl!.deleteShader(frag);
        gl!.deleteTexture(texture);
        gl!.deleteVertexArray(vao);
      }, { once: true });
    }

    // Run on initial load and after Astro navigation
    initGlitchBg();
    document.addEventListener('astro:after-swap', initGlitchBg);
  </script>
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add site/src/components/GlitchCanvas.astro
  git commit -m "feat(hero): add GlitchCanvas WebGL component"
  ```

---

### Task 5: Update homepage to use GlitchCanvas background

**Files:**
- Modify: `site/src/pages/index.astro`

- [ ] **Step 1: Replace the video section with canvas background + text overlay**

  Replace the entire content of `site/src/pages/index.astro` with:

  ```astro
  ---
  import Base from '../layouts/Base.astro';
  import GlitchCanvas from '../components/GlitchCanvas.astro';
  import { site } from '../data/site';
  ---

  <Base>
    <GlitchCanvas />

    <section class="relative min-h-[80dvh] flex items-center justify-center">
      <div class="mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 class="font-display text-4xl font-black uppercase tracking-[0.18em] text-white sm:text-6xl md:text-7xl drop-shadow-[0_0_40px_rgba(8,145,178,0.4)]">
          <span class="glitch" data-text="Toronto gl1tch">Toronto gl1tch</span>
        </h1>
        <p class="max-w-prose text-sm uppercase tracking-[0.3em] text-[var(--color-fg-muted)] sm:text-base">
          {site.tagline}
        </p>

        <div class="flex flex-wrap items-center justify-center gap-3">
          <a class="btn btn-primary" href="/stream">Watch the stream</a>
          <a class="btn btn-ghost" href="/join">Join the gang</a>
        </div>
      </div>
    </section>
  </Base>
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add site/src/pages/index.astro
  git commit -m "feat(hero): replace video with WebGL canvas background"
  ```

---

### Task 6: Remove redundant CSS body scanline overlay

**Files:**
- Modify: `site/src/styles/global.css`

- [ ] **Step 1: Remove the `body::before` scanline pseudo-element**

  Delete lines 63–78 (the `@media (prefers-reduced-motion: no-preference) { body::before { ... } }` block) from `site/src/styles/global.css`. The WebGL shader now handles scanlines.

  Specifically, remove this block:
  ```css
  /* CRT scanline overlay — only when motion + opt-in OK */
  @media (prefers-reduced-motion: no-preference) {
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      background: repeating-linear-gradient(
        to bottom,
        transparent 0,
        transparent 2px,
        rgb(255 255 255 / 0.025) 3px,
        transparent 4px
      );
      mix-blend-mode: overlay;
    }
  }
  ```

- [ ] **Step 2: Run build to verify no regressions**
  ```bash
  cd site && npm run build
  # Expected: Build succeeds, "Complete!" at the end
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add site/src/styles/global.css
  git commit -m "refactor(hero): remove CSS scanline overlay (handled by WebGL shader)"
  ```

---

## Group 3: Verification

### Task 7: Visual verification + final commit

- [ ] **Step 1: Run dev server and verify visually**
  ```bash
  cd site && npm run dev
  # Open http://localhost:4321/
  ```
  Verify:
  - Canvas covers full viewport as background
  - Logo is visible with cyan tint, centered
  - Scanlines animate subtly
  - Chromatic aberration (slight RGB split) visible on logo edges
  - Occasional glitch slices (horizontal offsets) trigger every few seconds
  - Gentle wave distortion
  - Film grain visible on close inspection
  - Text overlay is readable with drop shadow
  - Buttons work and are clickable
  - Scrolling past hero shows normal page content with no canvas overlap

- [ ] **Step 2: Test reduced motion**
  In browser DevTools → Rendering → Emulate CSS media: `prefers-reduced-motion: reduce`
  Verify: Canvas shows static logo, no animation

- [ ] **Step 3: Test WebGL fallback**
  In browser console: manually test by forcing `getContext` to return null
  Verify: Canvas is removed, dark CSS background remains visible

- [ ] **Step 4: Run full build**
  ```bash
  cd site && npm run build && npm run check
  # Expected: Both pass with zero errors
  ```

- [ ] **Step 5: Final commit (if any tweaks were needed)**
  ```bash
  git add -A
  git commit -m "feat(hero): WebGL glitch background — complete"
  ```

---

## Review Gate

- [ ] ka-reviewer: Performance (single draw call? No layout thrash? DPR capped at 2?), code quality, Astro patterns
- [ ] ka-security-reviewer: No XSS vectors, `crossOrigin` set on image, no eval in shader loading

---

## Notes

- **No dependencies added** — pure WebGL2, available in all modern browsers (97%+ support)
- **Fallback** — if WebGL2 unavailable, canvas is removed and the dark CSS `body` background shows
- **Performance** — single fullscreen triangle, single texture lookup, all effects in one fragment shader pass. No framebuffer ping-pong. Capped at 2× DPR.
- **Payload** — ~300 KB PNG + ~3 KB shader code vs the old 3.4 MB WEBM video
- **The `?raw` import** — Vite (which Astro uses) inlines `.glsl` files as strings at build time via the `?raw` suffix. No extra loader config needed.
