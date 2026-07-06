<template>
  <main class="login-page">
    <form class="login-card" @submit.prevent="submit">
      <div class="login-brand">
        <strong>V8</strong>
        <div>
          <h1>&#x5de5;&#x4e1a;&#x7269;&#x8054;&#x5e73;&#x53f0;</h1>
          <span>SCADA UI / V7 Backend</span>
        </div>
      </div>

      <label>
        &#x767b;&#x5f55;&#x8d26;&#x53f7;
        <input v-model.trim="username" placeholder="admin" />
      </label>

      <label>
        &#x767b;&#x5f55;&#x5bc6;&#x7801;
        <input v-model.trim="password" type="password" placeholder="admin123" />
      </label>

      <button class="primary-button" type="submit">&#x767b;&#x5f55;&#x7cfb;&#x7edf;</button>
      <p v-if="message" class="form-message">{{ message }}</p>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { authStore } from "../store/authStore";

const emit = defineEmits<{
  loggedIn: [];
}>();

const username = ref("admin");
const password = ref("admin123");
const message = ref("");

function submit(): void {
  try {
    authStore.login(username.value, password.value);
    emit("loggedIn");
  } catch (error) {
    message.value = error instanceof Error ? error.message : "\u767b\u5f55\u5931\u8d25";
  }
}
</script>
