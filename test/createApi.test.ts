import { renderHook } from '@testing-library/react-hooks'
import fetchMock from 'jest-fetch-mock'
import { createApi } from '../src'

describe('createApi', () => {
  beforeEach(() => {
    fetchMock.mockResponse(JSON.stringify({ data: '12345' }))
  })

  it('generates usable data-fetching hooks', async () => {
    const api = createApi({
      endpoints: (builder) => ({
        getOne: builder<{ data: string }>('/graphql1', 'query One {}'),
        getTwo: builder<{ data: string }, { someVar: string }>(
          '/graphql2',
          'query Two {}'
        ),
      }),
    })

    expect(api.useGetOneQuery).toBeDefined()

    const { result, waitForNextUpdate } = renderHook(() => api.useGetOneQuery())

    expect(result.current).toEqual(
      expect.objectContaining({
        loading: true,
        result: null,
      })
    )

    await waitForNextUpdate()

    expect(global.fetch).toHaveBeenCalled()
    expect(result.current).toEqual(
      expect.objectContaining({
        loading: false,
        result: { data: '12345' },
        refetch: expect.any(Function),
      })
    )
  })
})
