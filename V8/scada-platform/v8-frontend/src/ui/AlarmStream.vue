<template>
  <article class="v8-card alarm-stream">
    <h3>&#x544a;&#x8b66;&#x4e8b;&#x4ef6;&#x6d41;</h3>
    <div v-for="alarm in alarms.slice(0, 8)" :key="alarm.id" class="alarm-line">
      <span>[{{ new Date(alarm.time).toLocaleTimeString() }}]</span>
      <strong>{{ alarm.deviceId }} {{ alarm.tagName }} = {{ alarm.value }}</strong>
      <b>{{ alarm.level }}</b>
    </div>
    <p v-if="alarms.length === 0">&#x6682;&#x65e0;&#x544a;&#x8b66;&#x4e8b;&#x4ef6;</p>
  </article>
</template>

<script setup lang="ts">
import type { AlarmRecord } from "../domain/models";

defineProps<{
  alarms: AlarmRecord[];
}>();
</script>
