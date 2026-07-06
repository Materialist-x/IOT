import { useHistoryStore } from "../../store/historyStore";

export function HistoryTable() {
  const points = useHistoryStore((state) => state.points);

  return (
    <article className="panel">
      <h2>历史明细</h2>
      <div className="table-scroll">
        <table>
          <thead><tr><th>设备</th><th>Tag</th><th>值</th><th>时间</th></tr></thead>
          <tbody>
            {points.map((point) => (
              <tr key={`${point.deviceId}-${point.tagName}-${point.timestamp}`}>
                <td>{point.deviceId}</td>
                <td>{point.tagName}</td>
                <td>{point.value}</td>
                <td>{new Date(point.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
