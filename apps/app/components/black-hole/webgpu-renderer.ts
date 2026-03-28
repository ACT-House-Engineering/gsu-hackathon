import { resolveAnimatedScene } from "./scene-state";
import type { RendererHandle, SceneSnapshotSource } from "./types";

const UNIFORM_FLOATS = 16;
const UNIFORM_BYTES = UNIFORM_FLOATS * Float32Array.BYTES_PER_ELEMENT;

export async function createWebGpuRenderer(
  canvas: HTMLCanvasElement,
  getSnapshot: SceneSnapshotSource,
  onFallback: (reason: string) => void,
): Promise<RendererHandle> {
  if (!("gpu" in navigator) || !navigator.gpu) {
    throw new Error("WebGPU is unavailable in this browser.");
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No compatible GPU adapter was found.");
  }

  const device = await adapter.requestDevice();
  const context = canvas.getContext("webgpu");
  if (!context) {
    throw new Error("The WebGPU canvas context could not be created.");
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  const shaderModule = device.createShaderModule({
    code: shaderSource,
  });
  const uniformBuffer = device.createBuffer({
    size: UNIFORM_BYTES,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
  });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs",
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs",
      targets: [{ format }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
  });

  let animationFrameId = 0;
  let disposed = false;
  let configuredHeight = 0;
  let configuredWidth = 0;
  let resizeObserver: ResizeObserver | null = null;

  const configureContext = () => {
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(
      1,
      Math.floor(canvas.clientWidth * devicePixelRatio),
    );
    const height = Math.max(
      1,
      Math.floor(canvas.clientHeight * devicePixelRatio),
    );

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    if (configuredWidth !== width || configuredHeight !== height) {
      configuredWidth = width;
      configuredHeight = height;

      context.configure({
        device,
        format,
        alphaMode: "opaque",
      });
    }
  };

  const render = (now: number) => {
    if (disposed) {
      return;
    }

    configureContext();

    const snapshot = getSnapshot();
    const animated = resolveAnimatedScene(snapshot, now / 1000);
    const uniforms = new Float32Array(UNIFORM_FLOATS);

    uniforms[0] = canvas.width;
    uniforms[1] = canvas.height;
    uniforms[2] = canvas.width / canvas.height;
    uniforms[3] = Math.min(window.devicePixelRatio || 1, 2);

    uniforms[4] = animated.sceneTime;
    uniforms[5] = snapshot.lensingScalar;
    uniforms[6] = snapshot.diskVelocity;
    uniforms[7] = snapshot.cameraDistance;

    uniforms[8] = animated.yaw;
    uniforms[9] = animated.pitch;
    uniforms[10] = animated.cowPhase;
    uniforms[11] = 0;

    uniforms[12] = snapshot.reducedMotion ? 1 : 0;
    uniforms[13] = 0;
    uniforms[14] = 0;
    uniforms[15] = 0;

    device.queue.writeBuffer(uniformBuffer, 0, uniforms);

    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0.01, g: 0.03, b: 0.02, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    renderPass.setPipeline(pipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(3);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
    animationFrameId = window.requestAnimationFrame(render);
  };

  const handleResize = () => {
    configureContext();
  };

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);
  }

  window.addEventListener("resize", handleResize);
  configureContext();
  animationFrameId = window.requestAnimationFrame(render);

  device.lost.then((info) => {
    if (!disposed) {
      onFallback(
        info.message ||
          "The GPU device was lost, so the canvas fallback took over.",
      );
    }
  });

  return {
    dispose: () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
      uniformBuffer.destroy();
    },
  };
}

const shaderSource = /* wgsl */ `
struct Uniforms {
  viewport: vec4f,
  scene: vec4f,
  orbit: vec4f,
  flags: vec4f,
}

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

const PI: f32 = 3.14159265359;

@vertex
fn vs(@builtin(vertex_index) vertex_index: u32) -> @builtin(position) vec4f {
  var positions = array<vec2f, 3>(
    vec2f(-1.0, -3.0),
    vec2f(-1.0, 1.0),
    vec2f(3.0, 1.0),
  );

  let position = positions[vertex_index];
  return vec4f(position, 0.0, 1.0);
}

fn rotate_y(vector: vec3f, angle: f32) -> vec3f {
  let sine = sin(angle);
  let cosine = cos(angle);

  return vec3f(
    vector.x * cosine - vector.z * sine,
    vector.y,
    vector.x * sine + vector.z * cosine,
  );
}

fn rotate_x(vector: vec3f, angle: f32) -> vec3f {
  let sine = sin(angle);
  let cosine = cos(angle);

  return vec3f(
    vector.x,
    vector.y * cosine - vector.z * sine,
    vector.y * sine + vector.z * cosine,
  );
}

fn hash21(point: vec2f) -> f32 {
  return fract(sin(dot(point, vec2f(127.1, 311.7))) * 43758.5453123);
}

fn star_field(direction: vec3f, time: f32) -> vec3f {
  let sphere = vec2f(
    atan2(direction.z, direction.x) / (2.0 * PI),
    asin(clamp(direction.y, -1.0, 1.0)) / PI,
  );

  let cloud = 0.5 + 0.5 * sin(sphere.x * 8.0 + sphere.y * 13.0);
  var color = mix(
    vec3f(0.01, 0.03, 0.02),
    vec3f(0.03, 0.18, 0.1),
    cloud,
  ) * 0.62;

  let tiled = sphere * vec2f(240.0, 120.0);
  let cell = floor(tiled);
  let local = fract(tiled) - 0.5;
  let seed = hash21(cell);
  let offset = vec2f(
    hash21(cell + vec2f(1.7, 9.2)) - 0.5,
    hash21(cell + vec2f(8.3, 2.8)) - 0.5,
  ) * 0.7;
  let distance_to_star = length(local - offset);
  let twinkle = 0.62 + 0.38 * sin(time * 1.7 + seed * 6.28318);
  let star = smoothstep(0.08, 0.0, distance_to_star) * step(0.985, seed) * twinkle;

  color += vec3f(0.46, 1.0, 0.78) * star * 3.2;
  return color;
}

fn disk_emission(position: vec3f, time: f32, disk_velocity: f32) -> vec3f {
  let radius = length(position.xz);
  let height = abs(position.y);
  let band = exp(-height * 18.0)
    * smoothstep(1.15, 1.9, radius)
    * (1.0 - smoothstep(3.25, 4.65, radius));
  let angle = atan2(position.z, position.x);
  let spiral = 0.5 + 0.5 * sin(angle * 14.0 - time * disk_velocity * 2.6 + radius * 10.0);
  let sparks = pow(max(0.0, sin(angle * 26.0 + time * disk_velocity * 1.8 - radius * 14.0)), 8.0);
  let intensity = band * (0.24 + spiral * 0.72 + sparks * 0.92);

  return mix(
    vec3f(0.02, 0.16, 0.07),
    vec3f(0.14, 1.3, 0.62),
    spiral,
  ) * intensity * 0.028;
}

fn sd_sphere(position: vec3f, radius: f32) -> f32 {
  return length(position) - radius;
}

fn sd_capsule(position: vec3f, a: vec3f, b: vec3f, radius: f32) -> f32 {
  let pa = position - a;
  let ba = b - a;
  let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);

  return length(pa - ba * h) - radius;
}

fn sd_ellipsoid(position: vec3f, radii: vec3f) -> f32 {
  let k0 = length(position / radii);
  let k1 = length(position / (radii * radii));

  return k0 * (k0 - 1.0) / k1;
}

fn cow_sdf(position: vec3f) -> f32 {
  let body = sd_ellipsoid(position, vec3f(0.42, 0.22, 0.2));
  let head = sd_ellipsoid(position - vec3f(0.46, 0.08, 0.0), vec3f(0.18, 0.14, 0.13));
  let leg_a = sd_capsule(position, vec3f(-0.18, -0.08, -0.1), vec3f(-0.18, -0.42, -0.1), 0.05);
  let leg_b = sd_capsule(position, vec3f(-0.03, -0.08, 0.08), vec3f(-0.03, -0.42, 0.08), 0.05);
  let leg_c = sd_capsule(position, vec3f(0.14, -0.08, -0.08), vec3f(0.14, -0.42, -0.08), 0.05);
  let leg_d = sd_capsule(position, vec3f(0.28, -0.08, 0.08), vec3f(0.28, -0.42, 0.08), 0.05);
  let horn_a = sd_capsule(position, vec3f(0.57, 0.16, -0.08), vec3f(0.71, 0.28, -0.1), 0.02);
  let horn_b = sd_capsule(position, vec3f(0.57, 0.16, 0.08), vec3f(0.71, 0.28, 0.1), 0.02);
  let tail = sd_capsule(position, vec3f(-0.45, 0.02, 0.0), vec3f(-0.62, 0.28, 0.0), 0.018);

  var distance = min(body, head);
  distance = min(distance, leg_a);
  distance = min(distance, leg_b);
  distance = min(distance, leg_c);
  distance = min(distance, leg_d);
  distance = min(distance, horn_a);
  distance = min(distance, horn_b);
  distance = min(distance, tail);
  return distance;
}

@fragment
fn fs(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let resolution = uniforms.viewport.xy;
  let uv = vec2f(
    (position.x / resolution.x) * 2.0 - 1.0,
    1.0 - (position.y / resolution.y) * 2.0,
  );

  var ray = normalize(vec3f(
    uv.x * uniforms.viewport.z * 1.05,
    uv.y * 0.88,
    -1.55,
  ));
  ray = rotate_y(ray, uniforms.orbit.x);
  ray = rotate_x(ray, uniforms.orbit.y);

  var march_position = rotate_y(vec3f(0.0, 0.24, uniforms.scene.w), uniforms.orbit.x);
  march_position = rotate_x(march_position, uniforms.orbit.y);

  let cow_angle = uniforms.orbit.z * 0.55 + 0.95;
  let cow_center = vec3f(
    cos(cow_angle) * 3.4,
    0.18 + sin(uniforms.scene.x * 0.8) * 0.08,
    sin(cow_angle) * 3.4,
  );

  var color = vec3f(0.0);
  var transmittance = 1.0;

  for (var step_index = 0; step_index < 96; step_index = step_index + 1) {
    let radius = length(march_position);

    if (radius < 1.02) {
      let horizon_glow = exp(-abs(radius - 1.02) * 32.0);
      color += vec3f(0.04, 0.34, 0.16) * horizon_glow * 0.8;
      transmittance = 0.0;
      break;
    }

    color += disk_emission(march_position, uniforms.scene.x, uniforms.scene.z) * transmittance;

    let cow_local = rotate_y(march_position - cow_center, -cow_angle - 1.57);
    let cow_distance = cow_sdf(cow_local);

    if (cow_distance < 0.025) {
      let pattern = 0.5 + 0.5 * sin(cow_local.x * 18.0) * sin(cow_local.z * 22.0);
      let spots = step(0.72, pattern);
      let base_color = mix(
        vec3f(0.95, 0.98, 0.92),
        vec3f(0.08, 0.1, 0.09),
        spots,
      );
      let normal_hint = normalize(cow_local + vec3f(0.0001, 0.0001, 0.0001));
      let rim = pow(clamp(1.0 - abs(dot(normal_hint, ray)), 0.0, 1.0), 2.0);
      color = mix(color, base_color + vec3f(0.06, 0.28, 0.14) * rim, 0.94);
      transmittance = 0.0;
      break;
    }

    let gravity = uniforms.scene.y / max(radius * radius, 0.9);
    let axis = cross(normalize(march_position), vec3f(0.0, 1.0, 0.0));

    ray = normalize(
      ray - normalize(march_position) * gravity * 0.052 + axis * gravity * 0.01,
    );

    let advance = clamp(
      min(
        max(sd_sphere(march_position, 1.0), 0.0) * 0.45 + 0.02,
        abs(cow_distance) * 0.45 + 0.02,
      ),
      0.018,
      0.16,
    );

    march_position += ray * advance;
    transmittance *= 0.992;
  }

  color += star_field(ray, uniforms.scene.x) * transmittance;

  let halo = exp(-abs(length(uv) - 0.26) * 20.0) * 0.08;
  let vignette = smoothstep(1.55, 0.48, length(uv));
  color += vec3f(0.05, 0.45, 0.22) * halo;
  color *= vignette;
  color = color / (vec3f(1.0) + color);
  color = pow(color, vec3f(0.9));

  return vec4f(color, 1.0);
}
`;
