import { Bell, Cpu, RadioTower } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import "./styles.css";

type TagEvent = {
  type: "tags";
  payload: {
    tenantId: string;
    deviceId: string;
    tagName: string;
    value: number | string | boolean;
    timestamp: string;
    quality: string;
  };
};

export default function App() {
  const [tags, setTags] = useState<TagEvent["payload"][]>([]);

  useEffect(() => {
    const ws = new WebSocket((import.meta.env.VITE_REALTIME_URL ?? "ws://localhost:8090") + "/tenant/tenant-demo/tags");
    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as TagEvent;
      if (parsed.type === "tags") setTags((current) => [parsed.payload, ...current].slice(0, 12));
    };
    return () => ws.close();
  }, []);

  const latestByDevice = useMemo(() => {
    const map = new Map<string, TagEvent["payload"]>();
    for (const tag of tags) if (!map.has(tag.deviceId)) map.set(tag.deviceId, tag);
    return Array.from(map.values());
  }, [tags]);

  return (
    <section className="scada-grid">
      <div className="overview">
        <div>
          <p>Live plant state</p>
          <h2>{tags.length ? "Streaming" : "Waiting for telemetry"}</h2>
        </div>
        <RadioTower size={34} />
      </div>
      <div className="panel process">
        <h3>SCADA Process</h3>
        <div className="line">
          <div className="machine"><Cpu /> Press 001</div>
          <div className="flow" />
          <div className="machine"><Cpu /> PLC Cell</div>
          <div className="flow" />
          <div className="machine"><Bell /> Alarm Bus</div>
        </div>
      </div>
      <div className="panel">
        <h3>Latest Tags</h3>
        <div className="tag-list">
          {(tags.length ? tags : sampleTags).map((tag, index) => (
            <div className="tag-row" key={`${tag.deviceId}-${tag.tagName}-${index}`}>
              <span>{tag.deviceId}</span>
              <strong>{tag.tagName}</strong>
              <code>{String(tag.value)}</code>
              <small>{tag.quality}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <h3>Device Subscriptions</h3>
        <div className="device-grid">
          {(latestByDevice.length ? latestByDevice : sampleTags.slice(0, 3)).map((tag) => (
            <article key={tag.deviceId}>
              <span>{tag.deviceId}</span>
              <strong>{tag.tagName}</strong>
              <p>{String(tag.value)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const sampleTags: TagEvent["payload"][] = [
  { tenantId: "tenant-demo", deviceId: "press-001", tagName: "temperature", value: 72.4, timestamp: new Date().toISOString(), quality: "GOOD" },
  { tenantId: "tenant-demo", deviceId: "plc-modbus-001", tagName: "modbus.frame.length", value: 12, timestamp: new Date().toISOString(), quality: "UNCERTAIN" },
  { tenantId: "tenant-demo", deviceId: "meter-645-001", tagName: "dlt645.frame.length", value: 18, timestamp: new Date().toISOString(), quality: "UNCERTAIN" }
];
