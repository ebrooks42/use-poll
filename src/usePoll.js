import { useEffect } from 'react';
import { clearIntervalAsync, setIntervalAsync } from 'set-interval-async/fixed';
import { always } from 'ramda';
import { addMilliseconds } from 'date-fns';
import useMergedState from './useMergedState';

export const DEFAULT_INTERVAL_MS = 10 * 1000;
const asyncIdentity = (value) => Promise.resolve(value);
const alwaysTrue = always(true);

const computeNextRefresh = (intervalMs, now) => addMilliseconds(now, intervalMs + 1000);

const usePoll = ({
                   initialValue = null,
                   refreshValue = asyncIdentity,
                   intervalMs = DEFAULT_INTERVAL_MS,
                   shouldRefreshIf = alwaysTrue,
                 }) => {
  const initialNextRefresh = computeNextRefresh(intervalMs, new Date());

  const [{ value, willRefreshAt, isRefreshing, shouldRefresh }, setState] = useMergedState({
    value: initialValue,
    willRefreshAt: initialNextRefresh,
    isRefreshing: false,
    shouldRefresh: shouldRefreshIf(initialValue),
  });

  const refresh = async existing => {
    setState({ isRefreshing: true });
    const newValue = await refreshValue(existing);
    const now = new Date();
    setState({
      isRefreshing: false,
      willRefreshAt: computeNextRefresh(intervalMs, now),
      value: newValue,
      shouldRefresh: shouldRefreshIf(newValue),
    });
  };

  const triggerRefresh = () => refresh(value);

  useEffect(() => {
    const timer = setIntervalAsync(async () => {
      if (shouldRefresh) {
        await refresh(value);
      }
    }, intervalMs);
    return () => clearIntervalAsync(timer);
  }, [value, shouldRefresh, intervalMs]);

  return {
    value,
    willRefreshAt,
    isRefreshing,
    triggerRefresh,
  };
};

export default usePoll;
