// Build-time outline of the course for the opening screen and the loop band: weeks from the course
// overview table, days from each week's `## Day NN：title {#day-NN}` headings, checked against the daily
// manifests; then every lesson page (week, learning, typescript, backend) with its runnable panels
// and its weekly check, so a band can be read from the records without touching the DOM.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fenceRun, markdownFences } from './run-code.mjs';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function read(relative) {
  return fs.readFileSync(path.join(docsRoot, relative), 'utf8');
}

function pageNames(directory) {
  return fs
    .readdirSync(path.join(docsRoot, directory))
    .filter((name) => name.endsWith('.md') && name !== 'README.md' && name !== 'index.md')
    .sort();
}

function countPages(directory) {
  return pageNames(directory).length;
}

/** The runnable fences of one page, decided the way the markdown rule decides them. */
export function countRunnable(source) {
  return markdownFences(source).filter((fence) => fenceRun(fence.info, fence.content).run).length;
}

function heading(source) {
  return (source.match(/^# (.+?)\s*$/m)?.[1] ?? '').trim();
}

export function loadCourse() {
  const overview = read('90-days/README.md');
  const weekRows = [
    ...overview.matchAll(/^\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\((week-\d\d-[a-z0-9-]+)\.md\)\s*\|\s*([^|]+?)\s*\|\s*(\d+)\s*小时\s*\|/gm),
  ];
  const lessons = [];
  const weeks = weekRows.map(([, number, title, file, deliverable, hours]) => {
    const week = Number(number);
    const source = read(`90-days/${file}.md`);
    const manifest = JSON.parse(read(`90-days/data/days/week-${String(week).padStart(2, '0')}.json`));
    const days = [...source.matchAll(/^## Day (\d+)：(.+?)\s*\{#(day-\d+)\}\s*$/gm)].map(([, day, dayTitle, anchor]) => ({
      day: Number(day),
      title: dayTitle.trim(),
      link: `/90-days/${file}.html#${anchor}`,
    }));
    for (const entry of manifest) {
      const day = days.find((candidate) => candidate.day === entry.day);
      if (!day || entry.source !== `${file}.md#${day.link.split('#')[1]}`) {
        throw new Error(`Day ${entry.day} in week ${week} does not match a heading in ${file}.md`);
      }
    }
    const quiz = source.includes('<WeeklyKnowledgeCheck')
      ? JSON.parse(read(`90-days/data/quizzes/week-${String(week).padStart(2, '0')}.json`)).questions.map((question) => question.id)
      : null;
    lessons.push({ path: `90-days/${file}`, kind: 'week', week, title: title.trim(), link: `/90-days/${file}.html`, runnable: countRunnable(source), quiz });
    return { week, title: title.trim(), deliverable: deliverable.trim(), hours: Number(hours), link: `/90-days/${file}.html`, days };
  });

  const dayCount = weeks.reduce((sum, week) => sum + week.days.length, 0);
  if (weeks.length !== 13 || dayCount !== 91) {
    throw new Error(`Expected 13 weeks and 91 days in the course overview, found ${weeks.length} and ${dayCount}`);
  }

  for (const directory of ['learning', 'typescript', 'backend']) {
    for (const name of pageNames(directory)) {
      const source = read(`${directory}/${name}`);
      const file = name.replace(/\.md$/, '');
      lessons.push({ path: `${directory}/${file}`, kind: directory, week: null, title: heading(source), link: `/${directory}/${file}.html`, runnable: countRunnable(source), quiz: null });
    }
  }

  return {
    weeks,
    lessons,
    pages: {
      learning: countPages('learning'),
      typescript: countPages('typescript'),
      backend: countPages('backend'),
      reference: countPages('reference'),
    },
  };
}

export default {
  watch: [
    '../../90-days/README.md',
    '../../90-days/week-*.md',
    '../../90-days/data/days/*.json',
    '../../90-days/data/quizzes/*.json',
    '../../learning/*.md',
    '../../typescript/*.md',
    '../../backend/*.md',
  ],
  load: loadCourse,
};
