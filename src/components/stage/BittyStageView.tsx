import React, { useEffect, useRef } from 'react';
import { BittyStage, EtherTransition } from '../BittyStage';
import { useStage, StageMode, StageProvider } from '../../stores/stageStore';
import { StageEditor } from './StageEditor';
import { PasswordLockStage } from './PasswordLockStage';
import { TimeLockStage } from './TimeLockStage';
import { AccessLimitStage } from './AccessLimitStage';
import { PreviewStage } from './PreviewStage';
import { PaymentPolicyDraft } from '../PaymentPolicyLockPanel';
import { buildTimeWindow } from '../../utils/timeWindow';
import type { UseAccountResult } from '../../hooks/useAccount';
import type { BittyMetadata, BittyChainDraft } from '../../types';

export interface BittyStageViewProps {
  content: string;
  onChangeContent?: (content: string) => void;
  metadata: BittyMetadata;
  onChangeMetadata?: (metadata: BittyMetadata) => void;
  bittyUrl?: string;
  onGenerate?: () => void;
  isGenerating?: boolean;
  calculatedCreditCost?: number;
  chainEnabled?: boolean;
  chainIndex?: number;
  chainTotal?: number;
  chainMax?: number;
  chainDraft?: BittyChainDraft | null;
  isLastChainBox?: boolean;
  onToggleChain?: (enabled: boolean) => void;
  onCreateNextChainPage?: (mode: 'clone' | 'scratch') => void;
  onGoToChainPage?: (index: number) => void;
  onDeleteLastChainBox?: () => void;
  onDeleteChainPage?: (index: number) => void;
  account?: UseAccountResult;
  isPro?: boolean;
  onOpenPaywall?: (featureName?: string) => void;
  paymentPolicy?: PaymentPolicyDraft;
  onPaymentPolicyChange?: (value?: PaymentPolicyDraft) => void;
}

const StageDispatcher: React.FC<BittyStageViewProps> = (props) => {
  const { state, setContent, setTitle, setDescription, syncFromExternal, discardDraft, exitMode } = useStage();

  // Tracks the last content value we forwarded to the parent so the
  // parent-to-child echo of our own keystrokes never clobbers newer
  // local typing with a stale parent value (dropped characters).
  const lastForwardedContent = useRef(props.content);

  // Sync incoming props to stage store — external changes only
  // (session switch, template select). Skips the echo of our own edits.
  useEffect(() => {
    if (props.content !== lastForwardedContent.current && props.content !== state.content) {
      setContent(props.content);
    }
    lastForwardedContent.current = props.content;
  }, [props.content]);

  useEffect(() => {
    syncFromExternal({
      // Preserve an intentionally empty title; the initial provider state above
      // supplies "My Box" only when a new editor session is first created.
      title: props.metadata.title,
      description: props.metadata.description || '',
      favicon: props.metadata.favicon || '📦',
      password: props.metadata.password || '',
      boxId: props.metadata.boxId,
      timeLockEnabled: Boolean(props.metadata.lockConfig?.timeWindow?.enabled || props.metadata.lockConfig?.timeWindow?.mode),
      accessLimitEnabled: Boolean(props.metadata.lockConfig?.openLimit?.enabled),
      accessLimitMaxOpens: props.metadata.lockConfig?.openLimit?.maxOpens || 1,
      showRemainingAccessCount: props.metadata.lockConfig?.openLimit?.showRemainingCount ?? true,
    });
  }, [props.metadata]);

  // Handle browser Back / popstate so users smoothly return to Editor without leaving page
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (state.mode !== 'editor') {
        discardDraft();
      }
    };

    if (state.mode !== 'editor') {
      window.history.pushState({ stageMode: state.mode }, '', `#stage=${state.mode}`);
    } else if (window.location.hash.startsWith('#stage=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [state.mode, discardDraft]);

  // Sync state changes back up to parent
  useEffect(() => {
    if (state.content !== props.content) {
      lastForwardedContent.current = state.content;
      props.onChangeContent?.(state.content);
    }
  }, [state.content]);

  useEffect(() => {
    const nextLockConfig: Record<string, any> = { ...(props.metadata.lockConfig || {}) };
    // Retired Editor lock types must not persist or reappear from older drafts.
    delete nextLockConfig.encryption;
    delete nextLockConfig.agentic;

    if (state.timeLockEnabled) {
      const tw = buildTimeWindow({
        enabled: true,
        mode: state.timeLockMode,
        expiryHours: state.timeExpiryHours,
        delayHours: state.timeDelayHours,
        openAt: state.timeOpenAt,
        lockAt: state.timeLockAt,
        hybridRevealMode: state.hybridRevealMode,
        hybridSelfDestructHours: state.hybridSelfDestructHours,
        showCountdown: state.showTimeCountdown,
      });
      if (tw) {
        nextLockConfig.timeWindow = tw;
      }
    } else {
      delete nextLockConfig.timeWindow;
    }

    if (state.accessLimitEnabled) {
      nextLockConfig.openLimit = {
        enabled: true,
        maxOpens: state.accessLimitMaxOpens,
        showRemainingCount: state.showRemainingAccessCount,
      };
    } else {
      delete nextLockConfig.openLimit;
    }

    if (props.paymentPolicy) nextLockConfig.paymentPolicy = props.paymentPolicy;
    else delete nextLockConfig.paymentPolicy;

    const hasAnyLock = Object.keys(nextLockConfig).length > 0;

    const updatedMeta: BittyMetadata = {
      ...props.metadata,
      title: state.title,
      description: state.description,
      favicon: state.favicon,
      password: state.password.trim() ? state.password.trim() : undefined,
      lockConfig: hasAnyLock ? nextLockConfig : undefined,
    };

    props.onChangeMetadata?.(updatedMeta);
  }, [
    state.title,
    state.description,
    state.favicon,
    state.password,
    state.timeLockEnabled,
    state.timeLockMode,
    state.timeExpiryHours,
    state.timeDelayHours,
    state.timeOpenAt,
    state.timeLockAt,
    state.hybridRevealMode,
    state.hybridSelfDestructHours,
    state.showTimeCountdown,
    state.accessLimitEnabled,
    state.accessLimitMaxOpens,
    state.showRemainingAccessCount,
    props.paymentPolicy,
  ]);

  const renderStageView = (mode: StageMode) => {
    switch (mode) {
      case 'passwordLock':
        return <PasswordLockStage />;
      case 'timeLock':
        return <TimeLockStage />;
      case 'accessLimitLock':
        return <AccessLimitStage />;
      case 'preview':
        return <PreviewStage />;
      case 'editor':
      default:
        return (
          <StageEditor
            onGenerate={props.onGenerate}
            isGenerating={props.isGenerating}
            calculatedCreditCost={props.calculatedCreditCost}
            bittyUrl={props.bittyUrl}
            chainEnabled={props.chainEnabled}
            chainIndex={props.chainIndex}
            chainTotal={props.chainTotal}
            chainMax={props.chainMax}
            chainDraft={props.chainDraft}
            isLastChainBox={props.isLastChainBox}
            onToggleChain={props.onToggleChain}
            onCreateNextChainPage={props.onCreateNextChainPage}
            onGoToChainPage={props.onGoToChainPage}
            onDeleteLastChainBox={props.onDeleteLastChainBox}
            onDeleteChainPage={props.onDeleteChainPage}
            account={props.account}
            isPro={props.isPro}
            onOpenPaywall={props.onOpenPaywall}
            paymentPolicy={props.paymentPolicy}
            onPaymentPolicyChange={props.onPaymentPolicyChange}
          />
        );
    }
  };

  return (
    <BittyStage>
      <EtherTransition mode={state.mode}>
        {renderStageView(state.mode)}
      </EtherTransition>
    </BittyStage>
  );
};

export const BittyStageView: React.FC<BittyStageViewProps> = (props) => {
  return (
    <StageProvider
      initial={{
        content: props.content,
        title: props.metadata.title || 'My Box',
        description: props.metadata.description || '',
        favicon: props.metadata.favicon || '📦',
        password: props.metadata.password || '',
        timeLockEnabled: Boolean(props.metadata.lockConfig?.timeWindow?.enabled || props.metadata.lockConfig?.timeWindow?.mode),
        accessLimitEnabled: Boolean(props.metadata.lockConfig?.openLimit?.enabled),
        accessLimitMaxOpens: props.metadata.lockConfig?.openLimit?.maxOpens || 1,
        showRemainingAccessCount: props.metadata.lockConfig?.openLimit?.showRemainingCount ?? true,
      }}
    >
      <StageDispatcher {...props} />
    </StageProvider>
  );
};
