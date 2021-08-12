// import resolve from '@rollup/plugin-node-resolve'
// import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'

import pkg from './package.json'

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: 'src/index.ts',
  external: ['react'],
  output: {
    file: pkg.module,
    format: 'es',
    dir: './dist',
  },
  plugins: [typescript()],
}

export default config
