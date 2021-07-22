import * as ReactDOMServer from 'react-dom/server'
import * as ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'

import { RendererOptions, RendererProps } from '../types/react'

import { createRenderHook } from '../core'
import { createTestHarness } from '../helpers/createTestHarness'

function createServerRenderer<TProps, TResult>(
  rendererProps: RendererProps<TProps, TResult>,
  { wrapper }: RendererOptions<TProps>
) {
  let renderProps: TProps | undefined
  let container: HTMLDivElement | undefined
  let serverOutput: string = ''
  const testHarness = createTestHarness(rendererProps, wrapper, false)
  let root: any
  return {
    render(props?: TProps) {
      renderProps = props
      act(() => {
        try {
          serverOutput = ReactDOMServer.renderToString(testHarness(props))
        } catch (e: unknown) {
          rendererProps.setError(e as Error)
        }
      })
    },
    hydrate() {
      if (container) {
        throw new Error('The component can only be hydrated once')
      } else {
        container = document.createElement('div')
        container.innerHTML = serverOutput
        act(() => {
          // @ts-ignore
          root = ReactDOM.hydrateRoot(container, testHarness(renderProps))
        })
      }
    },
    rerender(props?: TProps) {
      if (!container) {
        throw new Error('You must hydrate the component before you can rerender')
      }
      act(() => {
        root.render(testHarness(props))
      })
    },
    unmount() {
      if (container) {
        act(() => {
          root.unmount()
        })
      }
    },
    act
  }
}

const renderHook = createRenderHook(createServerRenderer)

export { renderHook, act }

export { cleanup, addCleanup, removeCleanup, suppressErrorOutput } from '../core'

export * from '../types/react'
