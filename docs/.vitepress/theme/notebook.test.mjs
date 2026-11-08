import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { createMarkdownRenderer } from 'vitepress';
import { loadCourse } from './course.data.mjs';
import {
  PHASES,
  STEPS,
  VISITS_STORAGE_KEY,
  continueLesson,
  courseState,
  decodeVisits,
  lessonFor,
  lessonKey,
  lessonSteps,
  markVisit,
  pageBand,
  readRecords,
  sinceText,
  stepNow,
  weekCheck,
  weekPhase,
} from './course-record.mjs';
import { LOOSE_MARKS, haltParts, joinsWithoutSpace, notebookMarkdown } from './notebook-text.mjs';
import { createProgress, PROGRESS_STORAGE_KEY } from './progress-state.mjs';
import { REVIEW_STORAGE_KEY } from './review-state.mjs';
import { bridgeIsDark, chooseScheme, headBridge, storedScheme } from './theme-sync.mjs';

const kitFile = (path) => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const sha256 = (text) => createHash('sha256').update(text).digest('hex');

function memoryStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test('the kit files are unedited copies of kit v1', () => {
  assert.equal(sha256(kitFile('../../public/kit/theme.js')), '2f26afc56d0152d02f363af644ac51b552a890e02d3e81542795aba6b8d5d5e0');
  // Kit v1 with the loop band (.nb-steps), vendored 2026-11-06 for the third phase.
  assert.equal(sha256(kitFile('./kit/notebook.css')), 'f6f8b7094199d012536942ccc75fce688950b3823207ce5456577d1086c82369');
  assert.equal(sha256(kitFile('../../public/favicon.svg')), '3ea07acd66b71bcef6462252c4e437ee6622f57898089bbb891410e57b20dc0e');
});

test('the build-time pattern is the one theme.js squeezes at run time', () => {
  const kit = kitFile('../../public/kit/theme.js');
  const source = kit.match(/const looseMarks = \/(.+)\/g;/)?.[1];
  assert.equal(LOOSE_MARKS.source, source);
  assert.equal(LOOSE_MARKS.flags, 'g');
});

test('haltParts splits off each mark that touches a comma, stop or opening quote', () => {
  assert.deepEqual(haltParts('他说“好”，然后走了。“下一句”'), [
    { text: '他说“好', halt: false },
    { text: '”', halt: true },
    { text: '，然后走了', halt: false },
    { text: '。', halt: true },
    { text: '“下一句”', halt: false },
  ]);
  assert.deepEqual(haltParts('没有相邻标点。'), [{ text: '没有相邻标点。', halt: false }]);
  assert.deepEqual(haltParts(''), []);
  for (const part of haltParts('“甲”，“乙”。“丙”；')) {
    if (!part.halt) assert.equal(part.text.search(LOOSE_MARKS), -1);
  }
});

test('a line break inside Chinese copy only becomes a space next to Latin text', () => {
  assert.equal(joinsWithoutSpace('，', 'I'), true);
  assert.equal(joinsWithoutSpace('例', '共'), true);
  assert.equal(joinsWithoutSpace('例', '（'), true);
  assert.equal(joinsWithoutSpace('”', '和'), true);
  assert.equal(joinsWithoutSpace('使', 'T'), false);
  assert.equal(joinsWithoutSpace('t', '和'), false);
  assert.equal(joinsWithoutSpace('a', 'b'), false);
  assert.equal(joinsWithoutSpace('', '和'), false);
});

test('markdown emits the half-width spans and joins Chinese lines, leaving code alone', async () => {
  const md = await createMarkdownRenderer(process.cwd(), { config: (instance) => notebookMarkdown(instance) });
  const html = md.render(
    ['课程以 IssueFlow 为持续案例，', '共 **13 周**。他说“好”，然后', 'TypeScript 继续。', '', '`“甲”，` 和 “乙”。', '', '```text', '“丙”，', '```'].join('\n'),
  );
  assert.match(html, /持续案例，共 <strong>/);
  assert.match(html, /“好<span class="nb-halt">”<\/span>，然后\nTypeScript/);
  assert.match(html, /<code>“甲”，<\/code>/);
  assert.doesNotMatch(html.split('<pre')[1] ?? '', /nb-halt/);
  assert.equal(html.replace(/<pre[\s\S]*?<\/pre>/g, '').replace(/<code>[^<]*<\/code>/g, '').replace(/<[^>]+>/g, '|').search(/[”’][，。、；：？！]|[，。、；：？！][“‘]/), -1);
});

test('the scheme follows site-theme first and the old VitePress choice only as a fallback', () => {
  assert.equal(storedScheme(memoryStorage({ 'site-theme': 'dark', 'vitepress-theme-appearance': 'light' })), 'dark');
  assert.equal(storedScheme(memoryStorage({ 'vitepress-theme-appearance': 'dark' })), 'dark');
  assert.equal(storedScheme(memoryStorage({ 'site-theme': 'auto', 'vitepress-theme-appearance': 'auto' })), null);
  assert.equal(storedScheme(null), null);
  assert.equal(
    storedScheme({
      getItem() {
        throw new Error('blocked');
      },
    }),
    null,
  );

  const storage = memoryStorage();
  const root = { dataset: { theme: 'light' }, ownerDocument: null };
  chooseScheme(root, storage, 'dark');
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(storage.getItem('site-theme'), 'dark');
  chooseScheme(root, storage, 'auto');
  assert.equal(storage.getItem('site-theme'), 'dark');
});

test('the inline head bridge is self-contained and keeps the dark class with data-theme', () => {
  const classes = new Set(['mac']);
  const observers = [];
  const root = {
    dataset: { theme: 'light' },
    classList: {
      contains: (name) => classes.has(name),
      add: (name) => classes.add(name),
      toggle: (name, force) => (force ? classes.add(name) : classes.delete(name)),
    },
  };
  const meta = { content: '', setAttribute: (name, value) => (meta[name] = value) };
  const context = {
    document: { documentElement: root, querySelector: () => meta },
    localStorage: memoryStorage({ 'vitepress-theme-appearance': 'dark' }),
    MutationObserver: class {
      constructor(callback) {
        observers.push(callback);
      }
      observe() {}
    },
  };
  vm.runInNewContext(`(${headBridge.toString()})();`, context);
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(classes.has('dark'), true);
  assert.equal(classes.has('js'), true);
  assert.equal(meta.content, '#1c1a17');

  root.dataset.theme = 'light';
  observers[0]([{ attributeName: 'data-theme' }]);
  assert.equal(classes.has('dark'), false);
  classes.add('dark');
  observers[0]([{ attributeName: 'class' }]);
  assert.equal(root.dataset.theme, 'dark');
});

test('VitePress isDark follows data-theme and writes back without storing a choice', () => {
  const callbacks = [];
  const watchers = [];
  globalThis.MutationObserver = class {
    constructor(callback) {
      callbacks.push(callback);
    }
    observe() {}
  };
  try {
    const root = { dataset: { theme: 'dark' }, ownerDocument: null };
    const isDark = { value: false };
    bridgeIsDark(isDark, root, (source, callback) => watchers.push(callback));
    assert.equal(isDark.value, true);
    root.dataset.theme = 'light';
    callbacks[0]();
    assert.equal(isDark.value, false);
    watchers[0](true);
    assert.equal(root.dataset.theme, 'dark');
  } finally {
    delete globalThis.MutationObserver;
  }
});

test('the course outline has 13 weeks and 91 day anchors from the week pages', () => {
  const course = loadCourse();
  assert.equal(course.weeks.length, 13);
  const days = course.weeks.flatMap((week) => week.days);
  assert.deepEqual(
    days.map((day) => day.day),
    Array.from({ length: 91 }, (_, index) => index + 1),
  );
  assert.equal(days[0].link, '/90-days/week-01-foundations.html#day-01');
  assert.equal(days[90].link, '/90-days/week-13-capstone.html#day-91');
  assert.ok(days.every((day) => day.title.length > 0 && !day.title.includes('{#')));
  assert.deepEqual(course.pages, { learning: 13, typescript: 9, backend: 4, reference: 6 });

  // The lesson outline the loop band reads: 39 pages in course order, the week pages first.
  assert.equal(course.lessons.length, 39);
  assert.deepEqual(
    course.lessons.map((lesson) => lesson.kind),
    [...Array(13).fill('week'), ...Array(13).fill('learning'), ...Array(9).fill('typescript'), ...Array(4).fill('backend')],
  );
  assert.equal(course.lessons[0].path, '90-days/week-01-foundations');
  assert.equal(course.lessons[0].week, 1);
  assert.equal(course.lessons[0].quiz.length, 12);
  assert.equal(course.lessons[0].quiz[0], 'w01-q01');
  assert.equal(course.lessons[0].runnable, 0);
  assert.equal(course.lessons[4].runnable, 3, 'week 5 has three runnable fences');
  assert.equal(course.lessons[13].path, 'learning/00-getting-started');
  assert.equal(course.lessons[13].quiz, null);
  assert.equal(course.lessons[26].title, '01：从 C# 到 TypeScript');
  // 49 of the 138 TS and JS fences on the lesson pages run in the browser.
  assert.equal(course.lessons.reduce((total, lesson) => total + lesson.runnable, 0), 49);
  assert.equal(course.lessons.filter((lesson) => lesson.runnable > 0).length, 14);
});

test('the opening screen reads the same record the tracker writes', () => {
  const { weeks } = loadCourse();
  const empty = courseState(weeks, null);
  assert.equal(empty.started, false);
  assert.equal(empty.next.day, 1);
  assert.equal(empty.stoppedWeek, null);
  assert.equal(empty.completed, 0);

  // Local noon on both days, so 6 天前 is six calendar days in any time zone.
  const progress = createProgress();
  for (const day of progress.days.slice(0, 9)) {
    Object.assign(day, {
      completed: true,
      completedAt: new Date(2026, 9, 20, 12).toISOString(),
      minutes: 120,
      note: '这一天的复盘至少有二十个字，并说明了证据和下一步。',
      evidence: [{ label: 'x', url: '/learning-evidence/report.json' }],
    });
  }
  const storage = memoryStorage({ [PROGRESS_STORAGE_KEY]: JSON.stringify(progress) });
  const { progress: stored } = readRecords(storage);
  const state = courseState(weeks, stored, new Date(2026, 9, 26, 12).getTime());
  assert.equal(state.started, true);
  assert.equal(state.completed, 9);
  assert.equal(state.next.day, 10);
  assert.equal(state.stoppedWeek, 2);
  assert.equal(state.lastCompleted, '6 天前');
  assert.deepEqual(state.weeks.slice(0, 3).map((week) => week.completed), [7, 2, 0]);

  // A completed day that lacks its evidence is not counted, exactly as the tracker shows it.
  progress.days[0].evidence = [];
  const revoked = courseState(weeks, readRecords(memoryStorage({ [PROGRESS_STORAGE_KEY]: JSON.stringify(progress) })).progress);
  assert.equal(revoked.completed, 8);
  assert.equal(revoked.next.day, 1);

  assert.equal(courseState(weeks, readRecords(memoryStorage({ [PROGRESS_STORAGE_KEY]: '{bad' })).progress).started, false);
});

test('relative times count calendar days in the local time zone, as the project index does', () => {
  // Built from local dates and times, so each case means the same in any time zone.
  const at = (day, hour, minute = 0, second = 0) => new Date(2026, 10, day, hour, minute, second).getTime();
  assert.equal(sinceText(at(8, 0, 5), at(8, 23, 55)), '今天', 'early this morning, late tonight');
  assert.equal(sinceText(at(7, 23), at(8, 8)), '昨天', 'nine hours ago, but on the day before');
  assert.equal(sinceText(at(7, 23, 59, 30), at(8, 0, 0, 30)), '昨天', 'a minute ago, across midnight');
  assert.equal(sinceText(at(7, 0, 0), at(8, 23, 59)), '昨天', 'almost two days, one midnight');
  assert.equal(sinceText(at(5, 23, 59), at(8, 8)), '3 天前', 'three midnights in 56 hours');
  assert.equal(sinceText(at(9, 10), at(8, 8)), '今天', 'a time in the future reads as today');
});

test('weekly check state counts only that week and only answered questions', () => {
  const review = {
    app: 'issueflow-learning-review',
    schemaVersion: 1,
    records: {
      'w01-q01': { stage: 0, lastCorrect: false, lastAnsweredAt: 'a', dueAt: 'a', attempts: 1 },
      'w01-q02': { stage: 1, lastCorrect: true, lastAnsweredAt: 'a', dueAt: 'a', attempts: 1 },
      'w10-q01': { stage: 1, lastCorrect: true, lastAnsweredAt: 'a', dueAt: 'a', attempts: 1 },
    },
  };
  const { review: stored } = readRecords(memoryStorage({ [REVIEW_STORAGE_KEY]: JSON.stringify(review) }));
  assert.deepEqual(weekCheck(stored, 1), { answered: 2, correct: 1 });
  assert.deepEqual(weekCheck(stored, 10), { answered: 1, correct: 1 });
  assert.equal(weekCheck(stored, 2), null);
  assert.equal(weekCheck(null, 1), null);
});

test('every week sits in one phase with a hue that is not red', () => {
  const covered = PHASES.flatMap((phase) => phase.weeks);
  assert.deepEqual(
    [...covered].sort((left, right) => left - right),
    Array.from({ length: 13 }, (_, index) => index + 1),
  );
  for (const phase of PHASES) {
    assert.ok(['green', 'cyan', 'blue', 'purple'].includes(phase.hue), phase.word);
    assert.ok(phase.word.length > 0);
  }
  assert.equal(weekPhase(1).hue, 'green');
  assert.equal(weekPhase(8).word, 'React');
  assert.equal(weekPhase(13).hue, 'purple');
});

test('the page band carries the week and its days done, the record pages the course, other pages none', () => {
  const { weeks } = loadCourse();
  const progress = createProgress();
  for (const day of progress.days.slice(0, 9)) {
    Object.assign(day, {
      completed: true,
      completedAt: '2026-10-20T00:00:00.000Z',
      minutes: 120,
      note: '这一天的复盘至少有二十个字，并说明了证据和下一步。',
      evidence: [{ label: 'x', url: '/learning-evidence/report.json' }],
    });
  }
  const records = readRecords(memoryStorage({ [PROGRESS_STORAGE_KEY]: JSON.stringify(progress) }));
  const none = { progress: null, review: null };

  assert.deepEqual(pageBand('90-days/week-02-html-accessibility.md', weeks, records), {
    hue: 'green',
    eyebrow: '第 2 周 · Web 基础',
    label: '第 2 周进度',
    note: '2 / 7 天',
    value: 2,
    max: 7,
  });
  assert.equal(pageBand('90-days/week-02-html-accessibility.md', weeks, none).note, '0 / 7 天');
  assert.equal(pageBand('90-days/week-13-capstone.md', weeks, none).hue, 'purple');
  assert.deepEqual(pageBand('90-days/progress-and-journal.md', weeks, records), {
    hue: 'blue',
    eyebrow: '记录 · 91 天进度',
    label: '91 天课程进度',
    note: '9 / 91 天',
    value: 9,
    max: 91,
  });
  assert.equal(pageBand('90-days/progress-and-journal.md', weeks, none).note, '还没有记录');
  const review = {
    app: 'issueflow-learning-review',
    schemaVersion: 1,
    records: {
      'w01-q01': { stage: 0, lastCorrect: false, lastAnsweredAt: 'a', dueAt: '2000-01-01T00:00:00.000Z', attempts: 1 },
      'w01-q02': { stage: 1, lastCorrect: true, lastAnsweredAt: 'a', dueAt: '2999-01-01T00:00:00.000Z', attempts: 1 },
    },
  };
  const reviewed = readRecords(memoryStorage({ [REVIEW_STORAGE_KEY]: JSON.stringify(review) }));
  assert.deepEqual(pageBand('90-days/review-center.md', weeks, reviewed), {
    hue: 'blue',
    eyebrow: '记录 · 错题与间隔复习',
    label: '周测题目掌握进度',
    note: '1 / 2 题答对 · 1 题待订正 · 1 题到期',
    value: 1,
    max: 2,
  });
  assert.equal(pageBand('90-days/review-center.md', weeks, none).max, 0);
  assert.equal(pageBand('90-days/how-to-study.md', weeks, records), null);
  assert.equal(pageBand('learning/index.md', weeks, records), null);
  assert.equal(pageBand('index.md', weeks, records), null);
});

function doneDays(progress, count) {
  for (const day of progress.days.slice(0, count)) {
    Object.assign(day, {
      completed: true,
      completedAt: '2026-10-20T00:00:00.000Z',
      minutes: 120,
      note: '这一天的复盘至少有二十个字，并说明了证据和下一步。',
      evidence: [{ label: 'x', url: '/learning-evidence/report.json' }],
    });
  }
  return progress;
}

test('the visits record is a third key beside progress and review, read and written in one shape', () => {
  assert.equal(VISITS_STORAGE_KEY, 'issueflow:frontend-learning-project:visits:v1');
  assert.equal(lessonKey('90-days/week-05-typescript-foundations.md'), '90-days/week-05-typescript-foundations');
  assert.equal(lessonKey('/typescript/01-from-csharp-to-typescript.html'), 'typescript/01-from-csharp-to-typescript');
  const storage = memoryStorage();
  assert.equal(markVisit(storage, 'typescript/01-from-csharp-to-typescript.md', 'readAt', '2026-11-06T01:00:00.000Z'), true);
  assert.equal(markVisit(storage, 'typescript/01-from-csharp-to-typescript.md', 'readAt', '2026-11-06T02:00:00.000Z'), false, 'set once');
  assert.equal(markVisit(storage, 'typescript/01-from-csharp-to-typescript.md', 'ranAt', '2026-11-06T03:00:00.000Z'), true);
  assert.equal(markVisit(storage, 'typescript/01-from-csharp-to-typescript.md', 'other', '2026-11-06T03:00:00.000Z'), false);
  assert.deepEqual(JSON.parse(storage.getItem(VISITS_STORAGE_KEY)), {
    app: 'issueflow-learning-visits',
    schemaVersion: 1,
    pages: { 'typescript/01-from-csharp-to-typescript': { readAt: '2026-11-06T01:00:00.000Z', ranAt: '2026-11-06T03:00:00.000Z' } },
  });
  const { visits } = readRecords(storage);
  assert.equal(visits.pages['typescript/01-from-csharp-to-typescript'].readAt, '2026-11-06T01:00:00.000Z');
  assert.deepEqual(readRecords(memoryStorage({ [VISITS_STORAGE_KEY]: '{bad' })).visits.pages, {});
  assert.deepEqual(
    decodeVisits({
      app: 'issueflow-learning-visits',
      schemaVersion: 1,
      pages: { '../x': { readAt: 'a' }, 'learning/01': { readAt: 'not a date', codeAt: '2026-11-06T00:00:00.000Z' } },
    }).pages,
    { 'learning/01': { codeAt: '2026-11-06T00:00:00.000Z' } },
  );
  assert.deepEqual(decodeVisits({ app: 'other', schemaVersion: 1, pages: {} }).pages, {});
  // The two records the home site reads keep their keys.
  assert.equal(PROGRESS_STORAGE_KEY, 'issueflow:frontend-learning-project:progress:v1');
  assert.equal(REVIEW_STORAGE_KEY, 'issueflow:frontend-learning-project:review:v1');
});

test('the loop band reads five steps from the records, one 停在这里, none for what the lesson lacks', () => {
  const course = loadCourse();
  const week5 = lessonFor(course, '90-days/week-05-typescript-foundations.md');
  const ts1 = lessonFor(course, 'typescript/01-from-csharp-to-typescript.md');
  const learning0 = lessonFor(course, 'learning/00-getting-started.md');
  assert.equal(lessonFor(course, '90-days/how-to-study.md'), null);
  assert.equal(lessonFor(course, 'typescript/index.md'), null);
  assert.deepEqual(STEPS.map((entry) => entry.step), ['read', 'code', 'run', 'quiz', 'note']);

  // The server render: null records, every step the lesson has is pending and no step is 停在这里.
  const server = lessonSteps(week5, course, null);
  assert.deepEqual(server.map((entry) => [entry.step, entry.state]), [['read', 'pending'], ['code', 'pending'], ['run', 'pending'], ['quiz', 'pending'], ['note', 'pending']]);
  assert.deepEqual(lessonSteps(learning0, course, null).map((entry) => entry.state), ['pending', 'none', 'none', 'none', 'none']);
  assert.equal(stepNow(server), null);

  // A reader without a record: the first step is 停在这里, the rest pending.
  const empty = readRecords(memoryStorage());
  assert.deepEqual(lessonSteps(ts1, course, empty).map((entry) => entry.state), ['now', 'pending', 'pending', 'none', 'none']);
  assert.deepEqual(lessonSteps(ts1, course, empty).map((entry) => entry.href), ['#main', '#fe-code-1', '#fe-code-1', '', '']);
  assert.deepEqual(lessonSteps(learning0, course, empty).map((entry) => entry.state), ['now', 'none', 'none', 'none', 'none']);

  // After the reader does one thing, that step is done and the next is 停在这里.
  const storage = memoryStorage();
  markVisit(storage, 'typescript/01-from-csharp-to-typescript.md', 'readAt');
  assert.deepEqual(lessonSteps(ts1, course, readRecords(storage)).map((entry) => entry.state), ['done', 'now', 'pending', 'none', 'none']);
  markVisit(storage, 'typescript/01-from-csharp-to-typescript.md', 'ranAt');
  assert.deepEqual(lessonSteps(ts1, course, readRecords(storage)).map((entry) => entry.state), ['done', 'done', 'done', 'none', 'none'], 'a run opens the code too');
  assert.equal(stepNow(lessonSteps(ts1, course, readRecords(storage))), null);

  // A week page: read from the day records, quiz from the review record, note from a day note.
  const progress = doneDays(createProgress(), 30);
  const review = { app: 'issueflow-learning-review', schemaVersion: 1, records: {} };
  for (const id of week5.quiz.slice(0, 11)) review.records[id] = { stage: 0, lastCorrect: true, lastAnsweredAt: 'a', dueAt: 'a', attempts: 1 };
  const partial = readRecords(memoryStorage({ [PROGRESS_STORAGE_KEY]: JSON.stringify(progress), [REVIEW_STORAGE_KEY]: JSON.stringify(review) }));
  const steps = lessonSteps(week5, course, partial);
  assert.deepEqual(steps.map((entry) => [entry.step, entry.state]), [['read', 'done'], ['code', 'now'], ['run', 'pending'], ['quiz', 'pending'], ['note', 'done']]);
  assert.equal(steps[3].count, '11 / 12');
  assert.equal(steps[4].count, '2 / 7');
  assert.equal(steps[3].href, '#weekly-check-5');
  assert.equal(steps[4].href, '/90-days/progress-and-journal.html');
  review.records['w05-q12'] = { stage: 1, lastCorrect: false, lastAnsweredAt: 'a', dueAt: 'a', attempts: 2 };
  const passed = readRecords(memoryStorage({ [PROGRESS_STORAGE_KEY]: JSON.stringify(progress), [REVIEW_STORAGE_KEY]: JSON.stringify(review) }));
  assert.equal(lessonSteps(week5, course, passed)[3].state, 'done', 'answered correctly once counts even after a later slip');
  const week1 = lessonFor(course, '90-days/week-01-foundations.md');
  assert.deepEqual(lessonSteps(week1, course, partial).map((entry) => entry.state), ['done', 'none', 'none', 'now', 'done']);
});

test('the index continues at the earliest lesson with a 停在这里 step', () => {
  const course = loadCourse();
  const at = (result) => [result.lesson.path, result.step.step];
  const empty = readRecords(memoryStorage());
  assert.deepEqual(at(continueLesson(course, empty)), ['90-days/week-01-foundations', 'read']);
  const progress = doneDays(createProgress(), 8);
  const withDays = readRecords(memoryStorage({ [PROGRESS_STORAGE_KEY]: JSON.stringify(progress) }));
  assert.deepEqual(at(continueLesson(course, withDays)), ['90-days/week-01-foundations', 'quiz']);
  const review = { app: 'issueflow-learning-review', schemaVersion: 1, records: {} };
  for (const id of course.lessons[0].quiz) review.records[id] = { stage: 0, lastCorrect: true, lastAnsweredAt: 'a', dueAt: 'a', attempts: 1 };
  const passedWeek1 = readRecords(memoryStorage({ [PROGRESS_STORAGE_KEY]: JSON.stringify(progress), [REVIEW_STORAGE_KEY]: JSON.stringify(review) }));
  assert.deepEqual(at(continueLesson(course, passedWeek1)), ['90-days/week-02-html-accessibility', 'quiz']);
});
