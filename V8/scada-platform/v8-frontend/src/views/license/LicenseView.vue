<template>
  <section class="v8-license">
    <LicensePanel :license="configStore.license" />

    <form class="v8-card license-actions" @submit.prevent="activate">
      <h3>&#x6fc0;&#x6d3b;&#x4e0e;&#x7ed1;&#x5b9a;</h3>
      <input v-model.trim="key" placeholder="V8-XXXX-XXXX" />
      <button>&#x6fc0;&#x6d3b; License</button>
      <button type="button">&#x91cd;&#x7ed1;&#x8bbe;&#x5907;</button>
      <button type="button">&#x89e3;&#x7ed1;</button>
    </form>

    <article class="v8-card feature-panel">
      <h3>&#x529f;&#x80fd;&#x89e3;&#x9501;</h3>
      <label><input type="checkbox" :checked="configStore.license.features.scadaDashboard" disabled /> SCADA Dashboard</label>
      <label><input type="checkbox" :checked="configStore.license.features.deviceManagement" disabled /> &#x8bbe;&#x5907;&#x7ba1;&#x7406;</label>
      <label><input type="checkbox" :checked="configStore.license.features.alarmSystem" disabled /> &#x544a;&#x8b66;&#x7cfb;&#x7edf;</label>
      <label><input type="checkbox" :checked="configStore.license.features.multiDevice" disabled /> &#x591a;&#x8bbe;&#x5907;</label>
      <label><input type="checkbox" :checked="configStore.license.features.historian" disabled /> Historian</label>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { activateLicense } from "../../store";
import { configStore } from "../../store/configStore";
import LicensePanel from "../../ui/LicensePanel.vue";

const key = ref("");

async function activate(): Promise<void> {
  await activateLicense(key.value);
}
</script>
