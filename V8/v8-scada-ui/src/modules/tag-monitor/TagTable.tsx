import { useTagStore } from "../../store/tagStore";

export function TagTable() {
  const latest = useTagStore((state) => state.latest);

  return (
    <div className="table-scroll">
      <table>
        <thead><tr><th>设备</th><th>Tag</th><th>原始值</th><th>解析倍数</th><th>显示值</th><th>质量</th><th>时间</th></tr></thead>
        <tbody>
          {latest.map((tag) => (
            <tr key={`${tag.deviceId}-${tag.tagName}`}>
              <td>{tag.deviceId}</td>
              <td>{tag.tagName}</td>
              <td>{String(tag.rawValue ?? tag.value)}</td>
              <td>{tag.multiplier ?? 1}</td>
              <td>{String(tag.value)}</td>
              <td>{tag.quality ?? "Unknown"}</td>
              <td>{new Date(tag.timestamp).toLocaleString()}</td>
            </tr>
          ))}
          {latest.length === 0 ? <tr><td colSpan={7} className="muted">暂无实时数据</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
