import { resolveAnimatedScene } from "./scene-state";
import type { RendererHandle, SceneSnapshotSource } from "./types";

const TAU = Math.PI * 2;

interface CanvasMetrics {
  height: number;
  width: number;
}

export function createCanvasFallbackRenderer(
  canvas: HTMLCanvasElement,
  getSnapshot: SceneSnapshotSource,
): RendererHandle {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D fallback could not start.");
  }

  let animationFrameId = 0;
  let disposed = false;
  let metrics = resizeCanvas(canvas, context);
  let resizeObserver: ResizeObserver | null = null;

  const render = (now: number) => {
    if (disposed) {
      return;
    }

    const snapshot = getSnapshot();
    const animated = resolveAnimatedScene(snapshot, now / 1000);
    const { width, height } = metrics;
    const centerX = width * 0.5 + animated.yaw * width * 0.045;
    const centerY = height * 0.48 - animated.pitch * height * 0.055;
    const radius = Math.min(width, height) * (0.105 + snapshot.zoom * 0.06);
    const tilt = 0.44 + animated.pitch * 0.12;

    context.clearRect(0, 0, width, height);

    drawBackground(context, width, height, animated.sceneTime);
    drawStars(
      context,
      width,
      height,
      animated.sceneTime,
      animated.yaw,
      animated.pitch,
    );

    context.save();
    context.translate(centerX, centerY);

    const cowAngle = animated.cowPhase * 0.55 + 0.95;
    const cowX = Math.cos(cowAngle) * radius * 2.3;
    const cowY = Math.sin(cowAngle) * radius * tilt * 1.25;
    const cowDepth = Math.sin(cowAngle);
    const cowScale = 0.5 + (cowDepth + 1) * 0.18;
    const lensWarp =
      1 + Math.max(0, 1.5 - Math.hypot(cowX, cowY) / (radius * 2.4)) * 0.06;

    drawHalo(context, radius, snapshot.lensingScalar);
    drawDisk(context, radius, tilt, animated.sceneTime, false);

    if (cowDepth < 0) {
      drawCow(
        context,
        cowX,
        cowY,
        cowScale,
        cowDepth,
        lensWarp,
        snapshot.lensingStrength,
      );
    }

    drawEventHorizon(context, radius);
    drawDisk(context, radius, tilt, animated.sceneTime, true);

    if (cowDepth >= 0) {
      drawCow(
        context,
        cowX,
        cowY,
        cowScale,
        cowDepth,
        lensWarp,
        snapshot.lensingStrength,
      );
    }

    context.restore();
    animationFrameId = window.requestAnimationFrame(render);
  };

  const handleResize = () => {
    metrics = resizeCanvas(canvas, context);
  };

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
  }

  window.addEventListener("resize", handleResize);
  animationFrameId = window.requestAnimationFrame(render);

  return {
    dispose: () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    },
  };
}

function resizeCanvas(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
): CanvasMetrics {
  const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(canvas.clientWidth * devicePixelRatio));
  const height = Math.max(
    1,
    Math.floor(canvas.clientHeight * devicePixelRatio),
  );

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  return {
    width: width / devicePixelRatio,
    height: height / devicePixelRatio,
  };
}

function drawBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  const gradient = context.createRadialGradient(
    width * 0.5,
    height * 0.44,
    0,
    width * 0.5,
    height * 0.44,
    Math.max(width, height) * 0.7,
  );
  gradient.addColorStop(0, "rgba(18, 76, 42, 0.22)");
  gradient.addColorStop(0.4, "rgba(6, 22, 12, 0.3)");
  gradient.addColorStop(1, "rgba(1, 6, 4, 1)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.12;
  context.strokeStyle = "rgba(104, 255, 164, 0.16)";
  context.lineWidth = 1;

  for (let x = 0; x <= width; x += 48) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let y = 0; y <= height; y += 48) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.restore();

  context.save();
  context.globalAlpha = 0.22;
  context.fillStyle = "rgba(32, 132, 77, 0.08)";

  for (let index = 0; index < 8; index += 1) {
    const x = ((index + 1) / 9) * width;
    const y =
      height * 0.15 + Math.sin(time * 0.2 + index * 1.2) * (height * 0.05);
    context.beginPath();
    context.ellipse(x, y, width * 0.1, height * 0.02, 0, 0, TAU);
    context.fill();
  }

  context.restore();
}

function drawStars(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  yaw: number,
  pitch: number,
) {
  context.save();

  for (let index = 0; index < 90; index += 1) {
    const seed = index * 12.9898;
    const x =
      (Math.sin(seed * 1.37) + 1) * 0.5 * width + yaw * 12 * (index % 4);
    const y =
      (Math.sin(seed * 3.41 + 1.6) + 1) * 0.5 * height +
      pitch * 9 * (index % 3);
    const twinkle = 0.45 + 0.55 * Math.sin(time * 1.5 + index * 0.72);
    const radius = 0.6 + twinkle * 1.4;

    context.beginPath();
    context.fillStyle = `rgba(181, 255, 215, ${0.18 + twinkle * 0.6})`;
    context.arc(x, y, radius, 0, TAU);
    context.fill();
  }

  context.restore();
}

function drawHalo(
  context: CanvasRenderingContext2D,
  radius: number,
  lensingScalar: number,
) {
  context.save();
  context.filter = "blur(22px)";

  const glow = context.createRadialGradient(
    0,
    0,
    radius * 0.8,
    0,
    0,
    radius * 3.4,
  );
  glow.addColorStop(0, "rgba(9, 41, 20, 0.72)");
  glow.addColorStop(0.38, "rgba(62, 224, 122, 0.2)");
  glow.addColorStop(0.7, "rgba(19, 88, 49, 0.08)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");

  context.fillStyle = glow;
  context.beginPath();
  context.arc(0, 0, radius * (3.2 + lensingScalar * 0.2), 0, TAU);
  context.fill();
  context.restore();
}

function drawDisk(
  context: CanvasRenderingContext2D,
  radius: number,
  tilt: number,
  time: number,
  front: boolean,
) {
  const start = front ? 0.08 : Math.PI + 0.08;
  const end = front ? Math.PI - 0.08 : TAU - 0.08;

  context.save();
  context.filter = `blur(${front ? 12 : 18}px)`;
  context.globalCompositeOperation = "lighter";

  for (let layer = 0; layer < 14; layer += 1) {
    const pulse = 1 + Math.sin(time * 1.6 + layer * 0.55) * 0.05;
    const horizontal = radius * (1.62 + layer * 0.085) * pulse;
    const vertical = radius * (tilt + layer * 0.028);

    context.beginPath();
    context.ellipse(
      0,
      0,
      horizontal,
      vertical,
      Math.sin(time * 0.12 + layer * 0.08) * 0.03,
      start,
      end,
    );
    context.strokeStyle = front
      ? `rgba(112, 255, 178, ${0.045 + layer * 0.0035})`
      : `rgba(81, 214, 138, ${0.03 + layer * 0.0025})`;
    context.lineWidth = radius * (0.16 - layer * 0.006);
    context.stroke();
  }

  context.restore();
}

function drawEventHorizon(context: CanvasRenderingContext2D, radius: number) {
  context.save();

  const ring = context.createRadialGradient(
    0,
    0,
    radius * 0.88,
    0,
    0,
    radius * 1.36,
  );
  ring.addColorStop(0, "rgba(0, 0, 0, 0)");
  ring.addColorStop(0.42, "rgba(23, 112, 57, 0.18)");
  ring.addColorStop(0.58, "rgba(111, 255, 173, 0.26)");
  ring.addColorStop(1, "rgba(0, 0, 0, 0)");

  context.fillStyle = ring;
  context.beginPath();
  context.arc(0, 0, radius * 1.36, 0, TAU);
  context.fill();

  context.fillStyle = "#010302";
  context.beginPath();
  context.arc(0, 0, radius, 0, TAU);
  context.fill();

  context.restore();
}

function drawCow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  depth: number,
  lensWarp: number,
  lensingStrength: number,
) {
  context.save();
  context.translate(x, y);
  context.rotate(depth * 0.12);
  context.scale(scale * lensWarp, scale / lensWarp);
  context.globalAlpha = 0.4 + (depth + 1) * 0.22;
  context.lineWidth = 2;
  context.strokeStyle = "rgba(10, 24, 15, 0.95)";

  context.fillStyle = "#f4f8ec";
  context.beginPath();
  context.ellipse(0, 0, 26, 15, 0, 0, TAU);
  context.fill();
  context.stroke();

  context.fillStyle = "#111713";
  context.beginPath();
  context.ellipse(-8, -2, 8, 5, 0.28, 0, TAU);
  context.fill();
  context.beginPath();
  context.ellipse(6, 3, 9, 5, -0.22, 0, TAU);
  context.fill();

  context.fillStyle = "#f4f8ec";
  context.beginPath();
  context.ellipse(27, -1, 11, 9, 0, 0, TAU);
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(31, -8);
  context.lineTo(37, -15);
  context.lineTo(34, -6);
  context.closePath();
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(22, -8);
  context.lineTo(16, -15);
  context.lineTo(20, -6);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "#112317";
  context.beginPath();
  context.arc(31, -1, 1.6, 0, TAU);
  context.fill();

  context.strokeStyle = "#111713";
  context.lineCap = "round";

  for (const legX of [-14, -4, 8, 18]) {
    context.beginPath();
    context.moveTo(legX, 10);
    context.lineTo(legX, 28);
    context.stroke();
  }

  context.beginPath();
  context.moveTo(-25, -3);
  context.quadraticCurveTo(-34, -14, -36, 0);
  context.stroke();

  if (Math.abs(x) < 72) {
    context.save();
    context.globalAlpha = 0.1 + lensingStrength * 0.08;
    context.translate(-x * 0.18, y * 0.28);
    context.scale(0.72, 0.56);
    context.fillStyle = "rgba(226, 255, 234, 0.4)";
    context.beginPath();
    context.ellipse(0, 0, 26, 15, 0, 0, TAU);
    context.fill();
    context.restore();
  }

  context.restore();
}
