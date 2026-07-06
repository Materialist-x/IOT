<template>
  <article class="v8-card status-card">
    <span>{{ title }}</span>
    <strong>{{ value }}</strong>
    <small>{{ detail }}</small>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  value: string | number;
  detail: string;
}>();
</script>
