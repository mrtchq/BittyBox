import type { BittyPeer, PeerHello, PeerCapabilities } from './types';

export class PeerRegistry {
  private peers: Map<string, BittyPeer> = new Map();
  private listeners: Set<(peers: BittyPeer[]) => void> = new Set();

  registerPeer(peerId: string): BittyPeer {
    let peer = this.peers.get(peerId);
    if (!peer) {
      peer = {
        peerId,
        peerType: 'human',
        capabilities: [],
        connectedAt: Date.now()
      };
      this.peers.set(peerId, peer);
      this.notify();
    }
    return peer;
  }

  updateHello(peerId: string, hello: PeerHello): void {
    const peer = this.registerPeer(peerId);
    peer.peerType = hello.peerType;
    if (hello.name) {
      peer.displayName = hello.name;
    }
    this.notify();
  }

  updateCapabilities(peerId: string, caps: PeerCapabilities): void {
    const peer = this.registerPeer(peerId);
    peer.capabilities = caps.capabilities;
    this.notify();
  }

  updateLatency(peerId: string, latency: number): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.latency = latency;
      this.notify();
    }
  }

  removePeer(peerId: string): void {
    if (this.peers.delete(peerId)) {
      this.notify();
    }
  }

  getPeer(peerId: string): BittyPeer | undefined {
    return this.peers.get(peerId);
  }

  getPeers(): BittyPeer[] {
    return Array.from(this.peers.values());
  }

  getPeerCount(): number {
    return this.peers.size;
  }

  subscribe(listener: (peers: BittyPeer[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getPeers());
    return () => {
      this.listeners.delete(listener);
    };
  }

  clear(): void {
    this.peers.clear();
    this.notify();
  }

  private notify(): void {
    const list = this.getPeers();
    this.listeners.forEach(fn => fn(list));
  }
}