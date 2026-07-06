<template>
  <section class="page-stack">
    <article class="v8-card">
      <div class="section-head">
        <h3>&#x6545;&#x969c;&#x65e5;&#x5fd7;</h3>
        <button @click="refresh">&#x5237;&#x65b0;</button>
      </div>
      <table class="config-table fault-table">
        <thead>
          <tr>
            <th>&#x65f6;&#x95f4;</th>
            <th>&#x8bbe;&#x5907;</th>
            <th>&#x534f;&#x8bae;</th>
            <th>&#x539f;&#x56e0;</th>
            <th>&#x539f;&#x59cb;&#x5e27;</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fault in runtimeStore.faults" :key="fault.id">
            <td>{{ new Date(fault.time).toLocaleString() }}</td>
            <td>{{ fault.deviceId }}</td>
            <td>{{ fault.protocol }}</td>
            <td>{{ fault.reason }}</td>
            <td class="hex-cell">{{ fault.frameHex || "--" }}</td>
          </tr>
          <tr v-if="runtimeStore.faults.length === 0">
            <td colspan="5">&#x6682;&#x65e0;&#x6545;&#x969c;&#x8bb0;&#x5f55;</td>
          </tr>
        </tbody>
      </table>
    </article>
  </section>
</template>

<script setup lang="ts">
import { loadFaults } from "../../store";
import { runtimeStore } from "../../store/runtimeStore";

async function refresh(): Promise<void> {
  await loadFaults();
}
</script>
