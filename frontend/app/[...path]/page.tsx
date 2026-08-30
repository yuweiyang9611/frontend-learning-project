import IssueFlowApp from '@/src/app/IssueFlowApp';

type Props = { params: Promise<{ path: string[] }> };

export default async function CatchAllPage({ params }: Props) {
  const { path } = await params;
  return <IssueFlowApp initialPath={`/${path.join('/')}`} />;
}
