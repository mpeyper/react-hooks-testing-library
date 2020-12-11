import { useReducer } from 'react'
import { renderHook, act } from '../../src/server'

describe('useReducer tests', () => {
  test('should handle useReducer hook', () => {
    const reducer = (state, action) => (action.type === 'inc' ? state + 1 : state)

    const { result, hydrate } = renderHook(() => {
      const [state, dispatch] = useReducer(reducer, 0)
      return { state, dispatch }
    })

    hydrate()

    expect(result.current.state).toBe(0)

    act(() => result.current.dispatch({ type: 'inc' }))

    expect(result.current.state).toBe(1)
  })
})
