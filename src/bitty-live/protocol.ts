import { z } from 'zod';
import type { BoxPatch, BoxState, PeerHello, PeerCapabilities, PeerMessage } from './types';

export const PROTOCOL_VERSION = 1;

export const BittyPeerTypeSchema = z.enum([
  'human',
  'browser-agent',
  'server-agent',
  'service',
  'game-agent',
  'voice-agent'
]);

export const BoxPatchSchema = z.object({
  path: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_.]+$/, "Path must only contain alphanumeric, dots, and underscores"),
  value: z.any(),
  timestamp: z.number().int().positive(),
  version: z.number().int().nonnegative().optional()
});

export const BoxStateSchema = z.object({
  boxId: z.string().min(1).max(256),
  title: z.string().max(512),
  content: z.string().max(20000000), // Max 20MB
  updatedAt: z.number().int().positive(),
  version: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.any()).optional()
});

export const PeerHelloSchema = z.object({
  peerType: BittyPeerTypeSchema,
  name: z.string().max(64).optional(),
  protocolVersion: z.number().int().positive().default(PROTOCOL_VERSION),
  boxId: z.string().optional()
});

export const PeerCapabilitiesSchema = z.object({
  capabilities: z.array(z.string().max(64)).max(50)
});

export const PeerMessageSchema = z.object({
  text: z.string().max(10000).optional(),
  data: z.any().optional(),
  timestamp: z.number().int().positive()
});

export function validateBoxPatch(data: unknown): BoxPatch | null {
  const result = BoxPatchSchema.safeParse(data);
  if (!result.success) {
    console.warn('[BittyLive] Invalid box.patch payload:', result.error.format());
    return null;
  }
  return result.data;
}

export function validateBoxState(data: unknown): BoxState | null {
  const result = BoxStateSchema.safeParse(data);
  if (!result.success) {
    console.warn('[BittyLive] Invalid box.state payload:', result.error.format());
    return null;
  }
  return result.data;
}

export function validatePeerHello(data: unknown): PeerHello | null {
  const result = PeerHelloSchema.safeParse(data);
  if (!result.success) {
    console.warn('[BittyLive] Invalid peer.hello payload:', result.error.format());
    return null;
  }
  return result.data;
}

export function validatePeerCapabilities(data: unknown): PeerCapabilities | null {
  const result = PeerCapabilitiesSchema.safeParse(data);
  if (!result.success) {
    console.warn('[BittyLive] Invalid peer.capabilities payload:', result.error.format());
    return null;
  }
  return result.data;
}

export function validatePeerMessage(data: unknown): PeerMessage | null {
  const result = PeerMessageSchema.safeParse(data);
  if (!result.success) {
    console.warn('[BittyLive] Invalid peer.message payload:', result.error.format());
    return null;
  }
  return result.data;
}