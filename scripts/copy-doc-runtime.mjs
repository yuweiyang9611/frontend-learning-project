// Run in the browser: copies the esbuild-wasm browser entry and its WebAssembly binary into
// docs/public/runtime, where RunPanel.vue loads them on the first 运行 click. Runs before `vitepress
// build` and `vitepress dev`; the output is generated and ignored by git. Fails loudly when the package
// is missing rather than leaving the site without a transpiler.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const repositoryRoot = process.cwd();
const outputDirectory = path.join(repositoryRoot, 'docs', 'public', 'runtime');

let packageRoot;
try {
  packageRoot = path.dirname(require.resolve('esbuild-wasm/package.json'));
} catch {
  console.error('esbuild-wasm is not installed. Run "npm ci" before building the learning site.');
  process.exit(1);
}
const { version } = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const files = [
  ['esm/browser.min.js', 'esbuild.js'],
  ['esbuild.wasm', 'esbuild.wasm'],
];

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });
let bytes = 0;
for (const [from, to] of files) {
  const source = path.join(packageRoot, from);
  if (!fs.existsSync(source)) {
    console.error(`esbuild-wasm ${version} has no ${from}; the runtime cannot be copied.`);
    process.exit(1);
  }
  fs.copyFileSync(source, path.join(outputDirectory, to));
  bytes += fs.statSync(source).size;
}
fs.writeFileSync(path.join(outputDirectory, 'manifest.json'), JSON.stringify({ transpiler: 'esbuild-wasm', version, files: files.map(([, to]) => to) }));
console.log(`Copied esbuild-wasm ${version} (${(bytes / 1024 / 1024).toFixed(1)} MB) into docs/public/runtime.`);
