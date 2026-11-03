<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { withBase } from 'vitepress';
import { data as course } from './course.data.mjs';
import { announceRecord, courseState } from './course-record.mjs';
import NbText from './NbText';
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
const statusError = ref(false);
const importMode = ref('merge');
const pendingImport = ref(null);
const fileInput = ref(null);

const dayInfo = new Map(course.weeks.flatMap((week) => week.days.map((day) => [day.day, day])));
const weeks = computed(() =>
  course.weeks.map((week, index) => ({
    number: week.week,
    title: week.title,
    days: progress.value.days.slice(index * 7, index * 7 + 7),
  })),
);
const summary = computed(() => progressSummary(progress.value));
const position = computed(() => courseState(course.weeks, hydrated.value ? progress.value : null));
const stoppedDay = computed(() => (position.value.started && !position.value.finished ? position.value.next.day : null));
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

function dayLabel(day) {
  return 'Day ' + String(day.day).padStart(2, '0');
}

function completedOn(day) {
  if (!day.completedAt) return '已完成';
  const time = Date.parse(day.completedAt);
  if (Number.isNaN(time)) return '已完成';
  return '已完成 · ' + new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(time));
}

function say(message, error = false) {
  statusMessage.value = message;
  statusError.value = error;
}

function persist(value) {
  if (!hydrated.value) return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ ...value, exportedAt: new Date().toISOString() }));
    announceRecord();
  } catch {
    say('浏览器无法保存进度；当前改动只保留在本页内存中，请立即导出备份。', true);
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
          say(`已恢复本地进度，并隔离或修复 ${decoded.warnings.length} 条异常记录。`);
        }
      } else {
        say('已忽略损坏或旧版本的本地进度：' + decoded.error, true);
      }
    }
  } catch {
    say('无法读取浏览器本地进度，已进入仅内存模式。', true);
  }
  hydrated.value = true;
});

function toggleDay(day, event) {
  if (day.completed) {
    day.completed = false;
    day.completedAt = null;
    say(dayLabel(day) + ' 已改回未完成。');
    return;
  }
  const problems = completionProblems(day);
  if (problems.length > 0) {
    event.currentTarget.checked = false;
    say(dayLabel(day) + ' 不能完成：' + problems.join('；') + '。', true);
    return;
  }
  day.completed = true;
  day.completedAt = new Date().toISOString();
  say(dayLabel(day) + ' 已按分钟、证据和复盘要求完成。');
}

function revokeCompletionAfterEdit(day) {
  if (!day.completed) return false;
  Object.assign(day, revokeDayCompletion(day));
  say(dayLabel(day) + ' 的学习记录已修改，完成状态已自动撤销；请检查后重新确认。');
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
    if (!revokeCompletionAfterEdit(day)) say(dayLabel(day) + ' 的证据链接已清除。');
    return;
  }
  if (!isSafeEvidenceUrl(url)) {
    say('证据链接被拒绝：只允许 HTTPS 或本站相对地址。', true);
    event.currentTarget.value = day.evidence[0]?.url ?? '';
    return;
  }
  if (day.evidence[0]?.url === url) return;
  day.evidence = [{ label: dayLabel(day) + ' 验收证据', url }];
  if (!revokeCompletionAfterEdit(day)) say('证据链接已保存在当前浏览器。');
}

function exportProgress() {
  const payload = { ...progress.value, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'issueflow-progress-' + new Date().toISOString().slice(0, 10) + '.json';
  link.click();
  URL.revokeObjectURL(url);
  say('进度 JSON 已导出；分享前请检查复盘和证据链接是否需要脱敏。');
}

async function previewImport(event) {
  const input = event.currentTarget;
  const file = input.files?.[0];
  pendingImport.value = null;
  if (!file) return;
  if (file.size > 256 * 1024) {
    say('导入文件超过 256 KB，已拒绝。', true);
    input.value = '';
    return;
  }
  try {
    const parsed = JSON.parse(await file.text());
    const decoded = decodeProgress(parsed);
    if (!decoded.ok) throw new Error(decoded.error);
    pendingImport.value = decoded.value;
    say(
      decoded.warnings.length > 0
        ? `导入文件可恢复；已隔离或修复 ${decoded.warnings.length} 条异常记录，请检查后确认。`
        : '导入文件已验证，请检查差异后确认。',
    );
  } catch (error) {
    say(error instanceof Error ? '无法导入：' + error.message : '无法导入该文件。', true);
    input.value = '';
  }
}

function applyImport() {
  if (!pendingImport.value) return;
  const replace = importMode.value === 'replace';
  if (replace && !window.confirm('替换会清除本浏览器中未出现在文件里的记录。确定继续吗？')) return;
  progress.value = mergeProgress(progress.value, pendingImport.value, replace);
  pendingImport.value = null;
  if (fileInput.value) fileInput.value.value = '';
  say(replace ? '进度已用导入文件替换。' : '进度已安全合并。');
}

function resetProgress() {
  if (!window.confirm('建议先导出备份。确定清空这台设备上的 91 天进度吗？')) return;
  progress.value = createProgress();
  try {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    announceRecord();
  } catch {
    // Memory state has still been reset.
  }
  say('本设备进度已清空。');
}
</script>

<template>
  <section class="learning-progress" aria-labelledby="learning-progress-title">
    <h2 id="learning-progress-title">91 天在线学习进度</h2>
    <p class="learning-progress__intro">
      主动学习满 120 分钟、复盘至少 20 字、有一个证据链接，三项都达标才能勾选完成。记录只保存在这台设备的浏览器里，不会上传。
    </p>

    <div class="learning-progress__summary" aria-live="polite">
      <div
        class="fe-track"
        role="progressbar"
        aria-label="91 天完成进度"
        aria-valuemin="0"
        :aria-valuemax="DAY_COUNT"
        :aria-valuenow="summary.completed"
        :style="{ '--nb-fraction': String(summary.completed / DAY_COUNT) }"
      >
        <span></span>
      </div>
      <p>
        <strong class="learning-progress__count">{{ summary.completed }} / {{ DAY_COUNT }}</strong>
        <span>天已完成 · 主动学习 {{ (summary.minutes / 60).toFixed(1) }} 小时</span>
      </p>
    </div>

    <div class="learning-progress__actions">
      <button type="button" class="fe-text-action is-record" @click="exportProgress">导出 JSON</button>
      <label class="learning-progress__file fe-text-action is-record">
        选择进度文件
        <input ref="fileInput" type="file" accept="application/json,.json" @change="previewImport" />
      </label>
      <label class="learning-progress__mode">
        导入方式
        <select v-model="importMode" class="nb-input">
          <option value="merge">安全合并</option>
          <option value="replace">完整替换</option>
        </select>
      </label>
      <button type="button" class="fe-text-action is-danger" @click="resetProgress">清空本机进度</button>
    </div>

    <div v-if="pendingImport" class="learning-progress__import" role="status">
      <span>{{ importPreview }}</span>
      <button type="button" class="nb-button nb-button--solid" @click="applyImport">确认导入</button>
    </div>

    <p class="learning-progress__status" :class="{ 'is-error': statusError }" role="status" aria-live="polite">{{ statusMessage }}</p>

    <div class="learning-progress__weeks">
      <details v-for="week in weeks" :key="week.number" class="learning-progress__week" :open="week.number === currentWeek">
        <summary>
          <span class="learning-progress__week-key">第 {{ week.number }} 周</span>
          <span class="learning-progress__week-title"><NbText :text="week.title" /></span>
          <span class="learning-progress__week-count" :class="{ 'is-done': week.days.every((day) => day.completed) }"
            >{{ week.days.filter((day) => day.completed).length }} / 7 天</span
          >
        </summary>
        <ol class="learning-progress__days">
          <li
            v-for="day in week.days"
            :key="day.day"
            class="learning-progress__day nb-entry"
            :data-record="day.completed ? 'done' : undefined"
            :aria-current="stoppedDay === day.day ? 'step' : undefined"
          >
            <div class="learning-progress__day-head">
              <label class="learning-progress__check">
                <input type="checkbox" :checked="day.completed" @change="toggleDay(day, $event)" />
                <span>{{ dayLabel(day) }}</span>
              </label>
              <a class="learning-progress__day-title" :href="withBase(dayInfo.get(day.day).link)"
                ><NbText :text="dayInfo.get(day.day).title"
              /></a>
              <span v-if="stoppedDay === day.day" class="nb-stopped">停在这里</span>
              <span class="learning-progress__day-state" :class="{ 'is-done': day.completed }">{{
                day.completed ? completedOn(day) : '未完成'
              }}</span>
            </div>
            <div class="learning-progress__fields">
              <label>
                主动学习分钟
                <input
                  class="nb-input"
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
                  class="nb-input"
                  type="text"
                  inputmode="url"
                  :value="day.evidence[0]?.url ?? ''"
                  placeholder="https://github.com/.../commit/..."
                  @change="saveEvidence(day, $event)"
                />
              </label>
              <label class="learning-progress__note">
                当日复盘（最多 500 字）
                <textarea
                  class="nb-input"
                  :value="day.note"
                  maxlength="500"
                  rows="2"
                  placeholder="卡点、验证和明天的第一步"
                  @input="updateNote(day, $event)"
                ></textarea>
              </label>
            </div>
          </li>
        </ol>
      </details>
    </div>

    <p class="learning-progress__privacy">
      同一 github.io 域名下的其他项目理论上可以读取浏览器存储。不要保存 token、Cookie、私人仓库链接或个人资料；跨设备请手动导出，导入前先检查内容。
    </p>
  </section>
</template>
