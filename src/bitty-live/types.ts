export type BittyPeerType = 
  | 'human' 
  | 'browser-agent' 
  | 'server-agent' 
  | 'service' 
  | 'game-agent' 
  | 'voice-agent';

export interface BittyPeer {
  peerId: string;
  peerType: BittyPeerType;
  displayName?: string;
  capabilities: string[];
  connectedAt: number;
  latency?: number;
}

export interface BoxState {
  boxId: string;
  title: string;
  content: string;
  updatedAt: number;
  version: number;
  metadata?: Record<string, any>;
}

export interface BoxPatch {
  path: string;
  value: any;
  timestamp: number;
  version?: number;
}

export interface PeerHello {
  peerType: BittyPeerType;
  name?: string;
  protocolVersion: number;
  boxId?: string;
}

export interface PeerCapabilities {
  capabilities: string[];
}

export interface BittyChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSelf?: boolean;
  isSystem?: boolean;
}

export interface PeerMessage {
  text?: string;
  data?: any;
  timestamp: number;
}

export interface PeerAdmissionPayload {
  passcode?: string;
  token?: string;
  x402Proof?: any;
  peerType?: BittyPeerType;
}

export interface AdmissionResult {
  allowed: boolean;
  reason?: string;
}

export interface BittyTurnConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface BittyLiveConfig {
  boxId: string;
  identity: {
    peerType: BittyPeerType;
    name?: string;
  };
  capabilities?: string[];
  passcode?: string;
  paymentPolicy?: any;
  strictAdmission?: boolean;
  relayUrls?: string[];
  turnConfig?: BittyTurnConfig[];
  passive?: boolean;
  rtcPolyfill?: any;
  onStateChange?: (state: BoxState) => void;
  onPatch?: (patch: BoxPatch, peerId: string) => void;
  onPeersChange?: (peers: BittyPeer[]) => void;
  onMessage?: (msg: PeerMessage, peerId: string) => void;
  onJoinError?: (err: any) => void;
  getInitialState?: () => BoxState;
}

export interface BittyLiveRoom {
  boxId: string;
  roomId: string;
  selfId: string;
  getPeers: () => BittyPeer[];
  getPeerCount: () => number;
  patch: (path: string, value: any) => Promise<void>;
  sendMessage: (text: string, data?: any) => Promise<void>;
  getState: () => BoxState;
  leave: () => Promise<void>;
}
