describe('result history tests', () => {
  function useValue(value: number) {
    if (value === 2) {
      throw Error('expected')
    }
    return value
  }

  runForRenderers(['default', 'dom', 'native'], ({ renderHook }) => {
    test('should capture all renders states of hook', () => {
      const { result, rerender } = renderHook((value) => useValue(value), {
        initialProps: 0
      })

      expect(result.current).toEqual(0)
      expect(result.all).toEqual([0])

      rerender(1)

      expect(result.current).toBe(1)
      expect(result.all).toEqual([0, 1])

      rerender(2)

      expect(result.error).toEqual(Error('expected'))
      // double error thrown for dom, but not default or native...
      expect(result.all).toEqual([0, 1, Error('expected'), Error('expected')])

      rerender(3)

      expect(result.current).toBe(3)
      expect(result.all).toEqual([0, 1, Error('expected'), 3])

      rerender()

      expect(result.current).toBe(3)
      expect(result.all).toEqual([0, 1, Error('expected'), 3, 3])
    })
  })

  runForRenderers(['server'], ({ renderHook }) => {
    test('should capture all renders states of hook with hydration', () => {
      const { result, hydrate, rerender } = renderHook((value) => useValue(value), {
        initialProps: 0
      })

      expect(result.current).toEqual(0)
      expect(result.all).toEqual([0])

      hydrate()

      expect(result.current).toEqual(0)
      expect(result.all).toEqual([0, 0])

      rerender(1)

      expect(result.current).toBe(1)
      expect(result.all).toEqual([0, 0, 1])

      rerender(2)

      expect(result.error).toEqual(Error('expected'))
      expect(result.all).toEqual([0, 0, 1, Error('expected')])

      rerender(3)

      expect(result.current).toBe(3)
      expect(result.all).toEqual([0, 0, 1, Error('expected'), 3])

      rerender()

      expect(result.current).toBe(3)
      expect(result.all).toEqual([0, 0, 1, Error('expected'), 3, 3])
    })
  })
})

// eslint-disable-next-line jest/no-export
export {}
