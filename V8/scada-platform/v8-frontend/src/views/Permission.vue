<template>
  <section class="permission-layout">
    <form class="panel form-panel" @submit.prevent="submitUser">
      <h2>&#x6dfb;&#x52a0;&#x7528;&#x6237;</h2>
      <label>
        &#x7528;&#x6237;&#x540d;
        <input v-model.trim="form.username" placeholder="&#x4f8b;&#x5982; engineer" />
      </label>
      <label>
        &#x5bc6;&#x7801;
        <input v-model.trim="form.password" type="password" placeholder="&#x8bf7;&#x8f93;&#x5165;&#x5bc6;&#x7801;" />
      </label>
      <label>
        &#x89d2;&#x8272;
        <select v-model="form.role">
          <option value="admin">&#x7ba1;&#x7406;&#x5458;</option>
          <option value="operator">&#x64cd;&#x4f5c;&#x5458;</option>
          <option value="viewer">&#x8bbf;&#x5ba2;</option>
        </select>
      </label>
      <button class="primary-button" type="submit">&#x6dfb;&#x52a0;&#x7528;&#x6237;</button>
      <p v-if="message" class="form-message">{{ message }}</p>
    </form>

    <section class="panel permission-page">
      <div class="section-title">
        <h2>&#x6743;&#x9650;&#x7ba1;&#x7406;</h2>
        <span>&#x4e3a;&#x6bcf;&#x4e2a;&#x7528;&#x6237;&#x52fe;&#x9009;&#x53ef;&#x89c1;&#x83dc;&#x5355;&#xff0c;&#x5e76;&#x53ef;&#x4fee;&#x6539;&#x7528;&#x6237;&#x5bc6;&#x7801;&#x3002;</span>
      </div>

      <div class="user-permission-list">
        <article v-for="user in authStore.users" :key="user.username" class="permission-card">
          <div class="user-card-head">
            <h3>{{ user.username }}</h3>
            <span>{{ roleLabel(user.role) }}</span>
          </div>
          <label>
            &#x8bbe;&#x7f6e;&#x5bc6;&#x7801;
            <input :value="user.password" type="password" @change="setPassword(user.username, $event)" />
          </label>
          <div class="menu-check-grid">
            <label v-for="item in menuItems" :key="item.page" class="check-row">
              <input
                type="checkbox"
                :checked="user.menus.includes(item.page)"
                :disabled="item.page === 'dashboard'"
                @change="authStore.toggleUserMenu(user.username, item.page)"
              />
              <span>{{ item.label }}</span>
            </label>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { authStore, menuItems, type RoleKey } from "../store/authStore";

const form = reactive({
  username: "",
  password: "",
  role: "operator" as RoleKey
});

const message = ref("");

function submitUser(): void {
  try {
    authStore.addUser(form.username, form.password, form.role);
    message.value = "\u7528\u6237\u5df2\u6dfb\u52a0";
    form.username = "";
    form.password = "";
  } catch (error) {
    message.value = error instanceof Error ? error.message : "\u6dfb\u52a0\u7528\u6237\u5931\u8d25";
  }
}

function setPassword(username: string, event: Event): void {
  const target = event.target as HTMLInputElement;
  authStore.setPassword(username, target.value);
}

function roleLabel(role: RoleKey): string {
  if (role === "admin") return "\u7ba1\u7406\u5458";
  if (role === "operator") return "\u64cd\u4f5c\u5458";
  return "\u8bbf\u5ba2";
}
</script>
