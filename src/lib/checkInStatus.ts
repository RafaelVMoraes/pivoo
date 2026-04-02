export const EXECUTION_STATUS = {
  DONE: 'done',
  NOT_DONE: 'not_done',
  PENDING: 'pending',
} as const;

export type ExecutionStatus = (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];

export interface CheckInLike {
  execution_status?: string | null;
  progress_value?: string | null;
  input_type?: string | null;
  score_value?: number | null;
}

const LEGACY_DONE_PROGRESS_VALUES = new Set(['done', 'no_evolution', 'some_evolution', 'good_evolution', 'true']);
const LEGACY_NOT_DONE_PROGRESS_VALUES = new Set(['not_done', 'false']);

export const resolveExecutionStatus = (checkIn: CheckInLike): ExecutionStatus => {
  if (checkIn.execution_status === EXECUTION_STATUS.DONE || checkIn.execution_status === EXECUTION_STATUS.NOT_DONE || checkIn.execution_status === EXECUTION_STATUS.PENDING) {
    return checkIn.execution_status;
  }

  const progress = checkIn.progress_value?.toLowerCase();
  if (!progress) return EXECUTION_STATUS.PENDING;
  if (LEGACY_DONE_PROGRESS_VALUES.has(progress)) return EXECUTION_STATUS.DONE;
  if (LEGACY_NOT_DONE_PROGRESS_VALUES.has(progress)) return EXECUTION_STATUS.NOT_DONE;
  return EXECUTION_STATUS.PENDING;
};

export const isCheckInDone = (checkIn: CheckInLike): boolean => resolveExecutionStatus(checkIn) === EXECUTION_STATUS.DONE;

export const isTrackedExecutionStatus = (checkIn: CheckInLike): boolean => {
  const status = resolveExecutionStatus(checkIn);
  return status === EXECUTION_STATUS.DONE || status === EXECUTION_STATUS.NOT_DONE;
};

export const deriveScoreValue = (checkIn: CheckInLike): number | null => {
  if (typeof checkIn.score_value === 'number' && Number.isFinite(checkIn.score_value)) {
    return checkIn.score_value;
  }

  const raw = checkIn.progress_value?.trim();
  if (!raw) return null;

  if (raw === 'true') return 1;
  if (raw === 'false') return 0;

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return numeric;

  return null;
};
