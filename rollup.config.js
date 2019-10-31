import { terser } from "rollup-plugin-terser";

const input = 'lib/sockly.js';

export default [
  {
    input,
    output: {
      file: `lib/sockly.iife.js`,
      format: 'iife',
      name: 'sockly'
    },
    plugins: [terser()]
  },
  {
    input,
    output: {
      file: `lib/sockly.umd.js`,
      format: 'umd',
      name: 'sockly'
    },
    plugins: [terser()]
  },
  {
    input,
    output: {
      file: `lib/sockly.m.js`,
      format: 'esm'
    },
    plugins: [terser()]
  },
];