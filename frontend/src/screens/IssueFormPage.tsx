'use client';

import { ArrowLeft } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { issueflowApi } from '@/src/api/issueflowApi';
import { useToast } from '@/src/app/AppProviders';
import { ErrorState, PageHeader, PageLoading } from '@/src/components/ui';
import IssueForm, { emptyIssueInput } from '@/src/features/issues/IssueForm';
import type { IssueInput } from '@/src/features/issues/types';

export default function IssueFormPage() {
  const { id: routeId } = useParams();
  const id = Number(routeId);
  const editing = Number.isFinite(id) && id > 0;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const members = useQuery({ queryKey: ['members'], queryFn: issueflowApi.getMembers });
  const issue = useQuery({ queryKey: ['issue', id], queryFn: () => issueflowApi.getIssue(id), enabled: editing });

  const mutation = useMutation({
    mutationFn: (input: IssueInput) =>
      editing ? issueflowApi.updateIssue(id, input) : issueflowApi.createIssue(input),
    onSuccess: (saved) => {
      queryClient.setQueryData(['issue', saved.id], saved);
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast(editing ? `${saved.key} updated` : `${saved.key} created`, {
        description: editing ? 'The latest details are now visible to the team.' : 'The issue is ready for triage.',
      });
      navigate(`/issues/${saved.id}`);
    },
  });

  if (members.isPending || (editing && issue.isPending)) return <PageLoading />;
  if (members.isError) return <ErrorState message={members.error.message} onRetry={() => members.refetch()} />;
  if (editing && issue.isError) return <ErrorState message={issue.error.message} onRetry={() => issue.refetch()} />;

  const initialValue: IssueInput = issue.data
    ? {
        title: issue.data.title,
        description: issue.data.description,
        status: issue.data.status,
        priority: issue.data.priority,
        assigneeId: issue.data.assignee?.id ?? null,
        tags: issue.data.tags,
        dueDate: issue.data.dueDate,
      }
    : emptyIssueInput;

  return (
    <>
      <div className="breadcrumb">
        <Link to="/issues">Issues</Link> <b>/</b> {editing ? issue.data?.key : 'New issue'}
      </div>
      <PageHeader
        eyebrow={editing ? 'Edit issue' : 'Create issue'}
        title={editing ? `Update ${issue.data?.key}` : 'Turn a request into clear work'}
        description={
          editing
            ? 'Keep the context accurate so the next person can move without guesswork.'
            : 'Capture the context, owner, and priority. You can refine the issue as the work develops.'
        }
        actions={
          <Link className="secondary-button icon-label" to={editing ? `/issues/${id}` : '/issues'}>
            <ArrowLeft size={15} />
            Back
          </Link>
        }
      />
      <div className="form-page-grid">
        <IssueForm
          key={issue.data?.updatedAt ?? 'new'}
          initialValue={initialValue}
          members={members.data ?? []}
          pending={mutation.isPending}
          submitLabel={editing ? 'Save changes' : 'Create issue'}
          onSubmit={(input) => mutation.mutateAsync(input).then(() => undefined)}
          onCancel={() => navigate(editing ? `/issues/${id}` : '/issues')}
        />
        <aside className="form-guide">
          <p className="eyebrow">A strong issue</p>
          <h2>Make the next step obvious</h2>
          <ul>
            <li>
              <b>Be specific.</b>
              <span>Name the observed behavior and where it happens.</span>
            </li>
            <li>
              <b>Add context.</b>
              <span>Explain why it matters and what good looks like.</span>
            </li>
            <li>
              <b>Set ownership.</b>
              <span>Choose one person to move the issue forward.</span>
            </li>
          </ul>
          <blockquote>“The best issue is the one another teammate can act on without a meeting.”</blockquote>
        </aside>
      </div>
    </>
  );
}
