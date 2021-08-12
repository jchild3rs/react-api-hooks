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
  return function useEndpointHook(...args) {
    const [variables] = args
    const [result, setResult] =
      useState<ReturnType<T> | null>(null)
    const variablesRef = useRef(variables)

    const fetchResult = useCallback(() => {
      endpoint(variablesRef.current).then(
        (result: ReturnType<T>) => {
          setResult(result)
        }
      )
    }, [])

    useEffect(fetchResult, [fetchResult])

    return {
      result,
      loading: null == result,
      refetch: fetchResult,
    }
  }
}

function asHooks<T extends Endpoints>(endpoints: T): UnionToIntersection<Hooks<T>> {
  const hooks: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(endpoints)) {
    hooks[
      `use${
        key.charAt(0).toUpperCase() + key.slice(1)
      }Query`
    ] = makeEndpointHook(val)
  }

  return hooks as UnionToIntersection<Hooks<T>>
}

async function baseFetch<JSONResponse extends unknown>(
  url: string,
  options?: RequestInit
) {
  const res=await fetch(url,options)
  
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
