<template>
  <article class="v8-card trend-card">
    <h3>Trend Chart</h3>
    <svg viewBox="0 0 760 260" role="img">
      <line v-for="line in 5" :key="line" x1="28" x2="732" :y1="line * 42" :y2="line * 42" />
      <path :d="path(temp)" class="temp-line" />
      <path :d="path(pressure)" class="pressure-line" />
    </svg>
    <footer>
      <span>Temp</span>
      <span>Pressure</span>
    </footer>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  temp: number[];
  pressure: number[];
}>();

function path(values: number[]): string {
  const list = values.length ? values : [0];
  const min = Math.min(...list, 0);
  const max = Math.max(...list, 100);
  const range = Math.max(max - min, 1);
  return list.map((value, index) => {
    const x = 28 + (index / Math.max(list.length - 1, 1)) * 704;
    const y = 224 - ((value - min) / range) * 184;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}
</script>
