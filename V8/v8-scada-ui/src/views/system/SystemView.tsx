import { PageTitle } from "../../components/base/PageTitle";
import { UserAdminPanel } from "../../modules/system/UserAdminPanel";

export function SystemView() {
  return <><PageTitle title="系统权限" /><UserAdminPanel /></>;
}
