# React API Hooks

React API hooks allow you to build hooks for your API calls.

## Installation

```npm
npm install react-api-hooks
```

or

```npm
yarn install react-api-hooks
```

## Usage

```typescript
import { createApi } from 'react-api-hooks'

const api = createApi({
  endpoints: (builder) => ({
    getOne: builder<{ data: string }>('/graphql1', 'query One {}'),
    getTwo: builder<{ data: string }, { someVar: string }>(
      '/graphql2',
      'query Two {}'
    )
  })
})

export const { useGetOne, useGetTwo } = api;
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
