<template>
  <article class="v8-card license-panel">
    <h3>License</h3>
    <dl>
      <dt>&#x72b6;&#x6001;</dt><dd>{{ statusText }}</dd>
      <dt>&#x7c7b;&#x578b;</dt><dd>{{ typeText }}</dd>
      <dt>&#x5230;&#x671f;</dt><dd>{{ expireText }}</dd>
      <dt>&#x6fc0;&#x6d3b;&#x7801;</dt><dd>{{ license.licenseKey }}</dd>
      <dt>Machine ID</dt><dd>{{ license.machineId }}</dd>
    </dl>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LicenseState } from "../domain/models";

const props = defineProps<{
  license: LicenseState;
}>();

const expireText = computed(() => props.license.expiresAt ? new Date(props.license.expiresAt).toLocaleDateString() : "--");
const statusText = computed(() => ({ ACTIVE: "\u6709\u6548", EXPIRED: "\u5df2\u8fc7\u671f", INVALID: "\u65e0\u6548" }[props.license.status] ?? props.license.status));
const typeText = computed(() => ({ SINGLE: "\u5355\u673a", MULTI: "\u591a\u673a", TRIAL: "\u8bd5\u7528" }[props.license.type] ?? props.license.type));
</script>
