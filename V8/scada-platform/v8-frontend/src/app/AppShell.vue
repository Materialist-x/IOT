<template>
  <Login v-if="!authStore.currentUser" @logged-in="boot" />
  <main v-else class="v8-shell">
    <aside class="v8-left">
      <div class="v8-logo">V8 SCADA</div>

      <div class="nav-section">
        <span>CONFIG SYSTEM</span>
        <button v-if="canOpen('device')" :class="{ active: active === 'device' }" @click="open('device')">&#x8bbe;&#x5907;&#x7ba1;&#x7406;</button>
        <button v-if="canOpen('tags')" :class="{ active: active === 'tags' }" @click="open('tags')">Tag &#x76d1;&#x63a7;</button>
        <button v-if="canOpen('alarm')" :class="{ active: active === 'alarm' }" @click="open('alarm')">&#x544a;&#x8b66;&#x89c4;&#x5219;</button>
        <button v-if="canOpen('license')" :class="{ active: active === 'license' }" @click="open('license')">License</button>
        <button v-if="canOpen('settings')" :class="{ active: active === 'settings' }" @click="open('settings')">&#x6743;&#x9650;&#x8bbe;&#x7f6e;</button>
      </div>

      <div class="nav-section">
        <span>RUNTIME SYSTEM</span>
        <button v-if="canOpen('dashboard')" :class="{ active: active === 'dashboard' }" @click="open('dashboard')">&#x8fd0;&#x884c;&#x603b;&#x89c8;</button>
        <button v-if="canOpen('runtime')" :class="{ active: active === 'runtime' }" @click="open('runtime')">&#x5b9e;&#x65f6;&#x76d1;&#x63a7;</button>
        <button v-if="canOpen('faults')" :class="{ active: active === 'faults' }" @click="open('faults')">&#x6545;&#x969c;&#x65e5;&#x5fd7;</button>
      </div>

      <div v-if="canOpen('historian')" class="nav-section">
        <span>HISTORIAN SYSTEM</span>
        <button :class="{ active: active === 'historian' }" @click="open('historian')">TrendChart / Explorer</button>
      </div>

      <button class="logout-button" @click="authStore.logout()">&#x9000;&#x51fa;&#x767b;&#x5f55;</button>
    </aside>

    <section class="v8-center">
      <header class="v8-top">
        <div class="top-copy">
          <strong>{{ modeTitle }}</strong>
          <small>{{ activeLabel }}</small>
        </div>
        <div class="top-badges">
          <span class="status-badge" :class="{ online: runtimeStore.connected }">{{ runtimeStore.connected ? wsText.online : wsText.offline }}</span>
          <span class="status-badge tcp-badge" :class="{ online: runtimeStore.tcp.stage === 'response-received' }">{{ tcpTitle }}</span>
        </div>
      </header>
      <DevicesView v-if="active === 'device'" />
      <TagDesignerView v-else-if="active === 'tags'" />
      <AlarmsView v-else-if="active === 'alarm'" />
      <LicenseView v-else-if="active === 'license'" />
      <SettingsView v-else-if="active === 'settings'" />
      <RuntimeDashboard v-else-if="active === 'dashboard' || active === 'runtime'" />
      <FaultsView v-else-if="active === 'faults'" />
      <HistorianView v-else-if="active === 'historian'" />
      <RuntimeDashboard v-else />
    </section>

    <aside class="v8-right">
      <LicensePanel :license="configStore.license" />
      <AlarmStream :alarms="runtimeStore.alarms" />
    </aside>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { authStore } from "../store/authStore";
import { bootstrapStore } from "../store";
import { configStore } from "../store/configStore";
import { runtimeStore } from "../store/runtimeStore";
import AlarmStream from "../ui/AlarmStream.vue";
import LicensePanel from "../ui/LicensePanel.vue";
import Login from "../views/Login.vue";
import AlarmsView from "../views/alarms/AlarmsView.vue";
import DevicesView from "../views/devices/DevicesView.vue";
import FaultsView from "../views/faults/FaultsView.vue";
import HistorianView from "../views/history/HistorianView.vue";
import LicenseView from "../views/license/LicenseView.vue";
import RuntimeDashboard from "../views/runtime/RuntimeDashboard.vue";
import SettingsView from "../views/settings/SettingsView.vue";
import TagDesignerView from "../views/tags/TagDesignerView.vue";
import type { PageKey } from "../App.vue";

type ActivePage = PageKey;

const active = ref<ActivePage>("dashboard");
const pageLabels: Record<ActivePage, string> = {
  dashboard: "\u8fd0\u884c\u603b\u89c8",
  runtime: "\u5b9e\u65f6\u76d1\u63a7",
  faults: "\u6545\u969c\u65e5\u5fd7",
  device: "\u8bbe\u5907\u7ba1\u7406",
  tags: "Tag \u76d1\u63a7",
  alarm: "\u544a\u8b66\u89c4\u5219",
  license: "License",
  settings: "\u6743\u9650\u8bbe\u7f6e",
  historian: "Historian"
};
const wsText = {
  online: "\u72b6\u6001\u680f\uff1aWebSocket \u5df2\u8fde\u63a5",
  offline: "\u72b6\u6001\u680f\uff1aWebSocket \u672a\u8fde\u63a5"
};
const modeTitle = computed(() => {
  if (["device", "tags", "alarm", "license", "settings"].includes(active.value)) return "\u5f53\u524d\u6a21\u5f0f\uff1aCONFIG SYSTEM";
  if (active.value === "historian") return "\u5f53\u524d\u6a21\u5f0f\uff1aHISTORIAN SYSTEM";
  return "\u5f53\u524d\u6a21\u5f0f\uff1aRUNTIME SYSTEM";
});
const activeLabel = computed(() => `SCADA / ${pageLabels[active.value]}`);
const tcpTitle = computed(() => {
  const map: Record<string, string> = {
    idle: "\u72b6\u6001\u680f\uff1aPolling \u5f85\u547d",
    polling: "\u72b6\u6001\u680f\uff1aTag Engine \u8f6e\u8be2\u4e2d",
    "query-sent": "\u72b6\u6001\u680f\uff1a\u5df2\u4e0b\u53d1\u91c7\u96c6\u6307\u4ee4",
    "response-received": "\u72b6\u6001\u680f\uff1a\u5df2\u6536\u5230\u54cd\u5e94\u5e27",
    "pipeline-ok": "\u72b6\u6001\u680f\uff1a\u5df2\u901a\u8fc7\u6821\u9a8c\u5e76\u66f4\u65b0 Tag",
    "frame-dropped": "\u72b6\u6001\u680f\uff1a\u65e0\u6548\u5e27\u5df2\u4e22\u5f03",
    "io-error": "\u72b6\u6001\u680f\uff1aIO \u6545\u969c"
  };
  return map[runtimeStore.tcp.stage] ?? map.idle;
});

if (authStore.currentUser) void boot();

async function boot(): Promise<void> {
  await bootstrapStore();
  if (!authStore.canOpen(active.value)) {
    active.value = authStore.visibleMenus()[0]?.page ?? "dashboard";
  }
}

function canOpen(page: PageKey): boolean {
  return authStore.canOpen(page);
}

function open(page: PageKey): void {
  if (authStore.canOpen(page)) {
    active.value = page;
  }
}
</script>
