import { useEffect, useState } from 'react'
import { Awaited, UnionToIntersection } from './tsUtils';

type Endpoints = Record<string, (args: any) => any>
type Endpoint = Endpoints[keyof Endpoints]

type HookFn<T extends Endpoint> = (
  ...variables: Parameters<T> extends void
    ? [undefined?]
    : [Parameters<T>][0]
) => {
  loading: boolean
  result: Awaited<ReturnType<T>> | null
  refetch: () => void
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
  return function useEndpointHook(...Args) {
    const [state, setState] = useState<{
      loading: boolean
      result: ReturnType<T> | null
    }>({ loading: true, result: null })

    const fetchResult = () => {
      setState((prev) => ({ ...prev, loading: true }))
      endpoint(Args).then((result: ReturnType<T>) => {
        setState((prev) => ({
          ...prev,
          result,
          loading: false,
        }))
      })
    }

    useEffect(fetchResult, [])

    return {
      ...state,
      refetch: fetchResult,
    }
  }
}

function asHooks<T extends Endpoints>(endpoint: T) {
  const hooks: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(endpoint)) {
    hooks[
      `use${
        key.charAt(0).toUpperCase() + key.slice(1)
      }Query`
    ] = makeEndpointHook(val)
  }

  return hooks as UnionToIntersection<Hooks<T>>
}

function baseFetch<JSONResponse extends unknown>(
  url: string,
  options?: RequestInit
) {
  return global
    .fetch(url, options)
    .then((res) => res.json() as Promise<JSONResponse>)
}

function makeEndpointBuilder(
  f: typeof baseFetch = baseFetch
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
      return f<Result>(url, {
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

type CreateApi = {
  <T extends Endpoints>(
    options: CreateApiOptions<T>
  ): UnionToIntersection<Hooks<T>>
}

export const createApi: CreateApi = ({
  baseFetch,
  endpoints,
}) => {
  const builder = makeEndpointBuilder(baseFetch)

  return asHooks(endpoints(builder))
}
