<template>
  <section class="page-stack">
    <article class="v8-card">
      <div class="section-head">
        <h3>Tag &#x76d1;&#x63a7;</h3>
        <select v-model="selectedDeviceId" class="tag-device-select">
          <option value="">&#x9009;&#x62e9;&#x8bbe;&#x5907;</option>
          <option v-for="device in configStore.devices" :key="device.id" :value="device.id">
            {{ device.id }} / {{ device.name }}
          </option>
        </select>
      </div>
      <div v-if="selectedDevice" class="tag-device-summary">
        <strong>{{ selectedDevice.id }} / {{ selectedDevice.protocol }}</strong>
        <span>
          {{ statusText(selectedDevice.status) }}
          &#xb7; {{ healthText(selectedDevice.health) }}
          &#xb7; {{ selectedDevice.host }}:{{ selectedDevice.port }}
        </span>
        <small>{{ lastErrorText(selectedDevice.lastError) }}</small>
      </div>
      <table class="config-table">
        <thead>
          <tr>
            <th>Tag ID</th>
            <th>&#x540d;&#x79f0;</th>
            <th>&#x5730;&#x5740;/&#x5b57;&#x6bb5;</th>
            <th>&#x5f53;&#x524d;&#x503c;</th>
            <th>&#x8d28;&#x91cf;</th>
            <th>&#x66f4;&#x65b0;&#x65f6;&#x95f4;</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tag in deviceTags" :key="tag.id">
            <td>{{ tag.id }}</td>
            <td>{{ tag.name }}</td>
            <td>{{ tag.address }}</td>
            <td>{{ tag.value ?? "--" }}</td>
            <td>{{ tag.quality }}</td>
            <td>{{ formatTime(tag.lastUpdate) }}</td>
          </tr>
          <tr v-if="deviceTags.length === 0">
            <td colspan="6">&#x8bf7;&#x5148;&#x9009;&#x62e9;&#x8bbe;&#x5907;&#x6216;&#x7b49;&#x5f85; IO Kernel &#x751f;&#x6210; Tag</td>
          </tr>
        </tbody>
      </table>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Device } from "../../domain/models";
import { configStore } from "../../store/configStore";

const selectedDeviceId = ref("");

watch(() => configStore.devices, (devices) => {
  if (!selectedDeviceId.value && devices.length > 0) {
    selectedDeviceId.value = devices[0].id;
  }
}, { immediate: true });

const selectedDevice = computed(() => configStore.devices.find((device) => device.id === selectedDeviceId.value));
const deviceTags = computed(() => configStore.tags.filter((tag) => tag.deviceId === selectedDeviceId.value));

function statusText(status: Device["status"]): string {
  return status === "ONLINE" ? "\u5728\u7ebf" : "\u79bb\u7ebf";
}

function healthText(health: number): string {
  return `\u5065\u5eb7\u5ea6 ${Math.round((health ?? 0) * 100)}%`;
}

function lastErrorText(lastError: string): string {
  return lastError || "\u6700\u8fd1\u65e0\u6545\u969c";
}

function formatTime(value: string): string {
  if (!value || value.startsWith("0001-")) {
    return "--";
  }
  return new Date(value).toLocaleString();
}
</script>
