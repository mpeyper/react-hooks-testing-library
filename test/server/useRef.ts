import { useRef, useImperativeHandle } from 'react'
import { renderHook } from '../../src/server'

describe('useHook tests', () => {
  test('should handle useRef hook', () => {
    const { result } = renderHook(() => useRef('foo'))

    const refContainer = result.current

    expect(Object.keys(refContainer)).toEqual(['current'])
    expect(refContainer.current).toBe('foo')
  })

  test('should handle useImperativeHandle hook', () => {
    const { result, hydrate } = renderHook(() => {
      const ref = useRef()
      useImperativeHandle(ref, () => ({
        fakeImperativeMethod: () => true
      }))
      return ref
    })

    expect(result.current.current).toBeUndefined()

    hydrate()

    expect(result.current.current.fakeImperativeMethod()).toBe(true)
  })
})