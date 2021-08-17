import { useEffect, useState } from "react";

export interface RefreshTriggerFn<Type> {
  (): Promise<Type | undefined>;
}
export interface RefreshFn<Type> {
  (currentValue: Type | undefined): Promise<Type | undefined>;
}
export interface ShouldRefreshFn<Type> {
  <Type>(currentValue: Type | undefined): boolean;
}
export interface UsePollParams<Type> {
  initialValue?: Type;
  refreshValue?: RefreshFn<Type>;
  intervalMs?: number;
  shouldRefreshIf?: ShouldRefreshFn<Type>;
}
export interface UsePollResult<Type> {
  value: Type | undefined;
  willRefreshAt: Date;
  isRefreshing: boolean;
  triggerRefresh: RefreshTriggerFn<Type>;
}

export type UsePollType<Type> = (
  params: UsePollParams<Type>
) => UsePollResult<Type>;

export const DEFAULT_INTERVAL_MS = 5 * 1000;
const asyncIdentity: RefreshFn<any> = (currentValue) =>
  Promise.resolve(currentValue);
const alwaysTrue = () => true;

const computeNextRefresh = (intervalMs: number, now: Date) => {
  const nowMsSinceEpoch = now.getTime();
  return new Date(nowMsSinceEpoch + intervalMs + 1000);
};

export default function usePoll<Type>(
  params: UsePollParams<Type>
): UsePollResult<Type> {
  const intervalMs = params.intervalMs ?? DEFAULT_INTERVAL_MS;
  const refreshValue: RefreshFn<Type> = params.refreshValue ?? asyncIdentity;
  const shouldRefreshIf = params.shouldRefreshIf ?? alwaysTrue;

  const [state, setState] = useState({
    value: params.initialValue,
    willRefreshAt: computeNextRefresh(intervalMs, new Date()),
    isRefreshing: false,
    shouldRefresh: shouldRefreshIf(params.initialValue),
  });

  const refresh = async (existing: Type | undefined) => {
    setState((currentState) => ({ ...currentState, isRefreshing: true }));
    const newValue = await refreshValue(existing);
    const now = new Date();
    setState((currentState) => ({
      isRefreshing: false,
      willRefreshAt: computeNextRefresh(intervalMs, now),
      value: newValue,
      shouldRefresh: shouldRefreshIf(newValue),
    }));
    return newValue;
  };

  const triggerRefresh: RefreshTriggerFn<Type> = () => refresh(state.value);

  useEffect(() => {
    const timer = setInterval(async () => {
      if (state.shouldRefresh) {
        await refresh(state.value);
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [state.value, state.shouldRefresh, intervalMs]);

  return {
    value: state.value,
    willRefreshAt: state.willRefreshAt,
    isRefreshing: state.isRefreshing,
    triggerRefresh,
  };
}
