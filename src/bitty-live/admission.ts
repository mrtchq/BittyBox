import type { AdmissionResult, PeerAdmissionPayload } from './types';

export interface AdmissionContext {
  boxId: string;
  expectedPasscode?: string;
  paymentPolicy?: any;
  peerId: string;
  isInitiator: boolean;
}

export async function verifyPaymentForBox(params: {
  boxId: string;
  peerIdentity?: any;
  requirement?: any;
}): Promise<boolean> {
  // Phase 7 Adapter: Hook into Bitty Box payment / x402 verification
  if (!params.requirement) return true;
  // If payment is required, verify proof or receipt token
  return Boolean(params.requirement.paid || params.peerIdentity?.hasPaymentReceipt);
}

export async function evaluatePeerAdmission(
  context: AdmissionContext,
  payload?: PeerAdmissionPayload
): Promise<AdmissionResult> {
  // 1. Passcode / Shared Secret admission check
  if (context.expectedPasscode) {
    if (!payload || payload.passcode !== context.expectedPasscode) {
      return {
        allowed: false,
        reason: 'Passcode mismatch or not provided'
      };
    }
  }

  // 2. Extensible x402 Payment admission check
  if (context.paymentPolicy) {
    const isPaid = await verifyPaymentForBox({
      boxId: context.boxId,
      peerIdentity: payload,
      requirement: context.paymentPolicy
    });
    if (!isPaid) {
      return {
        allowed: false,
        reason: 'x402 payment required to join this Bitty Box'
      };
    }
  }

  return { allowed: true };
}