import { ActTypes, WaitOptions, AsyncUtilsReturn } from 'types'

import { resolveAfter } from 'helpers/promises'
import { TimeoutError } from 'helpers/error'

function asyncUtils(act: ActTypes, addResolver: (callback: () => void) => void): AsyncUtilsReturn {
  let nextUpdatePromise: Promise<void> | null = null

  const waitForNextUpdate = async ({ timeout }: Pick<WaitOptions, 'timeout'> = {}) => {
    if (!nextUpdatePromise) {
      nextUpdatePromise = new Promise((resolve, reject) => {
        let timeoutId: ReturnType<typeof setTimeout>
        if (timeout && timeout > 0) {
          timeoutId = setTimeout(
            () => reject(new TimeoutError(waitForNextUpdate, timeout)),
            timeout
          )
        }
        addResolver(() => {
          clearTimeout(timeoutId)
          nextUpdatePromise = null
          resolve()
        })
      })
      await act(() => nextUpdatePromise as Promise<void>)
    }
    await nextUpdatePromise
  }

  const waitFor = async (
    callback: () => boolean | void,
    { interval, timeout, suppressErrors = true }: WaitOptions = {}
  ) => {
    const checkResult = () => {
      try {
        const callbackResult = callback()
        return callbackResult ?? callbackResult === undefined
      } catch (error: unknown) {
        if (!suppressErrors) {
          throw error as Error
        }
        return undefined
      }
    }

    const waitForResult = async () => {
      const initialTimeout = timeout
      while (true) {
        const startTime = Date.now()
        try {
          const nextCheck = interval
            ? Promise.race([waitForNextUpdate({ timeout }), resolveAfter(interval)])
            : waitForNextUpdate({ timeout })

          await nextCheck

          if (checkResult()) {
            return
          }
        } catch (error: unknown) {
          if (error instanceof TimeoutError && initialTimeout) {
            throw new TimeoutError(waitFor, initialTimeout)
          }
          throw error as Error
        }
        if (timeout) timeout -= Date.now() - startTime
      }
    }

    if (!checkResult()) {
      await waitForResult()
    }
  }

  const waitForValueToChange = async (selector: () => unknown, options: WaitOptions = {}) => {
    const initialValue = selector()
    try {
      await waitFor(() => selector() !== initialValue, {
        suppressErrors: false,
        ...options
      })
    } catch (error: unknown) {
      if (error instanceof TimeoutError && options.timeout) {
        throw new TimeoutError(waitForValueToChange, options.timeout)
      }
      throw error as Error
    }
  }

  return {
    waitFor,
    waitForNextUpdate,
    waitForValueToChange
  }
}

export default asyncUtils