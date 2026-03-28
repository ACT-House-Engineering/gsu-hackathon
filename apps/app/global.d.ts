import * as React from "react";
import "vite/client";

declare global {
  interface ImportMetaEnv {
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_ORIGIN: string;
  }

  type GPUTextureFormat = string;

  interface GPU {
    getPreferredCanvasFormat(): GPUTextureFormat;
    requestAdapter(): Promise<GPUAdapter | null>;
  }

  interface GPUAdapter {
    requestDevice(): Promise<GPUDevice>;
  }

  interface GPUDevice {
    lost: Promise<GPUDeviceLostInfo>;
    queue: GPUQueue;
    createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
    createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
    createCommandEncoder(): GPUCommandEncoder;
    createRenderPipeline(
      descriptor: GPURenderPipelineDescriptor,
    ): GPURenderPipeline;
    createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
  }

  interface GPUDeviceLostInfo {
    message: string;
    reason?: string;
  }

  interface GPUQueue {
    submit(commandBuffers: GPUCommandBuffer[]): void;
    writeBuffer(
      buffer: GPUBuffer,
      bufferOffset: number,
      data: BufferSource,
    ): void;
  }

  interface GPUBuffer {
    destroy(): void;
  }

  interface GPUCommandBuffer {}

  interface GPUCommandEncoder {
    beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
    finish(): GPUCommandBuffer;
  }

  interface GPURenderPassEncoder {
    draw(vertexCount: number): void;
    end(): void;
    setBindGroup(index: number, bindGroup: GPUBindGroup): void;
    setPipeline(pipeline: GPURenderPipeline): void;
  }

  interface GPUShaderModule {}

  interface GPUBindGroup {}

  interface GPUBindGroupLayout {}

  interface GPUPipelineLayout {}

  interface GPURenderPipeline {
    getBindGroupLayout(index: number): GPUBindGroupLayout;
  }

  interface GPUTexture {
    createView(): GPUTextureView;
  }

  interface GPUTextureView {}

  interface GPUCanvasContext {
    configure(configuration: GPUCanvasConfiguration): void;
    getCurrentTexture(): GPUTexture;
  }

  interface GPUCanvasConfiguration {
    alphaMode: "opaque" | "premultiplied";
    device: GPUDevice;
    format: GPUTextureFormat;
  }

  interface GPUShaderModuleDescriptor {
    code: string;
  }

  interface GPUBufferDescriptor {
    size: number;
    usage: number;
  }

  interface GPUBindGroupDescriptor {
    entries: GPUBindGroupEntry[];
    layout: GPUBindGroupLayout;
  }

  interface GPUBindGroupEntry {
    binding: number;
    resource: {
      buffer: GPUBuffer;
    };
  }

  interface GPURenderPipelineDescriptor {
    fragment: {
      entryPoint: string;
      module: GPUShaderModule;
      targets: GPUColorTargetState[];
    };
    layout: GPUPipelineLayout | "auto";
    primitive: {
      topology: string;
    };
    vertex: {
      entryPoint: string;
      module: GPUShaderModule;
    };
  }

  interface GPUColorTargetState {
    format: GPUTextureFormat;
  }

  interface GPURenderPassDescriptor {
    colorAttachments: GPURenderPassColorAttachment[];
  }

  interface GPURenderPassColorAttachment {
    clearValue: GPUColor;
    loadOp: "clear" | "load";
    storeOp: "discard" | "store";
    view: GPUTextureView;
  }

  interface GPUColor {
    a: number;
    b: number;
    g: number;
    r: number;
  }

  interface Navigator {
    gpu?: GPU;
  }

  interface HTMLCanvasElement {
    getContext(contextId: "webgpu"): GPUCanvasContext | null;
  }

  const GPUBufferUsage: {
    COPY_DST: number;
    UNIFORM: number;
  };
}

declare module "relay-runtime" {
  interface PayloadError {
    errors?: Record<string, string[] | undefined>;
  }
}

declare module "*.css";

declare module "*.svg" {
  const content: React.FC<React.SVGProps<SVGElement>>;
  export default content;
}
