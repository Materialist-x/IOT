<template>
  <section class="config-grid">
    <form class="v8-card device-form" @submit.prevent="submitCreate">
      <h3>&#x8bbe;&#x5907;&#x4e0e; Tag &#x5efa;&#x6a21;</h3>
      <div class="form-grid wide-grid">
        <label>
          <span>&#x6fc0;&#x6d3b;&#x7801;</span>
          <input v-model.trim="form.activationCode" placeholder="V8-TRIAL-2026" />
        </label>
        <label>
          <span>&#x8bbe;&#x5907; ID</span>
          <input v-model.trim="form.id" placeholder="Pump-01" />
        </label>
        <label>
          <span>&#x8bbe;&#x5907;&#x540d;&#x79f0;</span>
          <input v-model.trim="form.name" placeholder="Boiler Pump" />
        </label>
        <label>
          <span>&#x8bbe;&#x5907;&#x5e8f;&#x53f7;</span>
          <input v-model.trim="form.deviceNo" placeholder="DEV-001" />
        </label>
        <label>
          <span>&#x534f;&#x8bae;</span>
          <select v-model="form.protocol">
            <option value="ModbusTCP">Modbus TCP</option>
            <option value="DL645">DL/T 645</option>
            <option value="JSON">JSON</option>
          </select>
        </label>
        <label>
          <span>Host</span>
          <input v-model.trim="form.host" placeholder="192.168.1.88" />
        </label>
        <label>
          <span>Port</span>
          <input v-model.number="form.port" type="number" placeholder="502" />
        </label>
        <label>
          <span>&#x7ad9;&#x53f7;</span>
          <input v-model.trim="form.modbusStation" :disabled="isJsonProtocol" placeholder="1" />
        </label>
        <label>
          <span>&#x8d77;&#x59cb;&#x5730;&#x5740;</span>
          <input v-model.trim="form.registerAddress" :disabled="isJsonProtocol" placeholder="40010" />
        </label>
        <label>
          <span>&#x8f6e;&#x8be2;&#x5468;&#x671f;(ms)</span>
          <input v-model.number="form.pollIntervalMs" type="number" placeholder="1000" />
        </label>
      </div>

      <article class="tag-editor">
        <div class="section-head">
          <h4>Tag Definitions</h4>
          <button type="button" @click="addTagRow">&#x65b0;&#x589e;&#x70b9;&#x4f4d;</button>
        </div>
        <table class="config-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>&#x540d;&#x79f0;</th>
              <th>{{ addressHeader }}</th>
              <th>&#x7f29;&#x653e;&#x500d;&#x6570;</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(tag, index) in form.tagDefinitions" :key="`${index}-${tag.key}`">
              <td><input v-model.trim="tag.key" placeholder="temp" /></td>
              <td><input v-model.trim="tag.name" placeholder="Temp" /></td>
              <td><input v-model.trim="tag.address" :placeholder="addressPlaceholder" /></td>
              <td><input v-model.number="tag.scale" type="number" step="0.01" placeholder="0.1" /></td>
              <td>
                <button type="button" :disabled="form.tagDefinitions.length <= 1" @click="removeTagRow(index)">
                  &#x5220;&#x9664;
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </article>

      <div class="button-row">
        <button type="submit" class="primary-action" :disabled="busy">{{ actionLabel }}</button>
      </div>
      <p v-if="message" class="form-message">{{ message }}</p>
    </form>

    <article class="v8-card">
      <h3>&#x8bbe;&#x5907;&#x5217;&#x8868;</h3>
      <table class="config-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>&#x5e8f;&#x53f7;</th>
            <th>&#x534f;&#x8bae;</th>
            <th>&#x8fde;&#x63a5;&#x7aef;&#x70b9;</th>
            <th>&#x7ad9;&#x53f7;</th>
            <th>Tag</th>
            <th>&#x8f6e;&#x8be2;</th>
            <th>&#x72b6;&#x6001;</th>
            <th>&#x5065;&#x5eb7;</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="device in configStore.devices" :key="device.id">
            <td>{{ device.id }}</td>
            <td>{{ device.deviceNo }}</td>
            <td>{{ device.protocol }}</td>
            <td>{{ device.host }}:{{ device.port }}</td>
            <td>{{ device.protocol === "JSON" ? "--" : device.modbusStation }}</td>
            <td>{{ device.tagDefinitions.length }}</td>
            <td>{{ device.pollIntervalMs }} ms</td>
            <td>{{ statusText(device.status) }}</td>
            <td>{{ healthText(device.health) }}</td>
          </tr>
          <tr v-if="configStore.devices.length === 0">
            <td colspan="9">&#x6682;&#x65e0;&#x5df2;&#x914d;&#x7f6e;&#x8bbe;&#x5907;</td>
          </tr>
        </tbody>
      </table>
    </article>

    <article class="v8-card tag-definition">
      <h3>Tag Engine &#x7ed3;&#x6784;</h3>
      <div v-for="tag in configStore.tags" :key="tag.id" class="tag-definition-row">
        <strong>{{ tag.deviceId }} / {{ tag.name }}</strong>
        <span>{{ tag.address }} &#xb7; x{{ tag.scale }} &#xb7; {{ tag.quality }} &#xb7; {{ tag.value ?? "--" }}</span>
      </div>
      <p v-if="configStore.tags.length === 0">&#x8bbe;&#x5907;&#x4fdd;&#x5b58;&#x540e;&#x5c06;&#x751f;&#x6210;&#x53ef;&#x914d;&#x7f6e; Tag &#x7ed3;&#x6784;</p>
    </article>

    <article class="v8-card tcp-flow-card">
      <h3>IO Kernel &#x5efa;&#x6a21;&#x89c4;&#x5219;</h3>
      <ol class="tcp-flow-list">
        <li>Modbus / 645 &#x586b;&#x70b9;&#x4f4d;&#x5730;&#x5740;&#xff0c;JSON &#x586b;&#x5b57;&#x6bb5;&#x540d;</li>
        <li>&#x6bcf;&#x4e2a; Tag &#x5355;&#x72ec;&#x8bbe;&#x7f6e;&#x7f29;&#x653e;&#x500d;&#x6570;</li>
        <li>&#x7ad9;&#x53f7;&#x5c5e;&#x4e8e;&#x8bbe;&#x5907;&#x7ea7;&#x53c2;&#x6570;</li>
        <li>Tag Engine &#x6309;&#x4f60;&#x914d;&#x7f6e;&#x7684;&#x7ed3;&#x6784;&#x8fdb;&#x884c;&#x89e3;&#x6790;&#x548c;&#x5e7f;&#x64ad;</li>
      </ol>
      <p class="trace-detail">{{ summaryText }}</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { Device, TagDefinition } from "../../domain/models";
import { createDevice } from "../../store";
import { configStore } from "../../store/configStore";

const form = reactive({
  id: "Pump-01",
  name: "Boiler Pump",
  deviceNo: "DEV-001",
  protocol: "ModbusTCP",
  activationCode: "V8-TRIAL-2026",
  host: "127.0.0.1",
  port: 502,
  modbusStation: "1",
  registerAddress: "40010",
  pollIntervalMs: 1000,
  tagDefinitions: [
    { key: "temp", name: "Temp", address: "40010", scale: 0.1 },
    { key: "pressure", name: "Pressure", address: "40011", scale: 0.01 }
  ] as TagDefinition[]
});

const message = ref("");
const busy = ref(false);
const isJsonProtocol = computed(() => form.protocol === "JSON");
const actionLabel = computed(() => busy.value ? "\u4fdd\u5b58\u4e2d..." : "\u4fdd\u5b58\u8bbe\u5907");
const addressHeader = computed(() => isJsonProtocol.value ? "\u5b57;&#x6bb5;&#x540d;" : "\u70b9;&#x4f4d;&#x5730;&#x5740;");
const addressPlaceholder = computed(() => isJsonProtocol.value ? "Temp" : "40010");
const summaryText = computed(() => "\u73b0\u5728;&#x6bcf;&#x53f0;&#x8bbe;&#x5907;&#x53ef;&#x4ee5;&#x5355;&#x72ec;&#x914d;&#x7f6e;&#x7ad9;&#x53f7;&#x3001;&#x70b9;&#x4f4d;&#x5730;&#x5740; / JSON \u5b57;&#x6bb5;&#x548c;&#x7f29;&#x653e;&#x500d;&#x6570;&#x3002");

watch(() => form.protocol, (protocol) => {
  if (protocol === "JSON") {
    form.port = form.port === 502 ? 15021 : form.port;
    form.tagDefinitions = form.tagDefinitions.map((tag, index) => ({
      ...tag,
      address: tag.address.startsWith("4") ? tag.name : tag.address,
      scale: normalizeScale(tag.scale, 1),
      key: normalizeKey(tag.key, tag.name, index)
    }));
    return;
  }

  form.port = form.port === 15021 ? 502 : form.port;
  form.tagDefinitions = form.tagDefinitions.map((tag, index) => ({
    ...tag,
    address: /^\d+$/.test(tag.address) ? tag.address : fallbackModbusAddress(index),
    scale: normalizeScale(tag.scale, index === 1 ? 0.01 : 0.1),
    key: normalizeKey(tag.key, tag.name, index)
  }));
}, { immediate: false });

async function submitCreate(): Promise<void> {
  busy.value = true;
  try {
    await createDevice(buildPayload());
    message.value = "\u8bbe\u5907;&#x4e0e; Tag \u5efa;&#x6a21;&#x5df2;&#x4fdd;&#x5b58;&#xff0c;IO Kernel \u5c06;&#x6309;&#x914d;&#x7f6e;&#x91c7;&#x96c6;";
  } catch (error) {
    message.value = error instanceof Error ? error.message : "\u8bbe\u5907\u4fdd\u5b58\u5931\u8d25";
  } finally {
    busy.value = false;
  }
}

function buildPayload() {
  const tagDefinitions = form.tagDefinitions
    .filter((tag) => tag.name.trim() && tag.address.trim())
    .map((tag, index) => ({
      key: normalizeKey(tag.key, tag.name, index),
      name: tag.name.trim(),
      address: tag.address.trim(),
      scale: normalizeScale(tag.scale, isJsonProtocol.value ? 1 : index === 1 ? 0.01 : 0.1)
    }));

  return {
    id: form.id,
    name: form.name,
    deviceNo: form.deviceNo,
    protocol: form.protocol,
    licenseCode: form.activationCode,
    host: form.host,
    port: form.port,
    modbusStation: form.modbusStation,
    registerAddress: form.registerAddress,
    pollIntervalMs: form.pollIntervalMs,
    jsonMappings: Object.fromEntries(tagDefinitions.map((tag) => [tag.name, tag.address])),
    tagDefinitions
  };
}

function addTagRow(): void {
  const index = form.tagDefinitions.length;
  form.tagDefinitions.push({
    key: `tag-${index + 1}`,
    name: "",
    address: isJsonProtocol.value ? "" : fallbackModbusAddress(index),
    scale: isJsonProtocol.value ? 1 : 0.1
  });
}

function removeTagRow(index: number): void {
  if (form.tagDefinitions.length <= 1) return;
  form.tagDefinitions.splice(index, 1);
}

function normalizeKey(key: string, name: string, index: number): string {
  const source = (key || name || `tag-${index + 1}`).trim().toLowerCase();
  return source.replace(/\s+/g, "-").replace(/_/g, "-");
}

function normalizeScale(scale: number, fallback: number): number {
  return Number.isFinite(scale) && scale !== 0 ? Number(scale) : fallback;
}

function fallbackModbusAddress(index: number): string {
  const base = Number.parseInt(form.registerAddress, 10);
  return Number.isFinite(base) ? String(base + index) : String(40010 + index);
}

function statusText(status: Device["status"]): string {
  return status === "ONLINE" ? "\u5728\u7ebf" : "\u79bb\u7ebf";
}

function healthText(health: number): string {
  return `${Math.round((health ?? 0) * 100)}%`;
}
</script>
