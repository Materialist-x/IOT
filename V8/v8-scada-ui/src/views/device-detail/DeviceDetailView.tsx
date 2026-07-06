import { PageTitle } from "../../components/base/PageTitle";
import { useDeviceStore } from "../../store/deviceStore";

export function DeviceDetailView() {
  const device = useDeviceStore((state) => state.devices[0]);
  return (
    <>
      <PageTitle title="设备详情" />
      <article className="panel detail-panel">
        <h2>{device?.name ?? "未选择设备"}</h2>
        <p>设备编号：{device?.id ?? "--"}</p>
        <p>通信协议：{device?.protocol ?? "--"}</p>
        <p>运行状态：{device?.status ?? "--"}</p>
        <p>安装位置：{device?.location ?? "--"}</p>
        <p>最后在线：{device?.lastSeen ? new Date(device.lastSeen).toLocaleString() : "--"}</p>
      </article>
    </>
  );
}
