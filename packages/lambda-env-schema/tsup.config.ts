import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    aws: 'src/aws/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: false,
  clean: true,
  minify: 'terser',
  treeshake: {
    preset: 'smallest',
    moduleSideEffects: false,
  },
  terserOptions: {
    compress: {
      passes: 3,
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
      unsafe_math: true,
      unsafe_methods: true,
      unsafe_proto: true,
      unsafe_regexp: true,
      dead_code: true,
      drop_console: false,
      drop_debugger: true,
      ecma: 2020,
      hoist_funs: true,
      hoist_vars: false,
      keep_fargs: false,
      keep_infinity: false,
      reduce_funcs: true,
      reduce_vars: true,
      toplevel: true,
      typeofs: true,
      booleans_as_integers: false,
    },
    mangle: {
      toplevel: true,
      properties: {
        regex: /^_/,
      },
    },
    format: {
      comments: false,
      ecma: 2020,
    },
  },
  target: 'node18',
  esbuildOptions(options) {
    options.drop = ['debugger'];
    options.legalComments = 'none';
    options.charset = 'utf8';
  },
});
