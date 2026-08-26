import type { Metadata } from 'next';
import IssueFlowApp from '@/src/app/IssueFlowApp';
import { findIssue } from '@/src/server/issueflow-db';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).id);
  const issue = Number.isSafeInteger(id) && id > 0 ? await findIssue(id).catch(() => null) : null;
  if (!issue) {
    return {
      title: 'Issue not found | IssueFlow',
      robots: { index: false, follow: false },
      openGraph: { images: [] },
      twitter: { images: [] },
    };
  }
  const title = `${issue.key}: ${issue.title} | IssueFlow`;
  const description = (issue.description || `${issue.status.replace('_', ' ')} ${issue.priority} priority issue`).slice(
    0,
    160,
  );
  return {
    title,
    description,
    openGraph: { title, description, type: 'article', images: [] },
    twitter: { card: 'summary', title, description, images: [] },
  };
}

export default function IssuePage() {
  return <IssueFlowApp />;
}
