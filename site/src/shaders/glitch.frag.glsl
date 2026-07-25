#version 300 es
precision highp float;

uniform sampler2D uLogo;
uniform float uTime;
uniform vec2 uResolution;
uniform float uMotion;
uniform vec2 uMouse;      // normalized mouse position (0-1)
uniform float uClick;     // 1.0 on click, decays to 0

in vec2 vUv;
out vec4 fragColor;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 wave(vec2 uv, float t, float mouseProximity) {
  float amt = (0.003 + 0.008 * mouseProximity) * uMotion;
  uv.x += sin(uv.y * 12.0 + t * 0.8) * amt;
  uv.y += cos(uv.x * 10.0 + t * 0.6) * amt * 0.5;
  return uv;
}

vec4 chromatic(sampler2D tex, vec2 uv, float t, float mouseProximity, float click) {
  float base = 0.002 + 0.001 * sin(t * 1.3);
  float offset = (base + 0.006 * mouseProximity + 0.015 * click) * uMotion;
  float r = texture(tex, uv + vec2(offset, 0.0)).r;
  float g = texture(tex, uv).g;
  float b = texture(tex, uv - vec2(offset, 0.0)).b;
  float a = texture(tex, uv).a;
  return vec4(r, g, b, a);
}

float scanline(vec2 uv, float t) {
  float line = sin((uv.y * uResolution.y * 0.5) + t * 2.0) * 0.5 + 0.5;
  return mix(1.0, 0.92, line * uMotion);
}

vec2 glitchSlice(vec2 uv, float t, float click) {
  // Normal: rare triggers. Click: heavy slicing
  float trigger = step(0.97, rand(vec2(floor(t * 3.0), 0.0)));
  trigger = max(trigger, step(0.3, click)); // click forces trigger
  float numSlices = mix(1.0, 5.0, click);

  for (float i = 0.0; i < 5.0; i++) {
    if (i >= numSlices) break;
    float sliceY = rand(vec2(floor(t * (7.0 + i * 3.0)), 1.0 + i));
    float inSlice = step(abs(uv.y - sliceY), 0.02 + 0.02 * click);
    float offset = (rand(vec2(floor(t * (11.0 + i * 2.0)), 2.0 + i)) - 0.5) * (0.06 + 0.12 * click);
    uv.x += offset * inSlice * trigger * uMotion;
  }
  return uv;
}

float grain(vec2 uv, float t) {
  return (rand(uv + fract(t * 0.01)) - 0.5) * 0.04 * uMotion;
}

void main() {
  vec2 uv = vUv;
  float t = uTime;

  // Mouse proximity — distance from cursor, clamped to a radius
  float mouseDist = length(vUv - uMouse);
  float mouseProximity = smoothstep(0.35, 0.0, mouseDist) * uMotion;

  // Apply distortions
  uv = glitchSlice(uv, t, uClick);
  uv = wave(uv, t, mouseProximity);

  // Sample with chromatic aberration
  vec4 color = chromatic(uLogo, uv, t, mouseProximity, uClick);

  // Darker background for better text readability
  vec3 bg = vec3(0.035, 0.055, 0.1); // darker than before
  vec3 result = mix(bg, color.rgb, color.a * 0.7); // dim the logo slightly

  // Scanlines
  result *= scanline(vUv, t);

  // Grain
  result += grain(vUv, t);

  // Stronger vignette for text readability in center
  float vig = 1.0 - 0.45 * length((vUv - 0.5) * vec2(1.4, 1.2));
  result *= vig;

  // Darken overall to push it further into background
  result *= 0.75;

  fragColor = vec4(result, 1.0);
}
