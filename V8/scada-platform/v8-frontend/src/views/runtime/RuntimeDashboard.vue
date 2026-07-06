<template>
  <section class="v8-dashboard">
    <div class="status-row">
      <StatusCard title="CPU" :value="`${runtimeStore.systemMetrics.cpu.toFixed(1)}%`" detail="&#x5b9e;&#x65f6;&#x8d44;&#x6e90;" />
      <StatusCard title="RAM" :value="`${runtimeStore.systemMetrics.ram.toFixed(1)}%`" detail="&#x5185;&#x5b58;&#x5360;&#x7528;" />
      <StatusCard title="NET" :value="`${runtimeStore.systemMetrics.net.toFixed(1)} Mbps`" detail="&#x94fe;&#x8def;&#x5e26;&#x5bbd;" />
      <StatusCard title="LICENSE" :value="licenseStatusText" :detail="licenseTypeText" />
    </div>

    <div class="status-row">
      <StatusCard title="DEVICE" :value="`${runtimeStore.metrics.onlineRatio}%`" detail="&#x8bbe;&#x5907;&#x5728;&#x7ebf;&#x7387;" />
      <StatusCard title="IO" :value="`${runtimeStore.metrics.ioThroughput}/min`" detail="IO &#x541e;&#x5410;" />
      <StatusCard title="FAULT" :value="runtimeStore.metrics.faultCount" detail="&#x6545;&#x969c;&#x603b;&#x6570;" />
      <StatusCard title="TAG" :value="`${runtimeStore.metrics.tagUpdateRate}/min`" detail="Tag &#x66f4;&#x65b0;&#x901f;&#x7387;" />
    </div>

    <div class="dashboard-main">
      <article class="v8-card device-status">
        <h3>&#x8bbe;&#x5907;&#x5728;&#x7ebf;&#x72b6;&#x6001;</h3>
        <strong>{{ runtimeStore.metrics.onlineDevices }} / {{ runtimeStore.metrics.totalDevices }}</strong>
        <span v-for="device in configStore.devices" :key="device.id">
          {{ device.id }} / {{ device.deviceNo }} / {{ statusText(device.status) }} / {{ healthText(device.health) }}
        </span>
        <p v-if="configStore.devices.length === 0">&#x8bf7;&#x5148;&#x5728; CONFIG SYSTEM &#x521b;&#x5efa;&#x8bbe;&#x5907;&#x3002;</p>
      </article>

      <article class="v8-card live-tags">
        <h3>&#x5b9e;&#x65f6; Tag &#x9762;&#x677f;</h3>
        <div v-for="tag in runtimeStore.tagValues" :key="tag.id" class="live-tag-row">
          <strong>{{ tag.name }} {{ tag.value ?? "--" }}</strong>
          <span>{{ tag.deviceId }} &#xb7; {{ tag.address }} &#xb7; {{ qualityText(tag.quality) }}</span>
        </div>
        <p v-if="runtimeStore.tagValues.length === 0">&#x6682;&#x65e0; Runtime Tag</p>
      </article>
    </div>

    <TrendChart :temp="runtimeStore.trend.temp" :pressure="runtimeStore.trend.pressure" />
    <article class="v8-card tcp-panel">
      <div class="section-head">
        <h3>Tag Engine &#x8f6e;&#x8be2;</h3>
        <span>{{ tcpStageTitle }}</span>
      </div>
      <div class="tcp-summary">
        <div>
          <small>&#x5f53;&#x524d;&#x8bbe;&#x5907;</small>
          <strong>{{ runtimeStore.tcp.deviceId || "--" }}</strong>
        </div>
        <div>
          <small>&#x6700;&#x8fd1;&#x6307;&#x4ee4;</small>
          <strong>{{ runtimeStore.tcp.lastCommand }}</strong>
        </div>
        <div>
          <small>&#x6700;&#x8fd1;&#x5e94;&#x7b54;</small>
          <strong>{{ runtimeStore.tcp.lastResponse }}</strong>
        </div>
      </div>
      <ol class="tcp-trace-list">
        <li v-for="step in runtimeStore.tcp.steps" :key="`${step.time}-${step.stage}`">
          <span>{{ formatStepTitle(step.stage) }}</span>
          <strong>{{ step.detail }}</strong>
          <small>{{ new Date(step.time).toLocaleTimeString() }}</small>
        </li>
      </ol>
    </article>
    <AlarmStream :alarms="runtimeStore.alarms" />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Device, TagPoint } from "../../domain/models";
import { configStore } from "../../store/configStore";
import { runtimeStore } from "../../store/runtimeStore";
import AlarmStream from "../../ui/AlarmStream.vue";
import StatusCard from "../../ui/StatusCard.vue";
import TrendChart from "../../ui/TrendChart.vue";

const licenseStatusText = computed(() => ({ ACTIVE: "\u6709\u6548", EXPIRED: "\u5df2\u8fc7\u671f", INVALID: "\u65e0\u6548" }[configStore.license.status] ?? configStore.license.status));
const licenseTypeText = computed(() => ({ SINGLE: "\u5355\u673a", MULTI: "\u591a\u673a", TRIAL: "\u8bd5\u7528" }[configStore.license.type] ?? configStore.license.type));
const tcpStageTitle = computed(() => formatStepTitle(runtimeStore.tcp.stage));

function formatStepTitle(stage: string): string {
  const map: Record<string, string> = {
    idle: "\u7b49\u5f85\u8f6e\u8be2",
    polling: "\u6309\u8bbe\u5907\u8f6e\u8be2",
    "query-sent": "\u5df2\u4e0b\u53d1\u91c7\u96c6\u6307\u4ee4",
    "response-received": "\u5df2\u63a5\u6536\u91c7\u96c6\u54cd\u5e94",
    "pipeline-ok": "\u5df2\u901a\u8fc7 Reliability Layer",
    "frame-dropped": "\u65e0\u6548\u5e27\u5df2\u4e22\u5f03",
    "io-error": "IO \u9519\u8bef"
  };
  return map[stage] ?? stage;
}

function statusText(status: Device["status"]): string {
  return status === "ONLINE" ? "\u5728\u7ebf" : "\u79bb\u7ebf";
}

function healthText(health: number): string {
  return `${Math.round((health ?? 0) * 100)}%`;
}

function qualityText(quality: TagPoint["quality"]): string {
  return { GOOD: "GOOD", BAD: "BAD", UNCERTAIN: "UNCERTAIN" }[quality];
}
</script>
