import type { PaymentPolicyDraft } from '../components/PaymentPolicyLockPanel';

/** A payment lock is active only when it has the fields required to arm one.
* Older drafts can contain an empty/stale paymentPolicy object; treating mere object presence as active made the preview show a phantom Paywall lock.
*/
export function isPaymentPolicyConfigured(policy?: Partial<PaymentPolicyDraft> | null): policy is PaymentPolicyDraft {
  return Boolean(
    policy &&
    typeof policy.templateId === 'string' && policy.templateId.trim().length > 0 &&
    typeof policy.price === 'string' && policy.price.trim().length > 0
  );
}
