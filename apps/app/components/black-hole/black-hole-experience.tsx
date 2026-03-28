import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import "@/styles/black-hole.css";
import { createCanvasFallbackRenderer } from "./canvas-fallback-renderer";
import {
  clampUnit,
  createInitialSceneControls,
  createSceneSnapshot,
  nudgeOrbit,
  resetOrbit,
} from "./scene-state";
import type { RendererHandle } from "./types";
import { createWebGpuRenderer } from "./webgpu-renderer";

interface RendererStatus {
  detail: string;
  mode: "fallback" | "initializing" | "webgpu";
}

type DragState = {
  pointerId: number;
  x: number;
  y: number;
} | null;

export function BlackHoleExperience() {
  const gpuCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const controlsRef = useRef(createInitialSceneControls());
  const dragStateRef = useRef<DragState>(null);

  const [controls, setControls] = useState(() => createInitialSceneControls());
  const [rendererStatus, setRendererStatus] = useState<RendererStatus>({
    mode: "initializing",
    detail: "Checking whether WebGPU can drive the ray tracer.",
  });

  controlsRef.current = controls;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateMotionPreference = (matches: boolean) => {
      setControls((current) =>
        current.reducedMotion === matches
          ? current
          : {
              ...current,
              reducedMotion: matches,
            },
      );
    };

    updateMotionPreference(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      updateMotionPreference(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const gpuCanvas = gpuCanvasRef.current;
    const fallbackCanvas = fallbackCanvasRef.current;

    if (!gpuCanvas || !fallbackCanvas) {
      return;
    }

    let currentRenderer: RendererHandle | null = null;
    let fallbackRenderer: RendererHandle | null = null;
    let disposed = false;

    const getSnapshot = () => createSceneSnapshot(controlsRef.current);

    const ensureFallback = (reason: string) => {
      if (disposed) {
        return;
      }

      currentRenderer?.dispose();
      currentRenderer = null;
      setRendererStatus({
        mode: "fallback",
        detail: reason,
      });

      if (!fallbackRenderer) {
        fallbackRenderer = createCanvasFallbackRenderer(
          fallbackCanvas,
          getSnapshot,
        );
      }
    };

    const start = async () => {
      if (!("gpu" in navigator) || !navigator.gpu) {
        ensureFallback(
          "WebGPU is unavailable here, so the canvas fallback is active.",
        );
        return;
      }

      try {
        currentRenderer = await createWebGpuRenderer(
          gpuCanvas,
          getSnapshot,
          ensureFallback,
        );

        if (disposed) {
          currentRenderer.dispose();
          return;
        }

        setRendererStatus({
          mode: "webgpu",
          detail: "WebGPU ray tracer active.",
        });
      } catch (error) {
        ensureFallback(
          error instanceof Error
            ? error.message
            : "WebGPU could not start, so the canvas fallback is active.",
        );
      }
    };

    void start();

    return () => {
      disposed = true;
      currentRenderer?.dispose();
      fallbackRenderer?.dispose();
    };
  }, []);

  function updateLensing(value: string) {
    const next = clampUnit(Number.parseFloat(value));
    setControls((current) => ({
      ...current,
      lensingStrength: next,
    }));
  }

  function updateCowOrbit(value: string) {
    const next = clampUnit(Number.parseFloat(value));
    setControls((current) => ({
      ...current,
      cowOrbit: next,
    }));
  }

  function updateZoom(value: string) {
    const next = clampUnit(Number.parseFloat(value));
    setControls((current) => ({
      ...current,
      zoom: next,
    }));
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.x;
    const deltaY = event.clientY - dragState.y;

    dragStateRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };

    setControls((current) => nudgeOrbit(current, deltaX, deltaY));
  }

  function clearDragState() {
    dragStateRef.current = null;
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Home") {
      event.preventDefault();
      setControls((current) => resetOrbit(current));
      return;
    }

    let deltaX = 0;
    let deltaY = 0;

    switch (event.key) {
      case "ArrowLeft":
        deltaX = -20;
        break;
      case "ArrowRight":
        deltaX = 20;
        break;
      case "ArrowUp":
        deltaY = -20;
        break;
      case "ArrowDown":
        deltaY = 20;
        break;
      default:
        return;
    }

    event.preventDefault();
    setControls((current) => nudgeOrbit(current, deltaX, deltaY));
  }

  const statusLabel =
    rendererStatus.mode === "webgpu"
      ? "WebGPU Ray Tracer"
      : rendererStatus.mode === "fallback"
        ? "Canvas Fallback"
        : "Preparing Renderer";

  return (
    <div className="bh-app relative isolate min-h-svh overflow-hidden text-white">
      <div className="bh-grid absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(116,255,170,0.12),transparent_24%),radial-gradient(circle_at_center,rgba(8,30,17,0.8),transparent_64%)]"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-svh flex-col">
        <header className="px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="bh-panel max-w-2xl rounded-[2rem] p-5 sm:p-6">
              <p className="text-[0.68rem] uppercase tracking-[0.32em] text-emerald-100/72">
                Interstellar-Inspired / Cloudflare-Ready
              </p>
              <h1 className="bh-title mt-3 text-5xl sm:text-6xl lg:text-7xl">
                Green Gargantua
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50/78 sm:text-base">
                A mobile-first HTML5 black hole scene with WebGPU ray tracing, a
                graceful canvas fallback, and a cow that insists on orbiting the
                accretion disk.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs uppercase tracking-[0.24em]">
                <span className="bh-chip rounded-full px-3 py-2">
                  Touch Orbit
                </span>
                <span className="bh-chip rounded-full px-3 py-2">
                  Green Lensing
                </span>
                <span className="bh-chip rounded-full px-3 py-2">
                  Cow Included
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/login"
                className="bh-link rounded-full px-4 py-2 text-sm font-medium"
              >
                Log In
              </Link>
              <Link
                to="/dashboard"
                className="bh-link bh-link-primary rounded-full px-4 py-2 text-sm font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </header>

        <main className="relative flex flex-1">
          <p id="black-hole-help" className="sr-only">
            Drag on the scene or use the arrow keys to orbit the camera. Use the
            sliders to adjust lensing, cow orbit speed, and camera distance.
            Press Home to reset the view.
          </p>

          <button
            type="button"
            className="bh-stage absolute inset-0 w-full border-0 bg-transparent p-0 text-left outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-emerald-300"
            aria-describedby="black-hole-help"
            aria-label="Interactive green black hole scene"
            onKeyDown={handleKeyDown}
            onLostPointerCapture={clearDragState}
            onPointerCancel={clearDragState}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={clearDragState}
          >
            <canvas
              ref={gpuCanvasRef}
              className={`absolute inset-0 h-full w-full ${
                rendererStatus.mode === "fallback" ? "opacity-0" : "opacity-100"
              }`}
            />
            <canvas
              ref={fallbackCanvasRef}
              className={`absolute inset-0 h-full w-full ${
                rendererStatus.mode === "fallback" ? "opacity-100" : "opacity-0"
              }`}
            />
          </button>

          <div className="pointer-events-none absolute inset-x-4 top-4 sm:inset-x-6 sm:top-6">
            <div className="mx-auto flex max-w-7xl justify-end">
              <div className="bh-panel pointer-events-auto max-w-md rounded-[1.75rem] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.28em] text-emerald-100/72">
                      Renderer
                    </p>
                    <p className="mt-1 text-lg font-semibold text-emerald-50">
                      {statusLabel}
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-300/16 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-100/80">
                    {rendererStatus.mode}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-emerald-50/72">
                  {rendererStatus.detail}
                </p>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
            <div className="mx-auto max-w-7xl">
              <section className="bh-panel pointer-events-auto rounded-[2rem] p-5 sm:p-6">
                <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.32em] text-emerald-100/72">
                      Interaction
                    </p>
                    <p className="mt-3 text-base leading-7 text-emerald-50/84">
                      Drag the scene to orbit. Arrow keys work on the focused
                      canvas, and the controls stay reachable even if gestures
                      are off the table.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setControls((current) => ({
                            ...current,
                            autoOrbit: !current.autoOrbit,
                          }))
                        }
                        className="rounded-full border border-emerald-300/20 bg-emerald-400/8 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-400/16"
                        aria-pressed={controls.autoOrbit}
                      >
                        {controls.autoOrbit ? "Pause Drift" : "Resume Drift"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setControls((current) => resetOrbit(current))
                        }
                        className="rounded-full border border-emerald-300/20 bg-black/20 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-black/30"
                      >
                        Reset View
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="space-y-3">
                      <span className="block text-sm font-medium text-emerald-50">
                        Lensing
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={controls.lensingStrength}
                        onChange={(event) => updateLensing(event.target.value)}
                        className="bh-slider w-full"
                      />
                      <span className="block text-sm text-emerald-50/68">
                        Bend the rays harder around the horizon.
                      </span>
                    </label>

                    <label className="space-y-3">
                      <span className="block text-sm font-medium text-emerald-50">
                        Cow Orbit
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={controls.cowOrbit}
                        onChange={(event) => updateCowOrbit(event.target.value)}
                        className="bh-slider w-full"
                      />
                      <span className="block text-sm text-emerald-50/68">
                        Decide how urgently the cow circles the disk.
                      </span>
                    </label>

                    <label className="space-y-3">
                      <span className="block text-sm font-medium text-emerald-50">
                        Camera
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={controls.zoom}
                        onChange={(event) => updateZoom(event.target.value)}
                        className="bh-slider w-full"
                      />
                      <span className="block text-sm text-emerald-50/68">
                        Push toward the horizon or back away for context.
                      </span>
                    </label>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
