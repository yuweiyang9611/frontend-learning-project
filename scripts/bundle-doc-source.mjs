// Source read in place: copies the repository files the learning site can show into docs/public/source
// as plain text, with index.json beside them. Runs before `vitepress build` and `vitepress dev`; the
// output is generated and ignored by git.
import path from 'node:path';
import { writeSourceBundle } from '../docs/.vitepress/theme/source-bundle.mjs';

const repositoryRoot = process.cwd();
const outputDirectory = path.join(repositoryRoot, 'docs', 'public', 'source');
const index = writeSourceBundle({
  repositoryRoot,
  outputDirectory,
  repository: 'https://github.com/yuweiyang9611/frontend-learning-project',
});

const bytes = index.files.reduce((total, file) => total + file.bytes, 0);
if (index.files.length < 150) {
  console.error(`Source bundle is too small: ${index.files.length} file(s). The learning folders may have moved.`);
  process.exit(1);
}
console.log(
  `Bundled ${index.files.length} source file(s), ${(bytes / 1024).toFixed(0)} KB, at ${index.revision.slice(0, 7)} into docs/public/source.`,
);
