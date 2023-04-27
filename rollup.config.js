import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

export default {
  input: 'index',
  output: [
    {
      format: 'esm',
      file: 'bundle.js'
    },
  ],
  plugins: [resolve(), json()],
};