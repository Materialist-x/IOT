import { reactive } from "vue";
import type { HistoryPoint } from "../domain/models";

export const historianStore = reactive({
  selectedTagId: "",
  from: "",
  to: "",
  points: [] as HistoryPoint[]
});
