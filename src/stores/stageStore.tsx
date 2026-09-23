import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';

// Compact humaniser for dead-man durations, which are stored in minutes.
function formatMinutesShort(minutes: number): string {
  const m = Number(minutes) || 0;
  if (m <= 0) return 'off';
  if (m % (24 * 60) === 0) return `${m / (24 * 60)}d`;
  if (m % 60 === 0) return `${m / 60}h`;
  return `${m}m`;
}

// ============================================================
// Stage Mode — Authoritative view-state for the Bitty Stage
// ============================================================
export type StageMode =
  | 'editor'
  | 'passwordLock'
  | 'timeLock'
  | 'accessLimitLock'
  | 'encryption'
  | 'agenticLock'
  | 'deadManSwitchLock'
  | 'preview';

export type TimeLockMode = 'expiry' | 'delay' | 'range' | 'hybrid';
export type EncryptionMode = 'zk-aes256gcm' | 'aes-gcm';

export interface BoxDraft {
  // Password
  password: string;
  // Time
  timeLockEnabled: boolean;
  timeLockMode: TimeLockMode;
  timeExpiryHours: number;
  timeDelayHours: number;
  timeOpenAt: string;
  timeLockAt: string;
  hybridRevealMode: 'delay' | 'date';
  hybridSelfDestructHours: number;
  showTimeCountdown: boolean;
  // Access limit
  accessLimitEnabled: boolean;
  accessLimitMaxOpens: number;
  showRemainingAccessCount: boolean;
  // Encryption
  encryptionEnabled: boolean;
  encryptionMode: EncryptionMode;
  // Agentic
  agenticEnabled: boolean;
  agenticRequireMcp: boolean;
  agenticRoleFilter: string;
  // Dead-Man Switch
  deadmanEnabled: boolean;
  deadmanSwitchId: string;
  deadmanIntervalMinutes: number;
  deadmanGraceMinutes: number;
  deadmanGraceEnabled: boolean;
  deadmanCreatorEmail: string;
  deadmanRecipientEmail: string;
  deadmanRecipientName: string;
  deadmanNote: string;
  // Unlock threshold: how many active locks must be satisfied (0 = all)
  thresholdRequired: number;
}

export interface StageState {
  mode: StageMode;
  previousMode: StageMode | null;
  isTransitioning: boolean;

  // Box state — preserved across all Stage views
  content: string;
  title: string;
  description: string;
  favicon: string;

  // Locks state
  password: string; // '' = disabled
  timeLockEnabled: boolean;
  timeLockMode: TimeLockMode;
  timeExpiryHours: number;
  timeDelayHours: number;
  timeOpenAt: string;
  timeLockAt: string;
  hybridRevealMode: 'delay' | 'date';
  hybridSelfDestructHours: number;
  showTimeCountdown: boolean;
  accessLimitEnabled: boolean;
  accessLimitMaxOpens: number;
  showRemainingAccessCount: boolean;
  encryptionEnabled: boolean;
  encryptionMode: EncryptionMode;
  agenticEnabled: boolean;
  agenticRequireMcp: boolean;
  agenticRoleFilter: string;
  // Dead-Man Switch
  deadmanEnabled: boolean;
  deadmanSwitchId: string;
  deadmanIntervalMinutes: number;
  deadmanGraceMinutes: number;
  deadmanGraceEnabled: boolean;
  deadmanCreatorEmail: string;
  deadmanRecipientEmail: string;
  deadmanRecipientName: string;
  deadmanNote: string;
  boxId?: string;

  // Unlock threshold: how many active locks must be satisfied (0 = all)
  thresholdRequired: number;

  // Draft state for cancelable editing
  draft: BoxDraft | null;
}

// ============================================================
// Actions
// ============================================================
export type StageAction =
  | { type: 'ENTER_MODE'; mode: StageMode }
  | { type: 'EXIT_MODE' }
  | { type: 'END_TRANSITION' }
  | { type: 'SET_CONTENT'; content: string }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'SET_DESCRIPTION'; description: string }
  | { type: 'SET_FAVICON'; favicon: string }
  | { type: 'SYNC_FROM_EXTERNAL'; payload: Partial<StageState> }

  // Draft lifecycle
  | { type: 'BEGIN_DRAFT' }
  | { type: 'COMMIT_DRAFT' }
  | { type: 'DISCARD_DRAFT' }

  // Draft field setters
  | { type: 'SET_DRAFT_PASSWORD'; value: string }
  | { type: 'SET_DRAFT_TIME_LOCK'; enabled: boolean }
  | { type: 'SET_DRAFT_TIME_LOCK_MODE'; mode: TimeLockMode }
  | { type: 'SET_DRAFT_TIME_EXPIRY_HOURS'; hours: number }
  | { type: 'SET_DRAFT_TIME_DELAY_HOURS'; hours: number }
  | { type: 'SET_DRAFT_TIME_OPEN_AT'; value: string }
  | { type: 'SET_DRAFT_TIME_LOCK_AT'; value: string }
  | { type: 'SET_DRAFT_HYBRID_REVEAL_MODE'; mode: 'delay' | 'date' }
  | { type: 'SET_DRAFT_HYBRID_SELF_DESTRUCT_HOURS'; hours: number }
  | { type: 'SET_DRAFT_SHOW_TIME_COUNTDOWN'; value: boolean }
  | { type: 'SET_DRAFT_ACCESS_LIMIT'; enabled: boolean }
  | { type: 'SET_DRAFT_ACCESS_LIMIT_MAX_OPENS'; value: number }
  | { type: 'SET_DRAFT_SHOW_REMAINING_ACCESS_COUNT'; value: boolean }
  | { type: 'SET_DRAFT_ENCRYPTION_ENABLED'; enabled: boolean }
  | { type: 'SET_DRAFT_ENCRYPTION_MODE'; mode: EncryptionMode }
  | { type: 'SET_DRAFT_AGENTIC_ENABLED'; enabled: boolean }
  | { type: 'SET_DRAFT_AGENTIC_REQUIRE_MCP'; required: boolean }
  | { type: 'SET_DRAFT_AGENTIC_ROLE_FILTER'; role: string }

  // Dead-Man Switch draft setters
  | { type: 'SET_DRAFT_DEADMAN_ENABLED'; enabled: boolean }
  | { type: 'SET_DRAFT_DEADMAN_SWITCH_ID'; value: string }
  | { type: 'SET_DRAFT_DEADMAN_INTERVAL'; hours: number }
  | { type: 'SET_DRAFT_DEADMAN_GRACE'; hours: number }
  | { type: 'SET_DRAFT_DEADMAN_GRACE_ENABLED'; enabled: boolean }
  | { type: 'SET_DRAFT_DEADMAN_CREATOR_EMAIL'; value: string }
  | { type: 'SET_DRAFT_DEADMAN_RECIPIENT_EMAIL'; value: string }
  | { type: 'SET_DRAFT_DEADMAN_RECIPIENT_NAME'; value: string }
  | { type: 'SET_DRAFT_DEADMAN_NOTE'; value: string }
  | { type: 'SET_DRAFT_DEADMAN_ARMED'; payload: Partial<StageState> }

  // Remove locks
  | { type: 'REMOVE_PASSWORD' }
  | { type: 'REMOVE_TIME_LOCK' }
  | { type: 'REMOVE_ACCESS_LIMIT' }
  | { type: 'REMOVE_ENCRYPTION' }
  | { type: 'REMOVE_AGENTIC_LOCK' }
  | { type: 'REMOVE_DEADMAN' }

  // Unlock threshold (M-of-N)
  | { type: 'SET_THRESHOLD_REQUIRED'; required: number };

// ============================================================
// Initial State
// ============================================================
const initialState: StageState = {
  mode: 'editor',
  previousMode: null,
  isTransitioning: false,
  content: '',
  title: 'My Box',
  description: '',
  favicon: '📦',
  password: '',
  timeLockEnabled: false,
  timeLockMode: 'expiry',
  timeExpiryHours: 24,
  timeDelayHours: 24,
  timeOpenAt: '',
  timeLockAt: '',
  hybridRevealMode: 'delay',
  hybridSelfDestructHours: 24,
  showTimeCountdown: true,
  accessLimitEnabled: false,
  accessLimitMaxOpens: 1,
  showRemainingAccessCount: true,
  encryptionEnabled: false,
  encryptionMode: 'zk-aes256gcm',
  agenticEnabled: false,
  agenticRequireMcp: true,
  agenticRoleFilter: '',
  deadmanEnabled: false,
  deadmanSwitchId: '',
  deadmanIntervalMinutes: 10080,
  deadmanGraceMinutes: 4320,
  deadmanGraceEnabled: true,
  deadmanCreatorEmail: '',
  deadmanRecipientEmail: '',
  deadmanRecipientName: '',
  deadmanNote: '',
  boxId: undefined,
  thresholdRequired: 0,
  draft: null,
};

function buildDraft(state: StageState): BoxDraft {
  return {
    password: state.password,
    timeLockEnabled: state.timeLockEnabled,
    timeLockMode: state.timeLockMode,
    timeExpiryHours: state.timeExpiryHours,
    timeDelayHours: state.timeDelayHours,
    timeOpenAt: state.timeOpenAt,
    timeLockAt: state.timeLockAt,
    hybridRevealMode: state.hybridRevealMode,
    hybridSelfDestructHours: state.hybridSelfDestructHours,
    showTimeCountdown: state.showTimeCountdown,
    accessLimitEnabled: state.accessLimitEnabled,
    accessLimitMaxOpens: state.accessLimitMaxOpens,
    showRemainingAccessCount: state.showRemainingAccessCount,
    encryptionEnabled: state.encryptionEnabled,
    encryptionMode: state.encryptionMode,
    agenticEnabled: state.agenticEnabled,
    agenticRequireMcp: state.agenticRequireMcp,
    agenticRoleFilter: state.agenticRoleFilter,
    deadmanEnabled: state.deadmanEnabled,
    deadmanSwitchId: state.deadmanSwitchId,
    deadmanIntervalMinutes: state.deadmanIntervalMinutes,
    deadmanGraceMinutes: state.deadmanGraceMinutes,
    deadmanGraceEnabled: state.deadmanGraceEnabled,
    deadmanCreatorEmail: state.deadmanCreatorEmail,
    deadmanRecipientEmail: state.deadmanRecipientEmail,
    deadmanRecipientName: state.deadmanRecipientName,
    deadmanNote: state.deadmanNote,
    thresholdRequired: state.thresholdRequired,
  };
}

function enforceDeadmanExclusivity(state: StageState): StageState {
  if (!state.deadmanEnabled) return state;
  return {
    ...state,
    password: '',
    timeLockEnabled: false,
    timeOpenAt: '',
    timeLockAt: '',
    accessLimitEnabled: false,
    encryptionEnabled: false,
    agenticEnabled: false,
    thresholdRequired: 0,
  };
}

function applyDraft(state: StageState, draft: BoxDraft): StageState {
  return enforceDeadmanExclusivity({
    ...state,
    ...draft,
  });
}

export function stageReducer(state: StageState, action: StageAction): StageState {
  switch (action.type) {
    case 'ENTER_MODE': {
      const willNeedDraft = action.mode !== 'editor' && action.mode !== 'preview';
      return {
        ...state,
        previousMode: state.mode,
        mode: action.mode,
        isTransitioning: false,
        draft: willNeedDraft ? buildDraft(state) : state.draft,
      };
    }
    case 'EXIT_MODE':
      return {
        ...state,
        mode: 'editor',
        previousMode: null,
        isTransitioning: false,
        draft: null,
      };
    case 'END_TRANSITION':
      return { ...state, isTransitioning: false };
    case 'SET_CONTENT':
      return { ...state, content: action.content };
    case 'SET_TITLE':
      return { ...state, title: action.title };
    case 'SET_DESCRIPTION':
      return { ...state, description: action.description };
    case 'SET_FAVICON':
      return { ...state, favicon: action.favicon };
    case 'SYNC_FROM_EXTERNAL':
      return enforceDeadmanExclusivity({ ...state, ...action.payload });

    case 'BEGIN_DRAFT':
      return { ...state, draft: buildDraft(state) };
    case 'COMMIT_DRAFT':
      if (!state.draft) return { ...state, mode: 'editor', isTransitioning: false };
      return {
        ...applyDraft(state, state.draft),
        mode: 'editor',
        isTransitioning: false,
        draft: null,
      };
    case 'DISCARD_DRAFT':
      return {
        ...state,
        mode: 'editor',
        previousMode: null,
        isTransitioning: false,
        draft: null,
      };

    // Draft updates
    case 'SET_DRAFT_PASSWORD':
      return state.draft ? { ...state, draft: { ...state.draft, password: action.value } } : state;
    case 'SET_DRAFT_TIME_LOCK':
      return state.draft ? { ...state, draft: { ...state.draft, timeLockEnabled: action.enabled } } : state;
    case 'SET_DRAFT_TIME_LOCK_MODE':
      return state.draft ? { ...state, draft: { ...state.draft, timeLockMode: action.mode } } : state;
    case 'SET_DRAFT_TIME_EXPIRY_HOURS':
      return state.draft ? { ...state, draft: { ...state.draft, timeExpiryHours: action.hours } } : state;
    case 'SET_DRAFT_TIME_DELAY_HOURS':
      return state.draft ? { ...state, draft: { ...state.draft, timeDelayHours: action.hours } } : state;
    case 'SET_DRAFT_TIME_OPEN_AT':
      return state.draft ? { ...state, draft: { ...state.draft, timeOpenAt: action.value } } : state;
    case 'SET_DRAFT_TIME_LOCK_AT':
      return state.draft ? { ...state, draft: { ...state.draft, timeLockAt: action.value } } : state;
    case 'SET_DRAFT_HYBRID_REVEAL_MODE':
      return state.draft ? { ...state, draft: { ...state.draft, hybridRevealMode: action.mode } } : state;
    case 'SET_DRAFT_HYBRID_SELF_DESTRUCT_HOURS':
      return state.draft ? { ...state, draft: { ...state.draft, hybridSelfDestructHours: action.hours } } : state;
    case 'SET_DRAFT_SHOW_TIME_COUNTDOWN':
      return state.draft ? { ...state, draft: { ...state.draft, showTimeCountdown: action.value } } : state;
    case 'SET_DRAFT_ACCESS_LIMIT':
      return state.draft ? { ...state, draft: { ...state.draft, accessLimitEnabled: action.enabled } } : state;
    case 'SET_DRAFT_ACCESS_LIMIT_MAX_OPENS':
      return state.draft ? { ...state, draft: { ...state.draft, accessLimitMaxOpens: action.value } } : state;
    case 'SET_DRAFT_SHOW_REMAINING_ACCESS_COUNT':
      return state.draft ? { ...state, draft: { ...state.draft, showRemainingAccessCount: action.value } } : state;
    case 'SET_DRAFT_ENCRYPTION_ENABLED':
      return state.draft ? { ...state, draft: { ...state.draft, encryptionEnabled: action.enabled } } : state;
    case 'SET_DRAFT_ENCRYPTION_MODE':
      return state.draft ? { ...state, draft: { ...state.draft, encryptionMode: action.mode } } : state;
    case 'SET_DRAFT_AGENTIC_ENABLED':
      return state.draft ? { ...state, draft: { ...state.draft, agenticEnabled: action.enabled } } : state;
    case 'SET_DRAFT_AGENTIC_REQUIRE_MCP':
      return state.draft ? { ...state, draft: { ...state.draft, agenticRequireMcp: action.required } } : state;
    case 'SET_DRAFT_AGENTIC_ROLE_FILTER':
      return state.draft ? { ...state, draft: { ...state.draft, agenticRoleFilter: action.role } } : state;

    // Dead-Man Switch draft updates
    case 'SET_DRAFT_DEADMAN_ENABLED':
      return state.draft ? { ...state, draft: { ...state.draft, deadmanEnabled: action.enabled } } : state;
    case 'SET_DRAFT_DEADMAN_SWITCH_ID':
      return state.draft ? { ...state, draft: { ...state.draft, deadmanSwitchId: action.value } } : state;
    case 'SET_DRAFT_DEADMAN_INTERVAL':
      return state.draft ? { ...state, draft: { ...state.draft, deadmanIntervalMinutes: action.hours } } : state;
    case 'SET_DRAFT_DEADMAN_GRACE':
      return state.draft ? { ...state, draft: { ...state.draft, deadmanGraceMinutes: action.hours } } : state;
    case 'SET_DRAFT_DEADMAN_GRACE_ENABLED':
      return state.draft ? { ...state, draft: { ...state.draft, deadmanGraceEnabled: action.enabled } } : state;
    case 'SET_DRAFT_DEADMAN_CREATOR_EMAIL':
      return state.draft ? { ...state, draft: { ...state.draft, deadmanCreatorEmail: action.value } } : state;
    case 'SET_DRAFT_DEADMAN_RECIPIENT_EMAIL':
      return state.draft ? { ...state, draft: { ...state.draft, deadmanRecipientEmail: action.value } } : state;
    case 'SET_DRAFT_DEADMAN_RECIPIENT_NAME':
      return state.draft ? { ...state, draft: { ...state.draft, deadmanRecipientName: action.value } } : state;
    case 'SET_DRAFT_DEADMAN_NOTE':
      return state.draft ? { ...state, draft: { ...state.draft, deadmanNote: action.value } } : state;
    case 'SET_DRAFT_DEADMAN_ARMED':
      return { ...state, ...action.payload };

    // Remove locks immediately
    case 'SET_THRESHOLD_REQUIRED':
      return {
        ...state,
        thresholdRequired: Math.max(0, action.required),
        draft: state.draft
          ? { ...state.draft, thresholdRequired: Math.max(0, action.required) }
          : null,
      };
    case 'REMOVE_PASSWORD':
      return {
        ...state,
        password: '',
        draft: state.draft ? { ...state.draft, password: '' } : null,
      };
    case 'REMOVE_TIME_LOCK':
      return {
        ...state,
        timeLockEnabled: false,
        draft: state.draft ? { ...state.draft, timeLockEnabled: false } : null,
      };
    case 'REMOVE_ACCESS_LIMIT':
      return {
        ...state,
        accessLimitEnabled: false,
        draft: state.draft ? { ...state.draft, accessLimitEnabled: false } : null,
      };
    case 'REMOVE_ENCRYPTION':
      return {
        ...state,
        encryptionEnabled: false,
        draft: state.draft ? { ...state.draft, encryptionEnabled: false } : null,
      };
    case 'REMOVE_AGENTIC_LOCK':
      return {
        ...state,
        agenticEnabled: false,
        draft: state.draft ? { ...state.draft, agenticEnabled: false } : null,
      };
    case 'REMOVE_DEADMAN':
      return {
        ...state,
        deadmanEnabled: false,
        deadmanSwitchId: '',
        deadmanGraceEnabled: true,
        deadmanCreatorEmail: '',
        deadmanRecipientEmail: '',
        deadmanRecipientName: '',
        deadmanNote: '',
        draft: state.draft
          ? {
              ...state.draft,
              deadmanEnabled: false,
              deadmanSwitchId: '',
              deadmanGraceEnabled: true,
              deadmanCreatorEmail: '',
              deadmanRecipientEmail: '',
              deadmanRecipientName: '',
              deadmanNote: '',
            }
          : null,
      };

    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================
interface StageContextValue {
  state: StageState;
  dispatch: React.Dispatch<StageAction>;
  enterMode: (mode: StageMode) => void;
  exitMode: () => void;
  beginDraft: () => void;
  commitDraft: () => void;
  discardDraft: () => void;
  setContent: (content: string) => void;
  setTitle: (title: string) => void;
  setDescription: (desc: string) => void;
  syncFromExternal: (payload: Partial<StageState>) => void;
  setThresholdRequired: (required: number) => void;
}

const StageContext = createContext<StageContextValue | null>(null);

export function StageProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: Partial<StageState>;
}) {
  const mergedInitialState = { ...initialState, ...initial };
  const [state, dispatch] = useReducer(stageReducer, mergedInitialState, enforceDeadmanExclusivity);

  const enterMode = useCallback((mode: StageMode) => {
    dispatch({ type: 'ENTER_MODE', mode });
  }, []);

  const exitMode = useCallback(() => {
    dispatch({ type: 'EXIT_MODE' });
  }, []);

  const beginDraft = useCallback(() => {
    dispatch({ type: 'BEGIN_DRAFT' });
  }, []);

  const commitDraft = useCallback(() => {
    dispatch({ type: 'COMMIT_DRAFT' });
  }, []);

  const discardDraft = useCallback(() => {
    dispatch({ type: 'DISCARD_DRAFT' });
  }, []);

  const setContent = useCallback((content: string) => {
    dispatch({ type: 'SET_CONTENT', content });
  }, []);

  const setTitle = useCallback((title: string) => {
    dispatch({ type: 'SET_TITLE', title });
  }, []);

  const setDescription = useCallback((description: string) => {
    dispatch({ type: 'SET_DESCRIPTION', description });
  }, []);

  const setThresholdRequired = useCallback((required: number) => {
    dispatch({ type: 'SET_THRESHOLD_REQUIRED', required });
  }, []);

  const syncFromExternal = useCallback((payload: Partial<StageState>) => {
    dispatch({ type: 'SYNC_FROM_EXTERNAL', payload });
  }, []);

  return (
    <StageContext.Provider
      value={{
        state,
        dispatch,
        enterMode,
        exitMode,
        beginDraft,
        commitDraft,
        discardDraft,
        setContent,
        setTitle,
        setDescription,
        syncFromExternal,
        setThresholdRequired,
      }}
    >
      {children}
    </StageContext.Provider>
  );
}

export function useStage(): StageContextValue {
  const ctx = useContext(StageContext);
  if (!ctx) throw new Error('useStage must be used within StageProvider');
  return ctx;
}

// ============================================================
// Derived Selectors
// ============================================================
export interface ActiveLockInfo {
  id: StageMode;
  label: string;
  iconType: 'password' | 'time' | 'views' | 'deadman';
  status: 'active' | 'configured' | 'incomplete' | 'disabled';
  detail: string;
}

export function useActiveLocksList(): ActiveLockInfo[] {
  const { state } = useStage();
  const locks: ActiveLockInfo[] = [];

  // Passcode / One-Time Magic Key. Both live in state.password; the *format*
  // decides which lock the creator configured — an MK-XXXX-XXXX value is a
  // One-Time Magic Key, anything else is a Passcode (numeric PIN).
  if (state.password.length > 0) {
    const magicKeyText = state.password.trim();
    const isMagicKey = /^MK-/i.test(magicKeyText);
    const isComplete = magicKeyText.length >= 8;
    locks.push({
      id: 'passwordLock',
      label: isMagicKey ? 'Magic Key' : 'Passcode',
      iconType: 'password',
      status: isComplete ? 'active' : 'incomplete',
      detail: isMagicKey
        ? (isComplete ? 'One-time key' : 'Incomplete key')
        : (isComplete ? `${state.password.length}-digit PIN` : 'Min 8 digits'),
    });
  }

  // Time Lock
  if (state.timeLockEnabled) {
    let detail = 'Timer set';
    if (state.timeLockMode === 'expiry') detail = `${state.timeExpiryHours}h Expiry`;
    else if (state.timeLockMode === 'delay') detail = `${state.timeDelayHours}h Delay`;
    else if (state.timeLockMode === 'hybrid') detail = 'Timed Drop';
    else if (state.timeLockMode === 'range') detail = 'Date Window';

    locks.push({
      id: 'timeLock',
      label: 'Time',
      iconType: 'time',
      status: 'active',
      detail,
    });
  }

  // Access Limit
  if (state.accessLimitEnabled) {
    locks.push({
      id: 'accessLimitLock',
      label: state.accessLimitMaxOpens === 1 ? '1 View' : `${state.accessLimitMaxOpens} Views`,
      iconType: 'views',
      status: 'active',
      detail: state.accessLimitMaxOpens === 1 ? 'Burn on Read' : `${state.accessLimitMaxOpens} views max`,
    });
  }

  // Dead-Man Switch
  if (state.deadmanEnabled) {
    const intervalLabel = formatMinutesShort(state.deadmanIntervalMinutes);
    const graceLabel = state.deadmanGraceEnabled
      ? `+${formatMinutesShort(state.deadmanGraceMinutes)} grace`
      : 'no grace';
    locks.push({
      id: 'deadManSwitchLock',
      label: 'Dead-Man',
      iconType: 'deadman',
      status: state.deadmanCreatorEmail ? 'active' : 'incomplete',
      detail: state.deadmanCreatorEmail
        ? `Every ${intervalLabel} · ${graceLabel}`
        : 'Creator email needed',
    });
  }

  return locks;
}

export function useActiveLocks() {
  const { state } = useStage();
  return {
    password: state.password.length >= 8,
    passwordIncomplete: state.password.length > 0 && state.password.length < 8,
    timeLock: state.timeLockEnabled,
    accessLimit: state.accessLimitEnabled,
    encryption: state.encryptionEnabled || state.password.length >= 8,
    agentic: state.agenticEnabled,
    deadman: state.deadmanEnabled,
  };
}

export function useDraft() {
  const { state, dispatch } = useStage();
  const d = state.draft;
  if (!d) return null;
  return {
    ...d,
    setPassword: (v: string) => dispatch({ type: 'SET_DRAFT_PASSWORD', value: v }),
    setTimeLock: (v: boolean) => dispatch({ type: 'SET_DRAFT_TIME_LOCK', enabled: v }),
    setTimeLockMode: (v: TimeLockMode) => dispatch({ type: 'SET_DRAFT_TIME_LOCK_MODE', mode: v }),
    setTimeExpiryHours: (v: number) => dispatch({ type: 'SET_DRAFT_TIME_EXPIRY_HOURS', hours: v }),
    setTimeDelayHours: (v: number) => dispatch({ type: 'SET_DRAFT_TIME_DELAY_HOURS', hours: v }),
    setTimeOpenAt: (v: string) => dispatch({ type: 'SET_DRAFT_TIME_OPEN_AT', value: v }),
    setTimeLockAt: (v: string) => dispatch({ type: 'SET_DRAFT_TIME_LOCK_AT', value: v }),
    setHybridRevealMode: (v: 'delay' | 'date') => dispatch({ type: 'SET_DRAFT_HYBRID_REVEAL_MODE', mode: v }),
    setHybridSelfDestructHours: (v: number) => dispatch({ type: 'SET_DRAFT_HYBRID_SELF_DESTRUCT_HOURS', hours: v }),
    setShowTimeCountdown: (v: boolean) => dispatch({ type: 'SET_DRAFT_SHOW_TIME_COUNTDOWN', value: v }),
    setAccessLimit: (v: boolean) => dispatch({ type: 'SET_DRAFT_ACCESS_LIMIT', enabled: v }),
    setAccessLimitMaxOpens: (v: number) => dispatch({ type: 'SET_DRAFT_ACCESS_LIMIT_MAX_OPENS', value: v }),
    setShowRemainingAccessCount: (v: boolean) => dispatch({ type: 'SET_DRAFT_SHOW_REMAINING_ACCESS_COUNT', value: v }),
    setEncryptionEnabled: (v: boolean) => dispatch({ type: 'SET_DRAFT_ENCRYPTION_ENABLED', enabled: v }),
    setEncryptionMode: (v: EncryptionMode) => dispatch({ type: 'SET_DRAFT_ENCRYPTION_MODE', mode: v }),
    setAgenticEnabled: (v: boolean) => dispatch({ type: 'SET_DRAFT_AGENTIC_ENABLED', enabled: v }),
    setAgenticRequireMcp: (v: boolean) => dispatch({ type: 'SET_DRAFT_AGENTIC_REQUIRE_MCP', required: v }),
    setAgenticRoleFilter: (v: string) => dispatch({ type: 'SET_DRAFT_AGENTIC_ROLE_FILTER', role: v }),
    setDeadmanEnabled: (v: boolean) => dispatch({ type: 'SET_DRAFT_DEADMAN_ENABLED', enabled: v }),
    setDeadmanSwitchId: (v: string) => dispatch({ type: 'SET_DRAFT_DEADMAN_SWITCH_ID', value: v }),
    setDeadmanIntervalMinutes: (v: number) => dispatch({ type: 'SET_DRAFT_DEADMAN_INTERVAL', hours: v }),
    setDeadmanGraceMinutes: (v: number) => dispatch({ type: 'SET_DRAFT_DEADMAN_GRACE', hours: v }),
    setDeadmanGraceEnabled: (v: boolean) => dispatch({ type: 'SET_DRAFT_DEADMAN_GRACE_ENABLED', enabled: v }),
    setDeadmanCreatorEmail: (v: string) => dispatch({ type: 'SET_DRAFT_DEADMAN_CREATOR_EMAIL', value: v }),
    setDeadmanRecipientEmail: (v: string) => dispatch({ type: 'SET_DRAFT_DEADMAN_RECIPIENT_EMAIL', value: v }),
    setDeadmanRecipientName: (v: string) => dispatch({ type: 'SET_DRAFT_DEADMAN_RECIPIENT_NAME', value: v }),
    setDeadmanNote: (v: string) => dispatch({ type: 'SET_DRAFT_DEADMAN_NOTE', value: v }),
  };
}
