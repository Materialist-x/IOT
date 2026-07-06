<template>
  <AppShell />
</template>

<script setup lang="ts">
import AppShell from "./app/AppShell.vue";

export type PageKey =
  | "dashboard"
  | "device"
  | "tags"
  | "alarm"
  | "license"
  | "settings"
  | "runtime"
  | "faults"
  | "historian";
</script>
