import { PageTitle } from "../../components/base/PageTitle";
import { DeviceCreateForm } from "../../modules/device/DeviceCreateForm";
import { DeviceTable } from "../../modules/device/DeviceTable";

export function DeviceListView() {
  return (
    <>
      <PageTitle title="设备管理" />
      <section className="split-grid">
        <article className="panel"><h2>创建设备</h2><DeviceCreateForm /></article>
        <article className="panel"><h2>设备台账</h2><DeviceTable /></article>
      </section>
    </>
  );
}
