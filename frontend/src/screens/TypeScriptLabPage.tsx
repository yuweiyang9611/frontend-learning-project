'use client';

import {
  BookOpen,
  Braces,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clipboard,
  Code2,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  filterLessons,
  findLesson,
  labOverview,
  lessonCategories,
  typescriptLessons,
  type LabRunResult,
  type LessonCategoryFilter,
  type TypeScriptLesson,
} from '@/src/features/typescript-lab/catalog';
import { PageHeader } from '@/src/components/ui';

export const TYPESCRIPT_LAB_PROGRESS_KEY = 'issueflow-typescript-lab-progress-v1';

function readProgress(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(localStorage.getItem(TYPESCRIPT_LAB_PROGRESS_KEY) ?? '[]') as unknown;
    return Array.isArray(value)
      ? value.filter(
          (item): item is string => typeof item === 'string' && typescriptLessons.some((lesson) => lesson.id === item),
        )
      : [];
  } catch {
    return [];
  }
}

function LessonWorkspace({
  lesson,
  completed,
  onToggleComplete,
}: {
  lesson: TypeScriptLesson;
  completed: boolean;
  onToggleComplete: () => void;
}) {
  const [input, setInput] = useState(lesson.defaultInput);
  const [result, setResult] = useState<LabRunResult | null>(null);
  const [copied, setCopied] = useState(false);
  const inputHintId = `ts-input-hint-${lesson.id}`;

  const run = () => {
    try {
      setResult(lesson.run(input));
    } catch (error: unknown) {
      setResult({
        ok: false,
        title: 'Runner stopped safely',
        output: error instanceof Error ? error.message : 'An unexpected value reached the runner.',
        notes: ['Interactive lessons catch unexpected runtime errors instead of crashing the page.'],
      });
    }
  };
  const reset = () => {
    setInput(lesson.defaultInput);
    setResult(null);
  };
  const copy = async () => {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(lesson.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="ts-lesson-workspace" aria-labelledby="lesson-title">
      <header className="ts-lesson-header">
        <div>
          <div className="ts-lesson-kicker">
            <span>Lesson {String(lesson.order).padStart(2, '0')}</span>
            <span>{lesson.level}</span>
            <span>{lesson.check}</span>
          </div>
          <h2 id="lesson-title" tabIndex={-1}>
            {lesson.title}
          </h2>
          <p>{lesson.summary}</p>
        </div>
        <button
          className={completed ? 'ts-complete-button complete' : 'ts-complete-button'}
          type="button"
          onClick={onToggleComplete}
          aria-pressed={completed}
        >
          {completed ? <CheckCircle2 size={17} /> : <Circle size={17} />}
          {completed ? 'Completed' : 'Mark complete'}
        </button>
      </header>

      <div className="ts-context-grid">
        <section>
          <span className="ts-context-icon coral">
            <BookOpen size={17} />
          </span>
          <div>
            <small>C# bridge</small>
            <p>{lesson.csharpBridge}</p>
          </div>
        </section>
        <section>
          <span className="ts-context-icon green">
            <ShieldCheck size={17} />
          </span>
          <div>
            <small>Production source</small>
            <code>{lesson.productionPath}</code>
          </div>
        </section>
      </div>

      <section className="ts-code-panel" aria-label="TypeScript concept excerpt">
        <header>
          <span>
            <Code2 size={16} /> concept excerpt
          </span>
          <button type="button" onClick={copy} aria-label="Copy TypeScript concept excerpt">
            {copied ? <Check size={15} /> : <Clipboard size={15} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </header>
        <pre tabIndex={0}>
          <code>{lesson.code}</code>
        </pre>
      </section>

      <section className="ts-runner">
        <header>
          <div>
            <p className="eyebrow">Safe playground</p>
            <h3>Run the tested implementation</h3>
          </div>
          <span>
            <TerminalSquare size={15} /> No eval · no API calls
          </span>
        </header>
        {lesson.inputMode !== 'none' && (
          <label className="ts-runner-input">
            <span>{lesson.inputLabel}</span>
            {lesson.inputMode === 'json' ? (
              <textarea
                aria-label={lesson.inputLabel}
                aria-describedby={lesson.inputHint ? inputHintId : undefined}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                spellCheck={false}
                rows={9}
              />
            ) : (
              <input
                aria-label={lesson.inputLabel}
                aria-describedby={lesson.inputHint ? inputHintId : undefined}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                spellCheck={false}
              />
            )}
            {lesson.inputHint && <small id={inputHintId}>{lesson.inputHint}</small>}
          </label>
        )}
        <div className="ts-runner-actions">
          <button className="primary-button" type="button" onClick={run}>
            <Play size={15} /> Run example
          </button>
          <button className="secondary-button" type="button" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div
          className={result ? (result.ok ? 'ts-output success' : 'ts-output error') : 'ts-output waiting'}
          aria-live="polite"
          aria-atomic="true"
        >
          <header>
            <span>{result ? (result.ok ? 'PASS' : 'REJECTED') : 'READY'}</span>
            <strong>{result?.title ?? 'Run the example to inspect its result'}</strong>
          </header>
          <pre>{result?.output ?? 'The output will appear here without executing arbitrary code.'}</pre>
          {result && (
            <ul>
              {result.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <footer className="ts-lesson-footer">
        <div>
          <small>Concepts in this lesson</small>
          <ul>
            {lesson.concepts.map((concept) => (
              <li key={concept}>{concept}</li>
            ))}
          </ul>
        </div>
        <div>
          <small>Next challenge</small>
          <p>{lesson.challenge}</p>
        </div>
      </footer>
    </article>
  );
}

export default function TypeScriptLabPage() {
  const [params, setParams] = useSearchParams();
  const activeLesson = findLesson(params.get('lesson'));
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<LessonCategoryFilter>('All');
  const [completed, setCompleted] = useState<string[]>(readProgress);
  const matchingLessons = useMemo(() => filterLessons(search, category), [category, search]);
  const visibleLessons = useMemo(
    () =>
      matchingLessons.some((lesson) => lesson.id === activeLesson.id)
        ? matchingLessons
        : [activeLesson, ...matchingLessons],
    [activeLesson, matchingLessons],
  );
  const previousLessonId = useRef(activeLesson.id);

  useEffect(() => {
    if (previousLessonId.current === activeLesson.id) return;
    previousLessonId.current = activeLesson.id;
    document.getElementById('lesson-title')?.focus();
  }, [activeLesson.id]);

  const chooseLesson = (lessonId: string) => {
    const next = new URLSearchParams(params);
    next.set('lesson', lessonId);
    setParams(next);
  };
  const toggleComplete = (lessonId: string) => {
    setCompleted((current) => {
      const next = current.includes(lessonId) ? current.filter((id) => id !== lessonId) : [...current, lessonId];
      localStorage.setItem(TYPESCRIPT_LAB_PROGRESS_KEY, JSON.stringify(next));
      return next;
    });
  };
  const completion = Math.round((completed.length / typescriptLessons.length) * 100);

  return (
    <>
      <div className="breadcrumb">
        Workspace <b>/</b> Learning <b>/</b> TypeScript
      </div>
      <PageHeader
        eyebrow="Interactive curriculum"
        title="TypeScript Lab"
        description="Learn the type system by running examples built from IssueFlow’s real contracts and data."
        actions={
          <a
            className="secondary-button"
            href="https://github.com/yuweiyang9611/frontend-learning-project/blob/main/frontend/src/features/typescript-lab/README.md"
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen size={15} /> Study guide
          </a>
        }
      />

      <section className="ts-lab-overview" aria-label="TypeScript Lab overview">
        <div className="ts-lab-intro">
          <span className="ts-lab-mark">
            <Braces size={25} />
          </span>
          <div>
            <p className="eyebrow">Strict mode, real models</p>
            <h2>From C# contracts to browser-safe TypeScript</h2>
            <p>
              Every runner is precompiled and tested. The visible code is a focused excerpt; nothing uses eval or
              modifies Issue data.
            </p>
          </div>
        </div>
        <dl>
          <div>
            <dt>Lessons</dt>
            <dd>{labOverview.lessonCount}</dd>
          </div>
          <div>
            <dt>Compiler checks</dt>
            <dd>{labOverview.compilerExamples}</dd>
          </div>
          <div>
            <dt>Runtime checks</dt>
            <dd>{labOverview.runtimeExamples}</dd>
          </div>
          <div>
            <dt>Your progress</dt>
            <dd>{completion}%</dd>
          </div>
        </dl>
        <div
          className="ts-progress"
          role="progressbar"
          aria-label="Course completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completion}
        >
          <span style={{ width: `${completion}%` }} />
        </div>
      </section>

      <div className="ts-mobile-picker">
        <label>
          <span>Current lesson</span>
          <select value={activeLesson.id} onChange={(event) => chooseLesson(event.target.value)}>
            {typescriptLessons.map((lesson) => (
              <option value={lesson.id} key={lesson.id}>
                {lesson.order}. {lesson.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="ts-lab-layout">
        <aside className="ts-lesson-nav">
          <label className="ts-search">
            <Search size={15} />
            <span className="sr-only">Search TypeScript lessons</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search concepts…"
            />
          </label>
          <div className="ts-category-tabs" aria-label="Filter TypeScript lessons">
            {lessonCategories.map((value) => (
              <button
                type="button"
                className={category === value ? 'active' : ''}
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
                key={value}
              >
                {value}
              </button>
            ))}
          </div>
          <nav aria-label="TypeScript lessons">
            {visibleLessons.map((lesson) => {
              const isActive = lesson.id === activeLesson.id;
              const isComplete = completed.includes(lesson.id);
              return (
                <button
                  type="button"
                  className={isActive ? 'ts-lesson-link active' : 'ts-lesson-link'}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => chooseLesson(lesson.id)}
                  key={lesson.id}
                >
                  <span>{isComplete ? <Check size={13} /> : String(lesson.order).padStart(2, '0')}</span>
                  <div>
                    <strong>{lesson.title}</strong>
                    <small>
                      {lesson.category} · {lesson.level}
                    </small>
                  </div>
                  <ChevronRight size={14} />
                </button>
              );
            })}
            {matchingLessons.length === 0 && <p className="ts-no-lessons">No other lessons match that search.</p>}
          </nav>
        </aside>
        <LessonWorkspace
          key={activeLesson.id}
          lesson={activeLesson}
          completed={completed.includes(activeLesson.id)}
          onToggleComplete={() => toggleComplete(activeLesson.id)}
        />
      </div>
    </>
  );
}
