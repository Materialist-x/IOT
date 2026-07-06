import { PageTitle } from "../../components/base/PageTitle";
import { AlarmTable } from "../../modules/alarm/AlarmTable";

export function AlarmCenterView() {
  return <><PageTitle title="告警中心" /><article className="panel"><AlarmTable /></article></>;
}
