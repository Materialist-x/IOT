<template>
  <section class="page-stack">
    <article class="v8-card">
      <div class="section-head">
        <h3>Historian Explorer</h3>
        <button @click="exportCsv">&#x5bfc;&#x51fa; CSV</button>
      </div>
      <form class="history-form" @submit.prevent="query">
        <select v-model="tagId">
          <option value="">&#x9009;&#x62e9; Tag</option>
          <option v-for="tag in configStore.tags" :key="tag.id" :value="tag.id">{{ tag.deviceId }} / {{ tag.name }}</option>
        </select>
        <input v-model="from" type="datetime-local" />
        <input v-model="to" type="datetime-local" />
        <button class="primary-action">&#x67e5;&#x8be2;&#x5386;&#x53f2;</button>
      </form>
      <svg viewBox="0 0 760 220" class="history-chart">
        <polyline :points="chartPoints" />
      </svg>
      <table class="config-table">
        <thead>
          <tr><th>Tag</th><th>&#x503c;</th><th>&#x65f6;&#x95f4;</th></tr>
        </thead>
        <tbody>
          <tr v-for="point in historianStore.points" :key="`${point.tagId}-${point.timestamp}`">
            <td>{{ point.tagName }}</td>
            <td>{{ point.value }}</td>
            <td>{{ new Date(point.timestamp).toLocaleString() }}</td>
          </tr>
          <tr v-if="historianStore.points.length === 0">
            <td colspan="3">&#x6682;&#x65e0;&#x5386;&#x53f2;&#x6570;&#x636e;</td>
          </tr>
        </tbody>
      </table>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { configStore } from "../../store/configStore";
import { historianStore } from "../../store/historianStore";
import { loadHistory } from "../../store";

const tagId = ref("");
const now = new Date();
const past = new Date(now.getTime() - 60 * 60 * 1000);
const from = ref(toLocalInput(past));
const to = ref(toLocalInput(now));

const chartPoints = computed(() => {
  const points = historianStore.points;
  if (points.length === 0) return "";

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * 720 + 20;
    const y = 180 - ((point.value - min) / range) * 140 + 20;
    return `${x},${y}`;
  }).join(" ");
});

async function query(): Promise<void> {
  if (!tagId.value) return;
  await loadHistory(tagId.value, new Date(from.value).toISOString(), new Date(to.value).toISOString());
}

function exportCsv(): void {
  if (historianStore.points.length === 0) return;
  const header = "tagId,deviceId,tagName,value,timestamp";
  const rows = historianStore.points.map((point) => `${point.tagId},${point.deviceId},${point.tagName},${point.value},${point.timestamp}`);
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "historian.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}
</script>
