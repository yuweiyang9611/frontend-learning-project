export async function fetchIssues(fetchImpl = fetch, url = '/api/issues') {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error('Request failed with status ' + response.status);
  const value = await response.json();
  if (!Array.isArray(value)) throw new TypeError('Expected an issue array');
  return value;
}
