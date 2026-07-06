import { useTagStore } from "../../store/tagStore";

export function TagMonitorTable() {
  const latest = useTagStore((state) => state.latest);
  return (
    <table>
      <thead><tr><th>设备</th><th>标签</th><th>数值</th><th>时间</th></tr></thead>
      <tbody>
        {latest.map((tag, index) => (
          <tr key={`${tag.deviceId}-${tag.tagName}-${index}`}><td>{tag.deviceId}</td><td>{tag.tagName}</td><td>{String(tag.value)}</td><td>{new Date(tag.timestamp).toLocaleTimeString()}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
