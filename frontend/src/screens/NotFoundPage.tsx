import { ArrowLeft, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="not-found-page">
      <div>
        <span>
          <SearchX size={29} />
        </span>
        <p className="eyebrow">404 · Lost in the flow</p>
        <h1>This page moved on.</h1>
        <p>The route does not point to an IssueFlow page. Return to the dashboard or browse the current issue list.</p>
        <div>
          <Link className="primary-button" to="/dashboard">
            Open dashboard
          </Link>
          <Link className="secondary-button icon-label" to="/issues">
            <ArrowLeft size={15} />
            Browse issues
          </Link>
        </div>
      </div>
    </main>
  );
}
