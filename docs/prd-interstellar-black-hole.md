# PRD: Interstellar Black Hole — Real-Time Browser Visualization

**Author:** Dominick Ardis
**Date:** 2026-03-27
**Status:** Draft

---

## 1. Vision

Build a scientifically grounded, visually stunning, real-time black hole visualization that runs entirely in a web browser — inspired by Gargantua from Christopher Nolan's *Interstellar*. The goal is to combine the physics pioneered by Kip Thorne and Double Negative's DNGR renderer with the latest browser APIs (WebGPU, Web Audio, WebXR) to create an experience that rivals film-quality VFX at interactive framerates.

---

## 2. Background & Prior Art

### 2.1 The Interstellar Standard

The 2014 film's black hole "Gargantua" was rendered by Double Negative using their custom DNGR (Double Negative Gravitational Renderer) code, developed in collaboration with theoretical physicist Kip Thorne. The foundational paper — *"Gravitational Lensing by Spinning Black Holes in Astrophysics, and in the Movie Interstellar"* (James, von Tunzelmann, Franklin, Thorne — arXiv:1502.03808) — describes ray-bundle propagation through Kerr (spinning) black hole spacetime. Their key innovation was tracing light *beams* rather than individual photon rays, which eliminated flickering at IMAX resolution and produced the iconic "rainbow of fire" accretion disk.

The result was scientifically validated by the Event Horizon Telescope's 2019 image of M87* and won the Academy Award for Visual Effects.

### 2.2 Existing Browser Implementations

The community has built increasingly sophisticated browser-based black holes over the past decade:

| Project | Tech | Physics Model | Key Feature |
|---|---|---|---|
| [sirxemic/Interstellar](https://sirxemic.github.io/Interstellar/) | Three.js / WebGL | Schwarzschild + wormhole | Interactive flight through wormhole and black hole |
| [oseiskar/black-hole](https://oseiskar.github.io/black-hole/) | Three.js / WebGL | Schwarzschild geodesics | GPU-accelerated ODE integration in GLSL |
| [Eric Bruneton's Black Hole Shader](https://ebruneton.github.io/black_hole_shader/) | WebGL2 | Schwarzschild + accretion disk | Beam tracing with precomputed tables, Doppler beaming |
| [Singularity](https://www.webgpu.com/showcase/singularity/) | Three.js TSL / WebGPU | Kerr (ray marched) | First WebGPU black hole, glowing accretion disk |
| [steeltroops-ai/blackhole-simulation](https://github.com/steeltroops-ai/blackhole-simulation) | Next.js / WebGPU / Rust WASM | Kerr | 2M+ geodesics/frame at 120Hz, subgroup operations |
| [SushantGagneja/Black-Hole-simulation](https://github.com/SushantGagneja/Black-Hole-simulation) | WebGL / GLSL | Kerr with frame dragging | Doppler beaming, volumetric accretion |
| [Black Hole Vision (iOS)](https://news.ycombinator.com/item?id=42185668) | Metal / GPU | Kerr | Live camera feed with gravitational lensing overlay |
| [ESA ACT WebGL](https://www.esa.int/gsp/ACT/phy/Projects/Blackholes/WebGL/) | WebGL | Schwarzschild | European Space Agency educational tool |

**Shadertoy references:** [Gargantua With HDR Bloom](https://www.shadertoy.com/view/lstSRS), [Interstellar Black Hole](https://www.shadertoy.com/view/MctGWj), [Black hole with accretion disk](https://www.shadertoy.com/view/tsBXW3).

### 2.3 Academic Foundations

Key papers that inform the rendering approach:

- **James et al. (2015)** — DNGR ray-bundle method for Kerr black holes (arXiv:1502.03808)
- **James et al. (2015)** — Visualizing Interstellar's Wormhole (arXiv:1502.03809)
- **Chan et al. (2013)** — GRay: Massively parallel GPU ray tracing in relativistic spacetimes (arXiv:1303.5057) — achieved 1 ns/photon/step on CUDA, proving embarrassingly parallel geodesic tracing
- **Gralla, Holz & Wald (2019)** — Black hole shadows, photon rings, and lensing rings (arXiv:1906.00873)
- **Neural geodesics (2025)** — Learning null geodesics for gravitational lensing rendering (arXiv:2507.15775) — 15× speedup via neural approximation

---

## 3. Target Experience

A user opens the page and sees a slowly rotating Kerr black hole centered in a star field. The accretion disk glows asymmetrically — blue-shifted on the approaching side, red-shifted on the receding side. Stars behind the black hole are gravitationally lensed into arcs. The photon ring shimmers at the boundary of the shadow. The user can orbit the camera freely with mouse/touch, adjust black hole spin, toggle relativistic effects, and optionally enter VR.

### 3.1 Core Visual Effects

1. **Gravitational lensing** — background star field distorted by spacetime curvature, with Einstein ring visible at certain angles
2. **Black hole shadow** — dark silhouette roughly 2× the event horizon radius
3. **Photon ring** — thin bright ring at the critical curve, composed of self-similar subrings (primary, secondary, tertiary images)
4. **Accretion disk** — thin disk model with thermal emission, warped by spacetime into the characteristic "hat brim" shape visible above and below the black hole
5. **Doppler beaming** — approaching side of disk dramatically brighter and bluer; receding side dimmer and redder (brightness ∝ γ⁴)
6. **Gravitational redshift** — light climbing out of the gravity well shifts toward red, especially near the event horizon
7. **Frame dragging** — spacetime itself is dragged by the spinning black hole, creating asymmetric lensing patterns

### 3.2 Interactive Controls

- **Camera orbit** — mouse drag / touch to orbit around the black hole
- **Zoom** — scroll / pinch to adjust distance
- **Black hole spin (a)** — slider from 0 (Schwarzschild) to 0.998 (near-extremal Kerr)
- **Accretion disk toggle** — on/off, with temperature color scale
- **Effect toggles** — Doppler beaming, gravitational redshift, photon ring visibility
- **Time scale** — speed up or slow down disk rotation
- **Screenshot / video capture** — export current view or record a sequence

---

## 4. Technical Architecture

### 4.1 Rendering Pipeline

```
┌─────────────────────────────────────────────────┐
│                  WebGPU Compute                  │
│                                                  │
│  For each pixel:                                 │
│    1. Cast ray from camera through pixel          │
│    2. Integrate null geodesic (RK4) through       │
│       Kerr spacetime                              │
│    3. At each step:                               │
│       a. Check disk intersection → accumulate     │
│          emission with Doppler shift              │
│       b. Check event horizon → black              │
│       c. Check escape → sample star field texture │
│    4. Apply gravitational redshift                │
│    5. Tone-map to output color                    │
│                                                  │
│  Output: HDR framebuffer                          │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│               WebGPU Fragment Pass                │
│                                                  │
│  1. Bloom / glow post-processing                  │
│  2. Tone mapping (HDR → display gamut)            │
│  3. Optional chromatic aberration                 │
│  4. Output to canvas                              │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              Presentation Layer                    │
│                                                  │
│  Canvas → screen (or WebXR framebuffer)           │
│  Web Audio spatial audio synchronized to camera   │
│  WebCodecs recording pipeline (optional)          │
└─────────────────────────────────────────────────┘
```

### 4.2 Physics Engine (Compute Shader)

**Metric:** Kerr metric in Boyer-Lindquist coordinates (r, θ, φ, t) with spin parameter `a`.

**Geodesic integration:** 4th-order Runge-Kutta (RK4) integration of eight coupled first-order ODEs derived from the Kerr null geodesic equations. The four constants of motion (energy E, angular momentum Lz, Carter constant Q, rest mass μ=0 for photons) constrain the system and make it fully integrable.

**Adaptive step sizing:** Step size proportional to distance from the event horizon — fine steps in strongly curved regions near the photon sphere, coarse steps in flat space far from the hole. This is the single most important optimization for performance.

**Early termination:** Rays that cross the event horizon (r < r+) terminate as black. Rays that escape beyond a configurable outer boundary sample the star field cubemap.

**Accretion disk intersection:** At each integration step, check if the ray crosses the equatorial plane (θ = π/2). When it does, compute the local disk temperature from the Shakura-Sunyaev thin disk model (T ∝ r^(-3/4)), apply Doppler beaming based on the local orbital velocity, and accumulate emission along the ray.

### 4.3 Web API Stack

| Layer | API | Purpose | Browser Support |
|---|---|---|---|
| **GPU Compute** | WebGPU (WGSL compute shaders) | Geodesic integration, ray marching, disk intersection | Chrome, Firefox, Safari, Edge (all shipped as of late 2025) |
| **Rendering** | WebGPU render pipeline | Fragment post-processing, bloom, tone mapping | Same as above |
| **Fallback** | WebGL2 + GLSL | Graceful degradation for older hardware | Universal |
| **Threading** | OffscreenCanvas + Web Workers | Move GPU command submission off main thread | Widely supported |
| **Shared Memory** | SharedArrayBuffer | Multi-threaded geometry prep between workers | Requires COOP/COEP headers |
| **Animation** | requestAnimationFrame | Frame-synced render loop | Universal |
| **Audio** | Web Audio API (PannerNode, HRTF) | Spatial audio — Doppler-shifted hum, gravitational rumble | Universal |
| **Color** | CSS Color Level 4 (display-p3) + HDR framebuffer | Wide gamut rendering for extreme brightness range | Chrome full support; growing elsewhere |
| **Recording** | WebCodecs + mp4-muxer | Client-side 4K video capture, 10× faster than MediaRecorder | Chrome, Edge; growing |
| **Immersion** | WebXR Device API | VR headset support (Quest, Vision Pro) | Chrome, Edge, Firefox; Safari on visionOS |

### 4.4 Performance Targets

| Metric | Target | Stretch |
|---|---|---|
| Resolution | 1080p | 1440p / 4K |
| Frame rate | 60 FPS | 120 FPS |
| Geodesic steps/ray | 200–500 | Up to 2000 near photon sphere |
| Total rays/frame | ~2M (1080p) | ~8M (4K) |
| Time to first frame | < 2 seconds | < 1 second |
| GPU memory | < 256 MB | < 128 MB |
| Bundle size | < 500 KB gzipped | < 200 KB gzipped |

### 4.5 Performance Optimization Strategies

1. **Adaptive step sizing** — proportional to spacetime curvature; fewer steps in flat space
2. **Early ray termination** — stop tracing rays that hit the event horizon or escape to infinity
3. **Two-pass rendering** — compute geodesics at half resolution, then upscale with bilateral filter (SpaceEngine technique)
4. **Subgroup operations** — leverage WebGPU subgroup features for warp-level optimization on compatible hardware
5. **Precomputed lookup tables** — cache trigonometric and elliptic function values
6. **Blue noise dithering** — reduce banding in volumetric disk sampling with perceptually optimal noise
7. **Temporal reprojection** — reuse previous frame's geodesic data for pixels that haven't moved much

---

## 5. Feature Tiers

### Tier 1 — MVP (Weeks 1–3)

- Schwarzschild (non-rotating) black hole with gravitational lensing
- Static star field cubemap background
- Thin accretion disk with basic thermal emission coloring
- Mouse/touch camera orbit and zoom
- WebGPU compute shader geodesic integration (RK4)
- WebGL2 fallback path
- 60 FPS at 1080p on mid-range GPU

### Tier 2 — Kerr Physics (Weeks 4–6)

- Upgrade to full Kerr metric with spin parameter slider
- Doppler beaming (asymmetric disk brightness)
- Gravitational redshift
- Frame dragging visual effects
- Photon ring with primary + secondary images
- Adaptive step sizing for performance
- Interactive effect toggles

### Tier 3 — Polish & Immersion (Weeks 7–9)

- HDR rendering with bloom and tone mapping
- Spatial audio (gravitational hum with Doppler shift as camera moves)
- WebCodecs video recording (export MP4)
- Screenshot export (PNG with wide gamut)
- Performance dashboard (FPS, rays/frame, GPU utilization)
- Mobile touch optimization
- Two-pass rendering for 4K support

### Tier 4 — Stretch Goals

- WebXR VR mode (immersive-vr session)
- Volumetric accretion disk (replace thin disk with ray-marched volume)
- Multiple black hole merger visualization
- Neural geodesic approximation for 2× performance boost
- Live camera feed background (à la Black Hole Vision iOS app)
- Educational mode with annotations explaining each physical effect
- Wormhole traversal (per sirxemic's Interstellar demo)

---

## 6. Tech Stack Recommendation

```
Runtime:         Browser (no server required — fully client-side)
GPU API:         WebGPU primary, WebGL2 fallback
Shading:         WGSL (WebGPU Shading Language)
3D Framework:    Three.js r171+ (WebGPU renderer with TSL)
                 OR raw WebGPU for maximum control
UI:              Vanilla HTML/CSS overlays, or lightweight framework
Audio:           Web Audio API (native)
Recording:       WebCodecs + mp4-muxer
VR:              WebXR via Three.js VRButton
Build:           Vite, TypeScript
Testing:         Visual regression with Playwright screenshots
```

**Why Three.js TSL?** Three.js r171+ ships a production-ready WebGPU backend with TSL (Three.js Shading Language), which compiles to WGSL. This gives us the ecosystem benefits of Three.js (camera controls, texture loading, VR support) while accessing WebGPU compute. The "Singularity" demo already proves this stack works for black hole rendering.

**Why not raw WebGPU?** Raw WebGPU gives more control but requires building camera systems, texture management, and VR integration from scratch. Three.js TSL is the pragmatic choice unless we hit a specific limitation.

---

## 7. Key Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| WebGPU not available on user's device | Low (shipped in all major browsers) | High | WebGL2 fallback path with simplified physics |
| Numerical instability near event horizon | Medium | Medium | Adaptive stepping + Kerr-Schild coordinates for regularization |
| Low FPS on integrated GPUs | Medium | High | Two-pass half-res geodesics, quality presets (Low/Med/High) |
| Accretion disk banding artifacts | Medium | Low | Blue noise dithering + temporal accumulation |
| Mobile GPU thermal throttling | High | Medium | Aggressive quality scaling, frame budget monitoring |
| Large bundle size from shader code | Low | Low | Tree-shaking, lazy-load advanced features |

---

## 8. Success Metrics

- **Visual fidelity:** Side-by-side comparison with Interstellar's Gargantua shows recognizable lensing patterns, asymmetric disk, and photon ring
- **Performance:** 60 FPS sustained at 1080p on a 2023+ laptop with discrete GPU
- **Accessibility:** Runs on 90%+ of browsers visiting the page (WebGPU + WebGL2 fallback)
- **Engagement:** Average session duration > 2 minutes (users explore, don't bounce)
- **Sharing:** Video/screenshot export used by > 10% of visitors

---

## 9. Research Sources

### Papers
- James, von Tunzelmann, Franklin, Thorne — [Gravitational Lensing by Spinning Black Holes (arXiv:1502.03808)](https://arxiv.org/abs/1502.03808)
- James et al. — [Visualizing Interstellar's Wormhole (arXiv:1502.03809)](https://arxiv.org/abs/1502.03809)
- Chan et al. — [GRay: GPU Ray Tracing in Relativistic Spacetimes (arXiv:1303.5057)](https://arxiv.org/abs/1303.5057)
- Gralla, Holz, Wald — [Black Hole Shadows, Photon Rings, and Lensing Rings (arXiv:1906.00873)](https://arxiv.org/abs/1906.00873)
- Neural Geodesics — [Learning Null Geodesics for Gravitational Lensing (arXiv:2507.15775)](https://arxiv.org/html/2507.15775v1)

### Implementations & Demos
- [Singularity (WebGPU)](https://www.webgpu.com/showcase/singularity/)
- [steeltroops-ai/blackhole-simulation](https://github.com/steeltroops-ai/blackhole-simulation) — 2M+ geodesics/frame
- [Eric Bruneton's Black Hole Shader](https://ebruneton.github.io/black_hole_shader/)
- [sirxemic/Interstellar](https://sirxemic.github.io/Interstellar/)
- [oseiskar/black-hole](https://oseiskar.github.io/black-hole/)
- [SushantGagneja/Black-Hole-simulation](https://github.com/SushantGagneja/Black-Hole-simulation)
- [Raytracing a Black Hole with WebGPU (Three.js Roadmap)](https://threejsroadmap.com/blog/raytracing-a-black-hole-with-webgpu)

### Shadertoy
- [Gargantua With HDR Bloom](https://www.shadertoy.com/view/lstSRS)
- [Interstellar Black Hole](https://www.shadertoy.com/view/MctGWj)
- [Black Hole with Accretion Disk](https://www.shadertoy.com/view/tsBXW3)

### Hacker News Discussions
- [Show HN: Black-hole.js](https://news.ycombinator.com/item?id=9362509)
- [Show HN: Physically Accurate Black Hole on iPhone](https://news.ycombinator.com/item?id=42185668)
- [Black Hole Visualization in UE](https://news.ycombinator.com/item?id=24773546)

### Web API References
- [WebGPU Fundamentals](https://webgpufundamentals.org/)
- [WebGPU Hits Critical Mass (All Major Browsers)](https://www.webgpu.com/news/webgpu-hits-critical-mass-all-major-browsers/)
- [CSS Color HDR Module Level 1](https://drafts.csswg.org/css-color-hdr/)
- [WebCodecs Canvas Recording](https://devtails.xyz/adam/how-to-save-html-canvas-to-mp4-using-web-codecs-api)
- [WebXR Device API](https://immersiveweb.dev/)

---

*This PRD was synthesized from research across Hacker News, Reddit, academic papers, and browser API documentation. The technical approach is proven — multiple implementations exist at varying fidelity levels. The opportunity is to combine the best physics (Kerr metric from the Interstellar papers) with the best web technology (WebGPU compute, now universally available) into a single polished experience.*
