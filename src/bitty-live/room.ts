import { joinRoom, selfId } from '@trystero-p2p/ws-relay';
import type { BittyLiveConfig, BittyLiveRoom, BoxPatch, BoxState, BittyPeer } from './types';
import { PeerRegistry } from './peer';
import { registerBittyActions } from './actions';
import { evaluatePeerAdmission } from './admission';
import { PROTOCOL_VERSION } from './protocol';

export async function deriveRoomId(seed: string): Promise<string> {
  const normalized = `bittybox:${(seed || 'default').trim()}`;
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(normalized));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export function getDefaultRelayUrls(): string[] {
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return [`${protocol}//${window.location.host}/relay`];
  }
  return ['wss://bittybox.org/relay'];
}

export function getDefaultTurnConfig() {
  return [
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.l.google.com:19302' }
  ];
}

export async function joinBittyBoxLive(config: BittyLiveConfig): Promise<BittyLiveRoom> {
  const roomId = await deriveRoomId(config.boxId);
  const registry = new PeerRegistry();

  let currentState: BoxState = config.getInitialState ? config.getInitialState() : {
    boxId: config.boxId,
    title: 'Untitled Box',
    content: '',
    updatedAt: Date.now(),
    version: 1
  };

  const relayUrls = config.relayUrls && config.relayUrls.length > 0 
    ? config.relayUrls 
    : getDefaultRelayUrls();

  const trysteroConfig = {
    appId: 'bittybox.org',
    relayConfig: {
      urls: relayUrls
    },
    turnConfig: config.turnConfig || getDefaultTurnConfig(),
    passive: Boolean(config.passive),
    ...(config.rtcPolyfill ? { rtcPolyfill: config.rtcPolyfill } : {})
  };

  const roomOptions: any = {
    onJoinError: (err: any) => {
      console.warn('[BittyLive] Room join error:', err);
      config.onJoinError?.(err);
    }
  };

  // Only attach blocking onPeerHandshake when strict admission is explicitly requested
  if (config.strictAdmission && (config.passcode || config.paymentPolicy)) {
    roomOptions.handshakeTimeoutMs = 10000;
    roomOptions.onPeerHandshake = async (peerId: string, send: any, receive: any, isInitiator: boolean) => {
      // Phase 6 Admission hook
      const admissionContext = {
        boxId: config.boxId,
        expectedPasscode: config.passcode,
        paymentPolicy: config.paymentPolicy,
        peerId,
        isInitiator
      };

      if (isInitiator) {
        await send({
          passcode: config.passcode,
          peerType: config.identity.peerType
        });
        const { data } = await receive();
        const result = await evaluatePeerAdmission(admissionContext, data as any);
        if (!result.allowed) {
          throw new Error(result.reason || 'Admission denied');
        }
      } else {
        const { data } = await receive();
        const result = await evaluatePeerAdmission(admissionContext, data as any);
        if (!result.allowed) {
          throw new Error(result.reason || 'Admission denied');
        }
        await send({
          passcode: config.passcode,
          peerType: config.identity.peerType
        });
      }
    };
  }

  const room = joinRoom(trysteroConfig, roomId, roomOptions);

  const actions = registerBittyActions(room, registry, {
    getState: () => currentState,
    onRemoteState: (state, _peerId) => {
      if (state && state.updatedAt > currentState.updatedAt) {
        currentState = state;
        config.onStateChange?.(currentState);
      }
    },
    onRemotePatch: (patch, peerId) => {
      if (!patch) return;
      // Apply patch to local state
      if (patch.path === 'content.title' || patch.path === 'metadata.title' || patch.path === 'title') {
        currentState = {
          ...currentState,
          title: String(patch.value),
          updatedAt: patch.timestamp || Date.now(),
          version: (currentState.version || 0) + 1
        };
        config.onStateChange?.(currentState);
      } else if (patch.path === 'content' || patch.path === 'content.body') {
        currentState = {
          ...currentState,
          content: String(patch.value),
          updatedAt: patch.timestamp || Date.now(),
          version: (currentState.version || 0) + 1
        };
        config.onStateChange?.(currentState);
      }
      config.onPatch?.(patch, peerId);
    },
    onRemoteMessage: (msg, peerId) => {
      config.onMessage?.(msg, peerId);
    }
  });

  // Subscribe to peer registry changes
  registry.subscribe((peers: BittyPeer[]) => {
    config.onPeersChange?.(peers);
  });

  // Peer joined
  room.onPeerJoin = async (peerId: string) => {
    registry.registerPeer(peerId);

    // Send local hello & capabilities
    await actions.sendHello({
      peerType: config.identity.peerType,
      name: config.identity.name,
      protocolVersion: PROTOCOL_VERSION,
      boxId: config.boxId
    }, peerId);

    if (config.capabilities && config.capabilities.length > 0) {
      await actions.sendCapabilities({
        capabilities: config.capabilities
      }, peerId);
    }

    // Ping to determine initial latency
    try {
      const ms = await room.ping(peerId);
      registry.updateLatency(peerId, ms);
    } catch {
      // ping can fail if connection still setting up
    }

    // Request remote state to sync if peer has fresher state
    const remoteState = await actions.requestState(peerId);
    if (remoteState && remoteState.updatedAt > currentState.updatedAt) {
      currentState = remoteState;
      config.onStateChange?.(currentState);
    }
  };

  // Peer left
  room.onPeerLeave = (peerId: string) => {
    registry.removePeer(peerId);
  };

  return {
    boxId: config.boxId,
    roomId,
    selfId,
    getPeers: () => registry.getPeers(),
    getPeerCount: () => registry.getPeerCount(),
    patch: async (path: string, value: any) => {
      const patchObj: BoxPatch = {
        path,
        value,
        timestamp: Date.now(),
        version: (currentState.version || 0) + 1
      };

      // Optimistically apply locally
      if (path === 'content.title' || path === 'metadata.title' || path === 'title') {
        currentState = {
          ...currentState,
          title: String(value),
          updatedAt: patchObj.timestamp,
          version: patchObj.version
        };
      } else if (path === 'content' || path === 'content.body') {
        currentState = {
          ...currentState,
          content: String(value),
          updatedAt: patchObj.timestamp,
          version: patchObj.version
        };
      }

      await actions.broadcastPatch(patchObj);
    },
    sendMessage: async (text: string, data?: any) => {
      await actions.sendMessage({
        text,
        data,
        timestamp: Date.now()
      });
    },
    getState: () => currentState,
    leave: async () => {
      registry.clear();
      await room.leave();
    }
  };
}