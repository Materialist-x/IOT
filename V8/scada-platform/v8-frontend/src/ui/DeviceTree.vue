<template>
  <aside class="v8-card device-tree">
    <h3>&#x8bbe;&#x5907;&#x6811;</h3>
    <div v-for="deviceId in deviceIds" :key="deviceId" class="tree-device">
      <strong>{{ deviceId }}</strong>
      <button
        v-for="tag in tags.filter((item) => item.deviceId === deviceId)"
        :key="tag.id"
        @click="$emit('select', tag)"
      >
        {{ tag.name }} <span>({{ tag.address }})</span>
      </button>
    </div>
    <p v-if="deviceIds.length === 0">&#x7b49;&#x5f85;&#x5b9e;&#x65f6; Tag &#x6570;&#x636e;</p>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TagPoint } from "../domain/models";

const props = defineProps<{
  tags: TagPoint[];
}>();

defineEmits<{
  select: [tag: TagPoint];
}>();

const deviceIds = computed(() => Array.from(new Set(props.tags.map((tag) => tag.deviceId))));
</script>
