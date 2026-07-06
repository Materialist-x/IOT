import { SceneJson } from "../../types/domain";

export const defaultScene: SceneJson = {
  sceneId: "S1",
  name: "一号产线组态画面",
  version: 1,
  canvas: { width: 1080, height: 620 },
  components: [
    {
      id: "c1",
      type: "Gauge",
      tag: "DEV001.Temp",
      x: 40,
      y: 40,
      width: 280,
      height: 230,
      props: { title: "电机温度", min: 0, max: 120, unit: "℃", warning: 70, danger: 80 }
    },
    {
      id: "c2",
      type: "Gauge",
      tag: "DEV001.Press",
      x: 350,
      y: 40,
      width: 280,
      height: 230,
      props: { title: "液压压力", min: 0, max: 120, unit: "bar", warning: 70, danger: 90 }
    },
    {
      id: "c3",
      type: "LineChart",
      tag: "DEV001.Temp",
      x: 40,
      y: 310,
      width: 590,
      height: 240,
      props: { title: "温度趋势", timeWindow: 60, unit: "℃" }
    }
  ]
};
