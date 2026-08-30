export function renderIssues(list, issues) {
  list.replaceChildren(
    ...issues.map((issue) => {
      const item = document.createElement('li');
      item.textContent = issue.title + ' · ' + issue.status;
      return item;
    }),
  );
}
