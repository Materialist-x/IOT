<template>
  <section class="v8-alarms">
    <article class="v8-card">
      <h3>&#x544a;&#x8b66;&#x89c4;&#x5219;</h3>
      <form class="rule-form" @submit.prevent="submitRule">
        <select v-model="rule.tagId">
          <option value="">&#x9009;&#x62e9; Tag</option>
          <option v-for="tag in configStore.tags" :key="tag.id" :value="tag.id">{{ tag.deviceId }} / {{ tag.name }}</option>
        </select>
        <select v-model="rule.condition">
          <option value=">">&gt;</option>
          <option value=">=">&gt;=</option>
          <option value="<">&lt;</option>
          <option value="<=">&lt;=</option>
        </select>
        <input v-model.number="rule.threshold" type="number" placeholder="&#x9608;&#x503c;" />
        <button :disabled="ruleLimited">&#x65b0;&#x589e;&#x89c4;&#x5219;</button>
        <button type="button" @click="trigger">&#x89e6;&#x53d1;&#x6d4b;&#x8bd5;</button>
      </form>
      <p v-if="ruleLimited">&#x8bd5;&#x7528; License &#x6700;&#x591a;&#x5141;&#x8bb8; 3 &#x6761;&#x544a;&#x8b66;&#x89c4;&#x5219;</p>
      <div v-for="item in configStore.rules" :key="item.id" class="rule-row">
        {{ item.tagId }} {{ item.condition }} {{ item.threshold }}
      </div>
    </article>

    <AlarmStream :alarms="runtimeStore.alarms" />
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { createAlarmRule, triggerAlarm } from "../../store";
import { configStore } from "../../store/configStore";
import { runtimeStore } from "../../store/runtimeStore";
import AlarmStream from "../../ui/AlarmStream.vue";

const rule = reactive({ tagId: "", condition: ">", threshold: 60 });
const ruleLimited = computed(() => configStore.license.type === "TRIAL" && configStore.rules.length >= 3);

async function submitRule(): Promise<void> {
  if (ruleLimited.value || !rule.tagId) return;
  await createAlarmRule({ ...rule });
}

async function trigger(): Promise<void> {
  if (!rule.tagId) return;
  await triggerAlarm({ ...rule, value: Number(rule.threshold) + 12 });
}
</script>
