<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
  DAY_COUNT,
  PROGRESS_STORAGE_KEY,
  completionProblems,
  createProgress,
  decodeProgress,
  isSafeEvidenceUrl,
  mergeProgress,
  normalizeProgress,
  progressSummary,
  revokeDayCompletion,
} from './progress-state.mjs';

const progress = ref(createProgress());
const hydrated = ref(false);
const statusMessage = ref('');
const importMode = ref('merge');
const pendingImport = ref(null);
const fileInput = ref(null);

const weeks = computed(() =>
  Array.from({ length: 13 }, (_, index) => ({
    number: index + 1,
    days: progress.value.days.slice(index * 7, index * 7 + 7),
  })),
);
const summary = computed(() => progressSummary(progress.value));
const percent = computed(() => Math.round((summary.value.completed / DAY_COUNT) * 100));
const currentWeek = computed(() => {
  const next = progress.value.days.find((day) => !day.completed)?.day ?? DAY_COUNT;
  return Math.ceil(next / 7);
});
const importPreview = computed(() => {
  if (!pendingImport.value) return '';
  const current = new Map(progress.value.days.map((day) => [day.day, day]));
  const newlyCompleted = pendingImport.value.days.filter(
    (day) => day.completed && !current.get(day.day)?.completed,
  ).length;
  return '将读取 ' + pendingImport.value.days.length + ' 天，其中新增完成 ' + newlyCompleted + ' 天。';
});

function persist(value) {
  if (!hydrated.value) return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ ...value, exportedAt: new Date().toISOString() }));
  } catch {
    statusMessage.value = '浏览器无法保存进度；当前改动只保留在本页内存中，请立即导出备份。';
  }
}

watch(progress, persist, { deep: true });

onMounted(() => {
  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const decoded = decodeProgress(parsed);
      if (decoded.ok) {
        progress.value = normalizeProgress(decoded.value);
        if (decoded.warnings.length > 0) {
          statusMessage.value = `已恢复本地进度，并隔离或修复 ${decoded.warnings.length} 条异常记录。`;
        }
      } else {
        statusMessage.value = '已忽略损坏或旧版本的本地进度：' + decoded.error;
      }
    }
  } catch {
    statusMessage.value = '无法读取浏览器本地进度，已进入仅内存模式。';
  }
  hydrated.value = true;
});

function toggleDay(day, event) {
  if (day.completed) {
    day.completed = false;
    day.completedAt = null;
    return;
  }
  const problems = completionProblems(day);
  if (problems.length > 0) {
    event.currentTarget.checked = false;
    statusMessage.value = 'Day ' + String(day.day).padStart(2, '0') + ' 不能完成：' + problems.join('；') + '。';
    return;
  }
  day.completed = true;
  day.completedAt = new Date().toISOString();
  statusMessage.value = 'Day ' + String(day.day).padStart(2, '0') + ' 已按分钟、证据和复盘要求完成。';
}

function revokeCompletionAfterEdit(day) {
  if (!day.completed) return false;
  Object.assign(day, revokeDayCompletion(day));
  statusMessage.value =
    'Day ' + String(day.day).padStart(2, '0') + ' 的学习记录已修改，完成状态已自动撤销；请检查后重新确认。';
  return true;
}

function updateMinutes(day, event) {
  const raw = event.currentTarget.value;
  const value = Number(raw);
  const next = raw !== '' && Number.isInteger(value) ? Math.min(1440, Math.max(0, value)) : 0;
  if (next === day.minutes) return;
  day.minutes = next;
  revokeCompletionAfterEdit(day);
}

function updateNote(day, event) {
  const next = event.currentTarget.value.slice(0, 500);
  if (next === day.note) return;
  day.note = next;
  revokeCompletionAfterEdit(day);
}

function saveEvidence(day, event) {
  const url = event.currentTarget.value.trim();
  if (!url) {
    if (day.evidence.length === 0) return;
    day.evidence = [];
    if (!revokeCompletionAfterEdit(day)) {
      statusMessage.value = 'Day ' + String(day.day).padStart(2, '0') + ' 的证据链接已清除。';
    }
    return;
  }
  if (!isSafeEvidenceUrl(url)) {
    statusMessage.value = '证据链接被拒绝：只允许 HTTPS 或本站相对地址。';
    event.currentTarget.value = day.evidence[0]?.url ?? '';
    return;
  }
  if (day.evidence[0]?.url === url) return;
  day.evidence = [{ label: 'Day ' + String(day.day).padStart(2, '0') + ' 验收证据', url }];
  if (!revokeCompletionAfterEdit(day)) {
    statusMessage.value = '证据链接已保存在当前浏览器。';
  }
}

function exportProgress() {
  const payload = { ...progress.value, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'issueflow-progress-' + new Date().toISOString().slice(0, 10) + '.json';
  link.click();
  URL.revokeObjectURL(url);
  statusMessage.value = '进度 JSON 已导出；分享前请检查复盘和证据链接是否需要脱敏。';
}

async function previewImport(event) {
  const file = event.currentTarget.files?.[0];
  pendingImport.value = null;
  if (!file) return;
  if (file.size > 256 * 1024) {
    statusMessage.value = '导入文件超过 256 KB，已拒绝。';
    event.currentTarget.value = '';
    return;
  }
  try {
    const parsed = JSON.parse(await file.text());
    const decoded = decodeProgress(parsed);
    if (!decoded.ok) throw new Error(decoded.error);
    pendingImport.value = decoded.value;
    statusMessage.value =
      decoded.warnings.length > 0
        ? `导入文件可恢复；已隔离或修复 ${decoded.warnings.length} 条异常记录，请检查后确认。`
        : '导入文件已验证，请检查差异后确认。';
  } catch (error) {
    statusMessage.value = error instanceof Error ? '无法导入：' + error.message : '无法导入该文件。';
    event.currentTarget.value = '';
  }
}

function applyImport() {
  if (!pendingImport.value) return;
  const replace = importMode.value === 'replace';
  if (replace && !window.confirm('替换会清除本浏览器中未出现在文件里的记录。确定继续吗？')) return;
  progress.value = mergeProgress(progress.value, pendingImport.value, replace);
  pendingImport.value = null;
  if (fileInput.value) fileInput.value.value = '';
  statusMessage.value = replace ? '进度已用导入文件替换。' : '进度已安全合并。';
}

function resetProgress() {
  if (!window.confirm('建议先导出备份。确定清空这台设备上的 91 天进度吗？')) return;
  progress.value = createProgress();
  try {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    // Memory state has still been reset.
  }
  statusMessage.value = '本设备进度已清空。';
}
</script>

<template>
  <section class="learning-progress" aria-labelledby="learning-progress-title">
    <header class="learning-progress__header">
      <div>
        <p class="learning-progress__eyebrow">本设备 · 本地保存</p>
        <h2 id="learning-progress-title">91 天在线学习进度</h2>
        <p>记录主动学习、复盘和验收链接；三项都达到要求后才能标记完成，数据不会上传到服务器。</p>
      </div>
      <div class="learning-progress__score" aria-live="polite">
        <strong>{{ summary.completed }} / {{ DAY_COUNT }}</strong>
        <span>{{ percent }}% · {{ (summary.minutes / 60).toFixed(1) }} 小时</span>
      </div>
    </header>

    <progress :value="summary.completed" :max="DAY_COUNT">已完成 {{ summary.completed }} / {{ DAY_COUNT }}</progress>

    <div class="learning-progress__actions">
      <button type="button" @click="exportProgress">导出 JSON</button>
      <label class="learning-progress__file">
        选择进度文件
        <input ref="fileInput" type="file" accept="application/json,.json" @change="previewImport" />
      </label>
      <label>
        导入方式
        <select v-model="importMode">
          <option value="merge">安全合并</option>
          <option value="replace">完整替换</option>
        </select>
      </label>
      <button type="button" class="danger" @click="resetProgress">清空本机进度</button>
    </div>

    <div v-if="pendingImport" class="learning-progress__import" role="status">
      <span>{{ importPreview }}</span>
      <button type="button" @click="applyImport">确认导入</button>
    </div>

    <p class="learning-progress__status" role="status" aria-live="polite">
      {{ statusMessage }}
    </p>

    <div class="learning-progress__weeks">
      <details v-for="week in weeks" :key="week.number" :open="week.number === currentWeek">
        <summary>
          第 {{ week.number }} 周
          <span>{{ week.days.filter((day) => day.completed).length }} / 7</span>
        </summary>
        <div class="learning-progress__days">
          <article v-for="day in week.days" :key="day.day" class="learning-progress__day">
            <label class="learning-progress__check">
              <input type="checkbox" :checked="day.completed" @change="toggleDay(day, $event)" />
              <strong>Day {{ String(day.day).padStart(2, '0') }}</strong>
            </label>
            <label>
              主动学习分钟
              <input
                type="number"
                min="0"
                max="1440"
                step="5"
                :value="day.minutes"
                @input="updateMinutes(day, $event)"
              />
            </label>
            <label>
              HTTPS 或相对证据链接
              <input
                type="text"
                inputmode="url"
                :value="day.evidence[0]?.url ?? ''"
                placeholder="https://github.com/.../commit/..."
                @change="saveEvidence(day, $event)"
              />
            </label>
            <label>
              当日复盘（最多 500 字）
              <textarea
                :value="day.note"
                maxlength="500"
                rows="2"
                placeholder="卡点、验证和明天的第一步"
                @input="updateNote(day, $event)"
              ></textarea>
            </label>
          </article>
        </div>
      </details>
    </div>

    <p class="learning-progress__privacy">
      同一 github.io 域名下的其他项目理论上可以读取浏览器存储。不要保存 token、Cookie、私人仓库链接或个人资料；
      跨设备请手动导出并在导入前检查内容。
    </p>
  </section>
</template>
