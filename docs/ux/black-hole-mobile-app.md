# Black Hole Mobile App UX Frame

Date: 2026-03-27

## User Goal

Let someone open the site on a phone and immediately explore a cinematic, Interstellar-inspired black hole scene with touch controls, visible renderer quality when WebGPU is available, and a fallback that still feels intentional when it is not.

## Platform And Surface

- Platform: mobile-first web SPA
- Surface: public full-screen media view at `/`
- Secondary navigation: optional links into auth and the protected dashboard

## Primary Flow

1. Open the public landing route.
2. See renderer status while the scene chooses WebGPU or fallback mode.
3. Drag to orbit the camera around the black hole.
4. Adjust lensing, camera distance, and cow orbit with thumb-friendly controls.
5. Continue into the dashboard only if needed.

## Input Modes

- Touch drag on the scene for orbiting
- Pointer drag on larger screens
- Keyboard arrow keys and Home on the focused scene for non-pointer access
- Labeled sliders and buttons so gestures are optional

## Canonical States

- Initializing: determine whether WebGPU can run
- WebGPU active: ray-traced scene is available
- Fallback active: canvas renderer takes over with an explicit status message
- Reduced motion: slow ambient movement and keep controls usable
- Unsupported or degraded graphics: keep the scene readable instead of failing blank

## Platform Conventions To Preserve

- One-thumb interaction should work without hover
- Controls should live in a bottom panel on narrow screens
- Primary content stays visible while controls are present
- The page should remain useful even when GPU features are missing

## Accessibility Baseline

- Focusable scene region with keyboard orbit shortcuts
- Text labels for renderer status and every control
- Touch targets sized for phones
- Contrast high enough over bright scene content
- Reduced-motion preference respected by slowing passive drift
- A non-gesture path for all major adjustments

## Motion And Feedback

- Soft camera drift only when motion settings allow it
- Renderer status visible at a glance
- Pointer and keyboard input should update the scene immediately
- The fallback renderer should keep the same green black hole and cow concept so the mode switch is not jarring
