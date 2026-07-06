import { PageTitle } from "../../components/base/PageTitle";
import { ScadaEditor } from "../../scada/editor/ScadaEditor";
import { defaultScene } from "../../scada/model/defaultScene";

export function ScadaEditorView() {
  return <><PageTitle title="组态编辑器" /><section className="panel"><ScadaEditor scene={defaultScene} /></section></>;
}
