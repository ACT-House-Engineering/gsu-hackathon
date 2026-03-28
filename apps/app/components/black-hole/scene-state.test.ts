import { describe, expect, it } from "vitest";
import {
  clampUnit,
  createInitialSceneControls,
  createSceneSnapshot,
  nudgeOrbit,
  resetOrbit,
  resolveAnimatedScene,
} from "./scene-state";

describe("scene-state", () => {
  it("clamps slider values into a unit interval", () => {
    expect(clampUnit(-0.2)).toBe(0);
    expect(clampUnit(0.42)).toBe(0.42);
    expect(clampUnit(4)).toBe(1);
  });

  it("clamps orbit movement so the camera stays usable", () => {
    const initial = createInitialSceneControls();
    const nudged = nudgeOrbit(initial, 999, -999);

    expect(nudged.yaw).toBe(1.3);
    expect(nudged.pitch).toBe(-0.95);
  });

  it("restores the default view without dropping other controls", () => {
    const initial = createInitialSceneControls();
    const changed = {
      ...initial,
      lensingStrength: 0.2,
      zoom: 0.95,
      yaw: 0.8,
      pitch: 0.6,
    };

    expect(resetOrbit(changed)).toMatchObject({
      lensingStrength: 0.2,
      yaw: 0.18,
      pitch: -0.12,
      zoom: 0.42,
    });
  });

  it("derives animated values from the resolved scene snapshot", () => {
    const snapshot = createSceneSnapshot(createInitialSceneControls());
    const animated = resolveAnimatedScene(snapshot, 5);

    expect(animated.sceneTime).toBe(5);
    expect(animated.cowPhase).toBeGreaterThan(0);
    expect(animated.yaw).toBeGreaterThan(snapshot.yaw);
  });
});
