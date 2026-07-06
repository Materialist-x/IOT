import { hasPermission } from "../../core/permission/permission";
import { useAlarmStore } from "../../store/alarmStore";

export function AlarmTable() {
  const alarms = useAlarmStore((state) => state.alarms);
  const acknowledge = useAlarmStore((state) => state.acknowledge);
  const canAck = hasPermission("alarm:ack");

  return (
    <div className="table-scroll">
      <table>
        <thead><tr><th>设备</th><th>级别</th><th>内容</th><th>时间</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          {alarms.map((alarm) => (
            <tr key={alarm.id}>
              <td>{alarm.deviceId}</td>
              <td><span className={`alarm-level ${alarm.severity}`}>{severityLabel(alarm.severity)}</span></td>
              <td>{alarm.message}</td>
              <td>{new Date(alarm.timestamp).toLocaleString()}</td>
              <td>{alarm.acknowledged ? "已确认" : "待确认"}</td>
              <td>{canAck && !alarm.acknowledged ? <button className="small-button" onClick={() => acknowledge(alarm.id)}>确认</button> : <span className="muted">无操作</span>}</td>
            </tr>
          ))}
          {alarms.length === 0 ? <tr><td colSpan={6} className="muted">暂无告警</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

function severityLabel(severity: string): string {
  if (severity === "critical") return "严重";
  if (severity === "warning") return "警告";
  return "提示";
}
