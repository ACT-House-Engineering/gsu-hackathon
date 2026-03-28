export interface SceneControls {
  lensingStrength: number;
  cowOrbit: number;
  zoom: number;
  yaw: number;
  pitch: number;
  autoOrbit: boolean;
  reducedMotion: boolean;
}

export interface SceneSnapshot extends SceneControls {
  cameraDistance: number;
  cowSpeed: number;
  diskVelocity: number;
  lensingScalar: number;
}

export interface AnimatedScene {
  cowPhase: number;
  pitch: number;
  sceneTime: number;
  yaw: number;
}

const DEFAULT_YAW = 0.18;
const DEFAULT_PITCH = -0.12;
const DEFAULT_ZOOM = 0.42;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function clampUnit(value: number) {
  return clamp(value, 0, 1);
}

export function createInitialSceneControls(): SceneControls {
  return {
    lensingStrength: 0.74,
    cowOrbit: 0.48,
    zoom: DEFAULT_ZOOM,
    yaw: DEFAULT_YAW,
    pitch: DEFAULT_PITCH,
    autoOrbit: true,
    reducedMotion: false,
  };
}

export function createSceneSnapshot(controls: SceneControls): SceneSnapshot {
  return {
    ...controls,
    cameraDistance: 5.8 - controls.zoom * 2.5,
    cowSpeed: 0.4 + controls.cowOrbit * 1.75,
    diskVelocity: 1.1 + controls.lensingStrength * 2,
    lensingScalar: 0.9 + controls.lensingStrength * 1.7,
  };
}

export function nudgeOrbit(
  controls: SceneControls,
  deltaX: number,
  deltaY: number,
): SceneControls {
  return {
    ...controls,
    yaw: clamp(controls.yaw + deltaX * 0.006, -1.3, 1.3),
    pitch: clamp(controls.pitch + deltaY * 0.006, -0.95, 0.95),
  };
}

export function resetOrbit(controls: SceneControls): SceneControls {
  return {
    ...controls,
    zoom: DEFAULT_ZOOM,
    yaw: DEFAULT_YAW,
    pitch: DEFAULT_PITCH,
  };
}

export function resolveAnimatedScene(
  snapshot: SceneSnapshot,
  elapsedSeconds: number,
): AnimatedScene {
  const timeScale = snapshot.reducedMotion ? 0.4 : 1;
  const driftScale = snapshot.autoOrbit ? timeScale : 0;

  return {
    cowPhase: elapsedSeconds * snapshot.cowSpeed * timeScale,
    pitch: snapshot.pitch + Math.sin(elapsedSeconds * 0.33) * 0.08 * driftScale,
    sceneTime: elapsedSeconds * timeScale,
    yaw: snapshot.yaw + elapsedSeconds * 0.12 * driftScale,
  };
}
