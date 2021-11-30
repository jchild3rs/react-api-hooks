import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

type Awaited<T> = T extends PromiseLike<infer U>
  ? Awaited<U>
  : T

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Endpoint = (args: any) => any
type Endpoints = Record<string, Endpoint>

type HookFn<T extends Endpoint> = (
  options: {
    variables: Parameters<T>[0],
    initialResult?: Awaited<ReturnType<T>>
  }
) => {
  loading: boolean
  result: Awaited<ReturnType<T>> | null
  refetch: (variables?: Parameters<T>[0]) => void

}

type Hooks<T extends Endpoints> = keyof T extends infer Keys
  ? Keys extends string
  ? {
    [K in Keys as `use${Capitalize<K>}Query`]: HookFn<
      T[keyof T]
    >
  }
  : never
  : never

function makeEndpointHook<T extends Endpoint>(
  endpoint: T
): HookFn<T> {
  return function useEndpointHook(options) {
    const [state, setState] = useState<{ result: ReturnType<T> | null, loading: boolean, variables: any }>({
      loading: !options.initialResult,
      result: options.initialResult ?? null,
      variables: options.variables
    })
    const variablesRef = useRef(null)

    const fetcher = useCallback((vars) => {
      setState(prev => ({ ...prev, loading: true }))

      return endpoint(vars).then(
        (result: ReturnType<T>) => {
          setState(prev => ({ ...prev, result, loading: false }))
        }
      )

    }, [])

    useEffect(() => {
      fetcher(state.variables)
    }, [fetcher, state.variables])

    useEffect(() => {
      if (variablesRef.current && JSON.stringify(options.variables) === JSON.stringify(variablesRef.current)) {
        return;
      }
      variablesRef.current = options.variables

      setState(prev => ({ ...prev, variables: options.variables }))
    }, [options])

    return {
      ...state,
      refetch: variables => {
        setState(prev => ({ ...prev, variables }))
      },
    }
  }
}

function asHooks<T extends Endpoints>(endpoints: T): UnionToIntersection<Hooks<T>> {
  const hooks: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(endpoints)) {
    hooks[
      `use${key.charAt(0).toUpperCase() + key.slice(1)
      }Query`
    ] = makeEndpointHook(val)
  }

  return hooks as UnionToIntersection<Hooks<T>>
}

async function baseFetch<JSONResponse = unknown>(
  url: string,
  options?: RequestInit
) {
  const res = await fetch(url, options)

  return await (res.json() as Promise<JSONResponse>)
}

function makeEndpointBuilder(
  fetch: typeof baseFetch = baseFetch
) {
  return function endpointBuilder<Result, Args = undefined>(
    url: string,
    query: string
  ) {
    return function fetcher(
      ...args: Args extends undefined
        ? [undefined?]
        : [Args]
    ) {
      return fetch<Result>(url, {
        method: 'POST',
        body: JSON.stringify({ query, variables: args[0] }),
      })
    }
  }
}

type Builder = ReturnType<typeof makeEndpointBuilder>

type CreateApiOptions<T> = {
  baseFetch?: typeof baseFetch
  endpoints: (builder: Builder) => T
}

export const createApi = <T extends Endpoints>({
  baseFetch,
  endpoints,
}: CreateApiOptions<T>): UnionToIntersection<Hooks<T>> => {
  const builder = makeEndpointBuilder(baseFetch)

  return asHooks<T>(endpoints(builder))
}
