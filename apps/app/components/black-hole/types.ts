import type { SceneSnapshot } from "./scene-state";

export type SceneSnapshotSource = () => SceneSnapshot;

export interface RendererHandle {
  dispose: () => void;
}
