import { renderHook } from '@testing-library/react-hooks'
import fetchMock from 'jest-fetch-mock'
import { createApi } from '../src'

describe('createApi', () => {
  beforeEach(() => {
    fetchMock.mockResponse(
      JSON.stringify({ data: '12345' })
    )
  })

  it('generates usable data-fetching hooks', async () => {
    const api = createApi({
      endpoints: (builder) => ({
        getOne: builder<{ data: string }>(
          '/graphql1',
          'query One {}'
        ),
        getTwo: builder<
          { data: string },
          { someVar: string }
        >('/graphql2', 'query Two {}'),
      }),
    })

    expect(api.useGetOneQuery).toBeDefined()

    const { result, waitForNextUpdate } = renderHook(() =>
      api.useGetTwoQuery({ variables: { someVar: 'asdf' }, initialResult: { data: 'bar' } })
    )

    expect(result.current).toEqual(
      expect.objectContaining({
        loading: true,
        result: { data: 'bar' },
        refetch: expect.any(Function)
      })
    )

    await waitForNextUpdate()

    expect(global.fetch).toHaveBeenLastCalledWith(
      "/graphql2", { "body": "{\"query\":\"query Two {}\",\"variables\":{\"someVar\":\"asdf\"}}", "method": "POST" }
    )

    expect(result.current).toEqual(
      expect.objectContaining({
        loading: false,
        result: { data: '12345' },
        refetch: expect.any(Function),
      })
    )
  })
})
