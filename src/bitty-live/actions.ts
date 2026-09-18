import type { Room } from '@trystero-p2p/core';
import type { BoxPatch, BoxState, PeerHello, PeerCapabilities, PeerMessage } from './types';
import { 
  validateBoxPatch, 
  validateBoxState, 
  validatePeerHello, 
  validatePeerCapabilities, 
  validatePeerMessage 
} from './protocol';
import { PeerRegistry } from './peer';

export interface ActionHandlers {
  getState: () => BoxState;
  onRemoteState: (state: BoxState, peerId: string) => void;
  onRemotePatch: (patch: BoxPatch, peerId: string) => void;
  onRemoteMessage: (msg: PeerMessage, peerId: string) => void;
}

export function registerBittyActions(
  room: Room,
  registry: PeerRegistry,
  handlers: ActionHandlers
) {
  // 1. box.state - Request/response action
  const stateAction = (room as any).makeAction('box.state', {
    kind: 'request',
    onRequest: () => {
      return handlers.getState();
    }
  });

  // 2. box.patch - Message broadcast action
  const patchAction = (room as any).makeAction('box.patch', {
    kind: 'message',
    onMessage: (data: any, context: any) => {
      const patch = validateBoxPatch(data);
      if (patch) {
        handlers.onRemotePatch(patch, context.peerId);
      }
    }
  });

  // 3. peer.hello - Identity broadcast
  const helloAction = (room as any).makeAction('peer.hello', {
    kind: 'message',
    onMessage: (data: any, context: any) => {
      const hello = validatePeerHello(data);
      if (hello) {
        registry.updateHello(context.peerId, hello);
      }
    }
  });

  // 4. peer.capabilities - Capabilities broadcast
  const capAction = (room as any).makeAction('peer.capabilities', {
    kind: 'message',
    onMessage: (data: any, context: any) => {
      const caps = validatePeerCapabilities(data);
      if (caps) {
        registry.updateCapabilities(context.peerId, caps);
      }
    }
  });

  // 5. peer.message - Direct/broadcast chat & structured message
  const messageAction = (room as any).makeAction('peer.message', {
    kind: 'message',
    onMessage: (data: any, context: any) => {
      const msg = validatePeerMessage(data);
      if (msg) {
        handlers.onRemoteMessage(msg, context.peerId);
      }
    }
  });

  return {
    async requestState(targetPeerId: string): Promise<BoxState | null> {
      try {
        const raw = await stateAction.request(null as any, {
          target: targetPeerId,
          timeoutMs: 3000
        });
        const validated = validateBoxState(raw);
        return validated;
      } catch (err) {
        console.warn(`[BittyLive] Failed requesting box.state from ${targetPeerId}:`, err);
        return null;
      }
    },

    async broadcastPatch(patch: BoxPatch): Promise<void> {
      const validated = validateBoxPatch(patch);
      if (!validated) return;
      await patchAction.send(validated);
    },

    async sendHello(hello: PeerHello, targetPeerId?: string): Promise<void> {
      const validated = validatePeerHello(hello);
      if (!validated) return;
      await helloAction.send(validated, targetPeerId ? { target: targetPeerId } : {});
    },

    async sendCapabilities(caps: PeerCapabilities, targetPeerId?: string): Promise<void> {
      const validated = validatePeerCapabilities(caps);
      if (!validated) return;
      await capAction.send(validated, targetPeerId ? { target: targetPeerId } : {});
    },

    async sendMessage(msg: PeerMessage, targetPeerId?: string): Promise<void> {
      const validated = validatePeerMessage(msg);
      if (!validated) return;
      await messageAction.send(validated, targetPeerId ? { target: targetPeerId } : {});
    }
  };
}