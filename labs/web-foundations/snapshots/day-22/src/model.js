export function filterIssues(issues, status) {
  if (!Array.isArray(issues)) throw new TypeError('issues must be an array');
  if (!status) return [...issues];
  return issues.filter((issue) => issue && issue.status === status);
}
