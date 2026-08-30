'use client';

import { ArrowLeft, Download, File, MessageSquare, Paperclip, Pencil, Send, Tag, Trash2, Upload } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { issueflowApi } from '@/src/api/issueflowApi';
import { useToast } from '@/src/app/AppProviders';
import {
  ConfirmDialog,
  DueDate,
  EmptyState,
  ErrorState,
  MemberAvatar,
  PageLoading,
  PriorityMark,
  Spinner,
  StatusBadge,
  formatBytes,
  formatRelative,
} from '@/src/components/ui';
import {
  ISSUE_STATUSES,
  isIssueStatus,
  statusLabels,
  type Comment,
  type IssueStatus,
} from '@/src/features/issues/types';

export default function IssueDetailPage() {
  const id = Number(useParams().id);
  const validId = Number.isSafeInteger(id) && id > 0;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [deleteIssueOpen, setDeleteIssueOpen] = useState(false);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState<Comment | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const issueQuery = useQuery({ queryKey: ['issue', id], queryFn: () => issueflowApi.getIssue(id), enabled: validId });
  const commentsQuery = useQuery({
    queryKey: ['comments', id],
    queryFn: () => issueflowApi.getComments(id),
    enabled: validId,
  });
  const attachmentsQuery = useQuery({
    queryKey: ['attachments', id],
    queryFn: () => issueflowApi.getAttachments(id),
    enabled: validId,
  });

  const statusMutation = useMutation({
    mutationFn: (status: IssueStatus) => issueflowApi.updateIssue(id, { status }),
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: ['issue', id] });
      const previous = queryClient.getQueryData(['issue', id]);
      queryClient.setQueryData(['issue', id], (current: typeof issueQuery.data) =>
        current ? { ...current, status } : current,
      );
      return { previous };
    },
    onError: (error, _status, context) => {
      queryClient.setQueryData(['issue', id], context?.previous);
      toast('Status change rolled back', { description: error.message, tone: 'error' });
    },
    onSuccess: (issue) => toast(`${issue.key} moved to ${statusLabels[issue.status]}`),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
  const deleteIssue = useMutation({
    mutationFn: () => issueflowApi.deleteIssue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast(`${issueQuery.data?.key ?? 'Issue'} deleted`);
      navigate('/issues');
    },
    onError: (error) => toast('Issue was not deleted', { description: error.message, tone: 'error' }),
  });
  const addComment = useMutation({
    mutationFn: (body: string) => issueflowApi.addComment(id, body),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      toast('Comment added');
    },
    onError: (error) => toast('Comment was not added', { description: error.message, tone: 'error' }),
  });
  const deleteComment = useMutation({
    mutationFn: (commentId: number) => issueflowApi.deleteComment(id, commentId),
    onSuccess: () => {
      setDeleteCommentTarget(null);
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      toast('Comment deleted');
    },
    onError: (error) => toast('Comment was not deleted', { description: error.message, tone: 'error' }),
  });
  const upload = useMutation({
    mutationFn: (file: globalThis.File) => issueflowApi.uploadAttachment(id, file),
    onSuccess: () => {
      if (fileInput.current) fileInput.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['attachments', id] });
      toast('Attachment uploaded');
    },
    onError: (error) => toast('Upload failed', { description: error.message, tone: 'error' }),
  });

  if (!validId) return <ErrorState message="That issue address is invalid." />;
  if (issueQuery.isPending) return <PageLoading />;
  if (issueQuery.isError) return <ErrorState message={issueQuery.error.message} onRetry={() => issueQuery.refetch()} />;
  const issue = issueQuery.data;

  const submitComment = (event: FormEvent) => {
    event.preventDefault();
    if (comment.trim()) addComment.mutate(comment);
  };
  const pickFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) upload.mutate(file);
  };

  return (
    <>
      <div className="breadcrumb">
        <Link to="/issues">Issues</Link> <b>/</b> {issue.key}
      </div>
      <section className="detail-heading">
        <Link className="back-link" to="/issues">
          <ArrowLeft size={15} />
          All issues
        </Link>
        <div className="detail-title-row">
          <div>
            <span className="issue-key">{issue.key}</span>
            <h1>{issue.title}</h1>
            <p>
              Opened by {issue.reporter.displayName} · {formatRelative(issue.createdAt)}
            </p>
          </div>
          <div className="page-actions">
            <Link className="secondary-button icon-label" to={`/issues/${issue.id}/edit`}>
              <Pencil size={15} />
              Edit
            </Link>
            <button className="danger-ghost-button" type="button" onClick={() => setDeleteIssueOpen(true)}>
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        </div>
      </section>
      <div className="detail-grid">
        <div className="detail-main">
          <section className="detail-card description-card">
            <header>
              <h2>Description</h2>
              <span>Updated {formatRelative(issue.updatedAt)}</span>
            </header>
            <p>{issue.description || 'No description has been added yet.'}</p>
            {issue.tags.length > 0 && (
              <div className="tag-list">
                <Tag size={14} />
                {issue.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}
          </section>
          <section className="detail-card comments-card">
            <header>
              <div>
                <h2>Activity</h2>
                <span>{commentsQuery.data?.length ?? 0} comments</span>
              </div>
              <MessageSquare size={18} />
            </header>
            <form className="comment-form" onSubmit={submitComment}>
              <MemberAvatar member={issue.reporter} />
              <div>
                <label className="sr-only" htmlFor="comment">
                  Add a comment
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Add context, a decision, or an update…"
                  rows={3}
                />
                <footer>
                  <small>Be kind and specific.</small>
                  <button className="primary-button" type="submit" disabled={!comment.trim() || addComment.isPending}>
                    {addComment.isPending ? <Spinner /> : <Send size={15} />}Comment
                  </button>
                </footer>
              </div>
            </form>
            {commentsQuery.isPending ? (
              <div className="comment-loading">
                <Spinner />
              </div>
            ) : commentsQuery.isError ? (
              <ErrorState message={commentsQuery.error.message} onRetry={() => commentsQuery.refetch()} />
            ) : commentsQuery.data?.length ? (
              <div className="comment-list">
                {commentsQuery.data.map((item) => (
                  <article key={item.id}>
                    <MemberAvatar member={item.author} />
                    <div>
                      <header>
                        <strong>{item.author.displayName}</strong>
                        <time dateTime={item.createdAt}>{formatRelative(item.createdAt)}</time>
                        <button
                          type="button"
                          aria-label={`Delete comment by ${item.author.displayName}`}
                          onClick={() => setDeleteCommentTarget(item)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </header>
                      <p>{item.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No comments yet"
                description="Start the conversation with an update or a useful question."
              />
            )}
          </section>
        </div>
        <aside className="detail-sidebar">
          <section className="detail-card properties-card">
            <h2>Properties</h2>
            <div className="property">
              <span>Status</span>
              <label className="status-select">
                <StatusBadge status={issue.status} />
                <select
                  value={issue.status}
                  onChange={(event) => {
                    const next = event.currentTarget.value;
                    if (isIssueStatus(next)) statusMutation.mutate(next);
                  }}
                  disabled={statusMutation.isPending}
                >
                  {ISSUE_STATUSES.map((status) => (
                    <option value={status} key={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="property">
              <span>Priority</span>
              <PriorityMark priority={issue.priority} />
            </div>
            <div className="property">
              <span>Assignee</span>
              <span className="assignee">
                <MemberAvatar member={issue.assignee} size="small" />
                {issue.assignee?.displayName ?? 'Unassigned'}
              </span>
            </div>
            <div className="property">
              <span>Due date</span>
              <DueDate value={issue.dueDate} />
            </div>
            <div className="property">
              <span>Reporter</span>
              <span className="assignee">
                <MemberAvatar member={issue.reporter} size="small" />
                {issue.reporter.displayName}
              </span>
            </div>
          </section>
          <section className="detail-card attachments-card">
            <header>
              <div>
                <h2>Attachments</h2>
                <span>{attachmentsQuery.data?.length ?? 0} files</span>
              </div>
              <Paperclip size={17} />
            </header>
            <label className={upload.isPending ? 'upload-dropzone pending' : 'upload-dropzone'}>
              <input
                ref={fileInput}
                type="file"
                accept=".png,.jpg,.jpeg,.pdf,.txt"
                onChange={pickFile}
                disabled={upload.isPending}
              />
              <span>{upload.isPending ? <Spinner /> : <Upload size={19} />}</span>
              <strong>{upload.isPending ? 'Uploading…' : 'Add a file'}</strong>
              <small>PNG, JPEG, PDF, or TXT · up to 5 MB</small>
            </label>
            <div className="attachment-list">
              {attachmentsQuery.data?.map((attachment) => (
                <article key={attachment.id}>
                  <span>
                    <File size={17} />
                  </span>
                  <div>
                    <strong>{attachment.originalFileName}</strong>
                    <small>
                      {formatBytes(attachment.size)} · {formatRelative(attachment.createdAt)}
                    </small>
                  </div>
                  {attachment.downloadUrl && (
                    <a href={attachment.downloadUrl} download aria-label={`Download ${attachment.originalFileName}`}>
                      <Download size={15} />
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
      <ConfirmDialog
        open={deleteIssueOpen}
        title={`Delete ${issue.key}?`}
        description="This permanently removes the issue, its comments, and attachment metadata."
        pending={deleteIssue.isPending}
        onClose={() => setDeleteIssueOpen(false)}
        onConfirm={() => deleteIssue.mutate()}
      />
      <ConfirmDialog
        open={Boolean(deleteCommentTarget)}
        title="Delete this comment?"
        description="The comment will be permanently removed from the issue activity."
        pending={deleteComment.isPending}
        onClose={() => setDeleteCommentTarget(null)}
        onConfirm={() => deleteCommentTarget && deleteComment.mutate(deleteCommentTarget.id)}
      />
    </>
  );
}
