import { fetchIssues } from './api.js';
import { filterIssues } from './model.js';
import { renderIssues } from './view.js';

const select = document.querySelector('#status');
const list = document.querySelector('#issue-list');
const message = document.querySelector('#status-message');
let issues = [];

async function load() {
  message.textContent = '加载中…';
  try {
    issues = await fetchIssues();
    renderIssues(list, filterIssues(issues, select.value));
    message.textContent = '已加载 ' + issues.length + ' 条。';
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : '加载失败。';
  }
}

select.addEventListener('change', () => renderIssues(list, filterIssues(issues, select.value)));
load();
