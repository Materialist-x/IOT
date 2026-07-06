import { PageTitle } from "../../components/base/PageTitle";
import { ScadaRuntime } from "../../scada/runtime/ScadaRuntime";
import { defaultScene } from "../../scada/model/defaultScene";

export function ScadaRuntimeView() {
  return <><PageTitle title="组态运行" /><section className="panel"><ScadaRuntime scene={defaultScene} /></section></>;
}
