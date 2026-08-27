import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TypeScriptLabPage, { TYPESCRIPT_LAB_PROGRESS_KEY } from './TypeScriptLabPage';

function renderLab(entry = '/labs/typescript') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/labs/typescript" element={<TypeScriptLabPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TypeScriptLabPage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('restores a lesson from URL state and runs a guarded example', async () => {
    const user = userEvent.setup();
    renderLab('/labs/typescript?lesson=literal-unions');

    expect(screen.getByRole('heading', { name: 'as const, unions, and never' })).toBeInTheDocument();
    const input = screen.getByLabelText('Issue status');
    expect(input).toHaveAccessibleDescription(/Try/);
    expect(screen.getByRole('progressbar', { name: 'Course completion' })).toHaveAttribute('aria-valuenow', '0');
    await user.clear(input);
    await user.type(input, 'blocked');
    await user.click(screen.getByRole('button', { name: 'Run example' }));

    expect(screen.getByText('Invalid union member')).toBeInTheDocument();
    expect(screen.getByText(/not an IssueStatus/)).toBeInTheDocument();
  });

  it('switches lessons and filters the curriculum', async () => {
    const user = userEvent.setup();
    renderLab();

    await user.click(screen.getByRole('button', { name: /Generics preserve relationships/ }));
    expect(screen.getByRole('heading', { name: 'Generics preserve relationships' })).toHaveFocus();

    await user.type(screen.getByRole('searchbox', { name: 'Search TypeScript lessons' }), 'query builder');
    expect(screen.getByRole('button', { name: /Typed query builder/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Array pipeline/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Typed query builder/ }));
    expect(screen.getByRole('heading', { name: 'Typed query builder' })).toHaveFocus();
  });

  it('stores local learning progress without changing product data', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    localStorage.setItem('issueflow-demo-db-v3', 'product-data-sentinel');
    renderLab('/labs/typescript?lesson=utility-types');

    await user.click(screen.getByRole('button', { name: 'Mark complete' }));
    expect(screen.getByRole('button', { name: 'Completed' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('progressbar', { name: 'Course completion' })).toHaveAttribute('aria-valuenow', '8');
    expect(JSON.parse(localStorage.getItem(TYPESCRIPT_LAB_PROGRESS_KEY) ?? '[]')).toContain('utility-types');
    expect(localStorage.getItem('issueflow-demo-db-v3')).toBe('product-data-sentinel');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
