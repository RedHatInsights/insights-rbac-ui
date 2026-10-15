import { defineConfig } from 'tsup';
import type { Plugin } from 'esbuild';
import { copyFileSync } from 'fs';

// Stub out react-devtools-core — ink loads this only when DEV=true, it's not installed
const stubReactDevtools: Plugin = {
  name: 'stub-react-devtools-core',
  setup(build) {
    build.onResolve({ filter: /^react-devtools-core$/ }, (args) => ({
      path: args.path,
      namespace: 'stub-devtools',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub-devtools' }, () => ({
      contents: 'export default { connectToDevTools() {} };',
      loader: 'js',
    }));
  },
};

export default defineConfig({
  entry: ['src/cli/cli.tsx'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outDir: 'dist-cli',
  bundle: true,
  splitting: false,
  clean: true,
  // Bundle everything — internal tool, no shipping constraints
  noExternal: [/.*/],
  // Playwright cannot be bundled (native binaries + dynamic requires)
  external: ['playwright', 'playwright-core'],
  outExtension() {
    return { js: '.mjs' };
  },
  // CJS modules inside the ESM bundle need require(), __dirname, and __filename
  banner: {
    js: "import { createRequire } from 'module'; import { fileURLToPath } from 'url'; import { dirname } from 'path'; const require = createRequire(import.meta.url); const __filename = fileURLToPath(import.meta.url); const __dirname = dirname(__filename);",
  },
  esbuildPlugins: [stubReactDevtools],
  esbuildOptions(options) {
    options.jsx = 'automatic';
    // noExternal: [/.*/] overrides the top-level external for playwright in tsup,
    // so we force it here where esbuild processes it last
    options.external = [...(options.external ?? []), 'playwright', 'playwright-core', 'chromium-bidi', 'chromium-bidi/*'];
  },
  async onSuccess() {
    // ink uses yoga-wasm-web which resolves './yoga.wasm' relative to the bundle at runtime
    copyFileSync('node_modules/yoga-wasm-web/dist/yoga.wasm', 'dist-cli/yoga.wasm');
    console.log('Copied yoga.wasm → dist-cli/yoga.wasm');
  },
});
