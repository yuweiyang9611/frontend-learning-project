import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { referenceReactFoundations } from './reference';
import { workbenchReactFoundations } from './workbench';

const day = Number(process.env.REACT_EXERCISE_DAY ?? 0);
const solutions =
  process.env.REACT_EXERCISE_TARGET === 'workbench' ? workbenchReactFoundations : referenceReactFoundations;
const shouldRun = (candidate: number) => day === 0 || day === candidate;

afterEach(cleanup);

describe('React foundations', () => {
  if (shouldRun(50))
    it('Day 50 renders a minimal typed heading', () => {
      render(<solutions.IssueHeading issue={{ key: 'IF-7', title: 'Keyboard flow', status: 'open' }} />);
      expect(screen.getByRole('heading', { name: 'IF-7 · Keyboard flow · Open' })).toBeVisible();
    });

  if (shouldRun(51))
    it('Day 51 derives counts without storing duplicate state', () => {
      const source = [
        { id: 1, key: 'IF-1', title: 'One', status: 'open' as const },
        { id: 2, key: 'IF-2', title: 'Two', status: 'resolved' as const },
      ];
      expect(solutions.summarizeIssues(source)).toEqual({ total: 2, open: 1, resolved: 1 });
      expect(source[0].status).toBe('open');
    });

  if (shouldRun(52))
    it('Day 52 guards DOM strings before changing domain state', async () => {
      expect(solutions.parseIssueStatus('resolved')).toBe('resolved');
      expect(solutions.parseIssueStatus('blocked')).toBeNull();
      const onChange = vi.fn();
      render(<solutions.StatusSelect value="open" onChange={onChange} />);
      await userEvent.selectOptions(screen.getByLabelText('Status'), 'resolved');
      expect(onChange).toHaveBeenCalledWith('resolved');
    });

  if (shouldRun(53))
    it('Day 53 renders recoverable asynchronous states', async () => {
      const retry = vi.fn();
      const view = render(<solutions.RemoteIssuesPanel value={{ state: 'loading' }} />);
      expect(screen.getByRole('status')).toHaveTextContent('Loading issues');
      view.rerender(<solutions.RemoteIssuesPanel value={{ state: 'error', message: 'Network unavailable', retry }} />);
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(retry).toHaveBeenCalledOnce();
    });

  if (shouldRun(54))
    it('Day 54 installs and cleans up an Escape listener', () => {
      const onClose = vi.fn();
      const view = render(<solutions.EscapeDialog open title="Edit issue" onClose={onClose} />);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
      view.rerender(<solutions.EscapeDialog open={false} title="Edit issue" onClose={onClose} />);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
    });

  if (shouldRun(55))
    it('Day 55 exposes pending and recoverable failure', async () => {
      let rejectSave: ((reason?: unknown) => void) | undefined;
      const save = vi.fn(
        () =>
          new Promise<void>((_resolve, reject) => {
            rejectSave = reject;
          }),
      );
      render(<solutions.SaveStatusButton save={save} />);
      await userEvent.click(screen.getByRole('button', { name: 'Save status' }));
      expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
      rejectSave?.(new Error('offline'));
      expect(await screen.findByRole('alert')).toHaveTextContent('Could not save status');
    });

  if (shouldRun(56))
    it('Day 56 integrates guarded selection, save, and confirmation', async () => {
      const save = vi.fn(async () => undefined);
      render(<solutions.StatusEditor issue={{ key: 'IF-9', status: 'open' }} save={save} />);
      await userEvent.selectOptions(screen.getByLabelText('Status'), 'resolved');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(save).toHaveBeenCalledWith('resolved');
      expect(await screen.findByRole('status')).toHaveTextContent('Saved.');
    });
});
