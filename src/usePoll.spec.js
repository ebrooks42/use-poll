import { act, renderHook } from '@testing-library/react-hooks';
import { addMilliseconds, isEqual } from 'date-fns';
import FakeTimers from '@sinonjs/fake-timers';
import flushPromises from 'flush-promises';
import usePoll, { DEFAULT_INTERVAL_MS } from './usePoll';
import delay from 'delay';

describe('usePoll', () => {
  let clock;
  let now = new Date();
  beforeEach(() => {
    clock = FakeTimers.install({ now });
  });
  afterEach(() => {
    clock.uninstall();
  });

  const runTimeToEndOfNextPoll = () => runTime(DEFAULT_INTERVAL_MS);
  const runTime = async ms => {
    await act(() => clock.tickAsync(ms));
    await flushPromises();
  };

  it('should immediately return passed initial value', () => {
    const { result } = renderHook(() => usePoll({ initialValue: true }));
    expect(result.current.value)
      .toBe(true);
  });

  it('should update the current value with that returned by refreshValue after interval', async () => {
    const refreshValue = jest.fn(() => Promise.resolve(false));
    const { result } = renderHook(() => usePoll({ initialValue: true, refreshValue }));

    await runTimeToEndOfNextPoll();
    expect(result.current.value)
      .toBe(false);
  });

  it('should expose will refresh at for consumers', async () => {
    const { result } = renderHook(() => usePoll({}));

    expect(isEqual(
      result.current.willRefreshAt,
      addMilliseconds(now, DEFAULT_INTERVAL_MS + 1000), // make this 1-indexed by adding 1 second
    ))
      .toBe(true);

    await runTimeToEndOfNextPoll();
    expect(isEqual(
      result.current.willRefreshAt,
      addMilliseconds(now, DEFAULT_INTERVAL_MS * 2 + 1000), // make this 1-indexed by adding 1 second
    ))
      .toBe(true);
  });

  it('should expose isRefreshing for consumers', async () => {
    const refreshValue = () => delay(200)
      .then(() => true);
    const { result } = renderHook(() => usePoll({ refreshValue }));

    expect(result.current.isRefreshing)
      .toBe(false);
    await runTimeToEndOfNextPoll();
    expect(result.current.isRefreshing)
      .toBe(true);
  });

  it('should not call refreshValue if shouldRefreshIf evaluates to false', async () => {
    const refreshValue = jest.fn();
    const shouldRefreshIf = () => false;
    renderHook(() => usePoll({ refreshValue, shouldRefreshIf }));

    await act(() => clock.tickAsync(DEFAULT_INTERVAL_MS));

    expect(refreshValue)
      .not
      .toHaveBeenCalled();
  });

    it('should refresh value if triggerRefresh is called', async () => {
        const refreshValue = jest.fn(() => Promise.resolve(false));
        const shouldRefreshIf = () => false;

        const {result} = renderHook(() => usePoll({intialValue: true, shouldRefreshIf, refreshValue}));
        await act(() => result.current.triggerRefresh());

        expect(result.current.value)
            .toBe(false);
    });

  it('should call shouldRefreshIf with current value', async () => {
    const shouldRefreshIf = jest.fn();
    renderHook(() => usePoll({ shouldRefreshIf, initialValue: 'start value' }));

    await act(() => clock.tickAsync(DEFAULT_INTERVAL_MS));
    expect(shouldRefreshIf)
      .toHaveBeenCalledWith('start value');
  });

  it('should call refreshValue with current value', async () => {
    const refreshValue = jest.fn();
    renderHook(() => usePoll({ initialValue: 'start value', refreshValue }));

    await act(() => clock.tickAsync(DEFAULT_INTERVAL_MS));
    expect(refreshValue)
      .toHaveBeenCalledWith('start value');
  });

  it('should call refreshValue after default interval of 3 seconds', async () => {
    const refreshValue = jest.fn();
    renderHook(() => usePoll({ refreshValue }));

    expect(refreshValue)
      .not
      .toHaveBeenCalled();

    await act(() => clock.tickAsync(DEFAULT_INTERVAL_MS));

    expect(refreshValue)
      .toHaveBeenCalledTimes(1);
  });

  it('should call refreshValue after appropriate time for custom interval', async () => {
    const refreshValue = jest.fn();
    renderHook(() => usePoll({
      initialValue: true,
      refreshValue,
      intervalMs: 2000,
    }));

    expect(refreshValue)
      .not
      .toHaveBeenCalled();

    await act(() => clock.tickAsync(2000));

    expect(refreshValue)
      .toHaveBeenCalledTimes(1);
  });
});
