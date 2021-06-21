import { useState, useRef, useEffect } from 'react'
import { renderHook } from '..'

describe('async hook tests', () => {
  const useSequence = (values: string[], intervalMs = 50) => {
    const [first, ...otherValues] = values
    const [value, setValue] = useState(() => first)
    const index = useRef(0)

    useEffect(() => {
      const interval = setInterval(() => {
        setValue(otherValues[index.current++])
        if (index.current >= otherValues.length) {
          clearInterval(interval)
        }
      }, intervalMs)
      return () => {
        clearInterval(interval)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, otherValues)

    return value
  }

  test('should wait for next update', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSequence(['first', 'second']))

    expect(result.current).toBe('first')

    await waitForNextUpdate()

    expect(result.current).toBe('second')
  })

  test('should wait for multiple updates', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useSequence(['first', 'second', 'third'])
    )

    expect(result.current).toBe('first')

    await waitForNextUpdate()

    expect(result.current).toBe('second')

    await waitForNextUpdate()

    expect(result.current).toBe('third')
  })

  test('should reject if timeout exceeded when waiting for next update', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSequence(['first', 'second']))

    expect(result.current).toBe('first')

    await expect(waitForNextUpdate({ timeout: 10 })).rejects.toThrow(
      Error('Timed out in waitForNextUpdate after 10ms.')
    )
  })

  test('should not reject when waiting for next update if timeout has been disabled', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSequence(['first', 'second'], 1100))

    expect(result.current).toBe('first')

    await waitForNextUpdate({ timeout: false })

    expect(result.current).toBe('second')
  })

  test('should wait for expectation to pass', async () => {
    const { result, waitFor } = renderHook(() => useSequence(['first', 'second', 'third']))

    expect(result.current).toBe('first')

    let complete = false
    await waitFor(() => {
      expect(result.current).toBe('third')
      complete = true
    })
    expect(complete).toBe(true)
  })

  test('should wait for arbitrary expectation to pass', async () => {
    const { waitFor } = renderHook(() => null)

    let actual = 0
    const expected = 1

    setTimeout(() => {
      actual = expected
    }, 200)

    let complete = false
    await waitFor(() => {
      expect(actual).toBe(expected)
      complete = true
    })

    expect(complete).toBe(true)
  })

  test('should wait for arbitrary expectation to pass  when use jest.usedFakeTimers() and advanceTimersByTime()', async () => {
    try {
      jest.useFakeTimers()
      const { waitFor } = renderHook(() => null)

      let actual = 0
      const expected = 1

      setTimeout(() => {
        actual = expected
      }, 200)

      let complete = false
      jest.advanceTimersByTime(200)
      await waitFor(() => {
        expect(actual).toBe(expected)
        complete = true
      })

      expect(complete).toBe(true)
    } catch {
    } finally {
      jest.useRealTimers()
    }
  })
  test('should wait for arbitrary expectation to pass when use jest.usedFakeTimers() and runOnlyPendingTimers()', async () => {
    try {
      jest.useFakeTimers()
      const { waitFor } = renderHook(() => null)

      let actual = 0
      const expected = 1

      setTimeout(() => {
        actual = expected
      }, 200)

      let complete = false
      jest.runOnlyPendingTimers()
      await waitFor(() => {
        expect(actual).toBe(expected)
        complete = true
      })

      expect(complete).toBe(true)
    } catch {
    } finally {
      jest.useRealTimers()
    }
  })

  test('should not hang if expectation is already passing', async () => {
    const { result, waitFor } = renderHook(() => useSequence(['first', 'second']))

    expect(result.current).toBe('first')

    let complete = false
    await waitFor(() => {
      expect(result.current).toBe('first')
      complete = true
    })
    expect(complete).toBe(true)
  })

  test('should wait for truthy value', async () => {
    const { result, waitFor } = renderHook(() => useSequence(['first', 'second', 'third']))

    expect(result.current).toBe('first')

    await waitFor(() => result.current === 'third')

    expect(result.current).toBe('third')
  })

  test('should wait for arbitrary truthy value', async () => {
    const { waitFor } = renderHook(() => null)

    let actual = 0
    const expected = 1

    setTimeout(() => {
      actual = expected
    }, 200)

    await waitFor(() => actual === 1)

    expect(actual).toBe(expected)
  })

  test('should reject if timeout exceeded when waiting for expectation to pass', async () => {
    const { result, waitFor } = renderHook(() => useSequence(['first', 'second', 'third']))

    expect(result.current).toBe('first')

    await expect(
      waitFor(
        () => {
          expect(result.current).toBe('third')
        },
        { timeout: 75 }
      )
    ).rejects.toThrow(Error('Timed out in waitFor after 75ms.'))
  })

  test('should not reject when waiting for expectation to pass if timeout has been disabled', async () => {
    const { result, waitFor } = renderHook(() => useSequence(['first', 'second', 'third'], 550))

    expect(result.current).toBe('first')

    await waitFor(
      () => {
        expect(result.current).toBe('third')
      },
      { timeout: false }
    )

    expect(result.current).toBe('third')
  })

  test('should check on interval when waiting for expectation to pass', async () => {
    const { result, waitFor } = renderHook(() => useSequence(['first', 'second', 'third']))

    let checks = 0

    try {
      await waitFor(
        () => {
          checks++
          return result.current === 'third'
        },
        { interval: 100 }
      )
    } catch {}

    expect(checks).toBe(3)
  })

  test('should wait for value to change', async () => {
    const { result, waitForValueToChange } = renderHook(() =>
      useSequence(['first', 'second', 'third'])
    )

    expect(result.current).toBe('first')

    await waitForValueToChange(() => result.current === 'third')

    expect(result.current).toBe('third')
  })

  test('should wait for arbitrary value to change', async () => {
    const { waitForValueToChange } = renderHook(() => null)

    let actual = 0
    const expected = 1

    setTimeout(() => {
      actual = expected
    }, 200)

    await waitForValueToChange(() => actual)

    expect(actual).toBe(expected)
  })

  test('should reject if timeout exceeded when waiting for value to change', async () => {
    const { result, waitForValueToChange } = renderHook(() =>
      useSequence(['first', 'second', 'third'])
    )

    expect(result.current).toBe('first')

    await expect(
      waitForValueToChange(() => result.current === 'third', {
        timeout: 75
      })
    ).rejects.toThrow(Error('Timed out in waitForValueToChange after 75ms.'))
  })

  test('should not reject when waiting for value to change if timeout is disabled', async () => {
    const { result, waitForValueToChange } = renderHook(() =>
      useSequence(['first', 'second', 'third'], 550)
    )

    expect(result.current).toBe('first')

    await waitForValueToChange(() => result.current === 'third', {
      timeout: false
    })

    expect(result.current).toBe('third')
  })

  test('should reject if selector throws error', async () => {
    const { result, waitForValueToChange } = renderHook(() => useSequence(['first', 'second']))

    expect(result.current).toBe('first')

    await expect(
      waitForValueToChange(() => {
        if (result.current === 'second') {
          throw new Error('Something Unexpected')
        }
        return result.current
      })
    ).rejects.toThrow(Error('Something Unexpected'))
  })
})
