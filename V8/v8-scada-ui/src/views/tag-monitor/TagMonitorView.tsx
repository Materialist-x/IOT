import { PageTitle } from "../../components/base/PageTitle";
import { TagConfigPanel } from "../../modules/tag-monitor/TagConfigPanel";
import { TagCard } from "../../modules/tag-monitor/TagCard";
import { TagTable } from "../../modules/tag-monitor/TagTable";

export function TagMonitorView() {
  return (
    <>
      <PageTitle title="实时 Tag 监控" />
      <TagConfigPanel />
      <TagCard />
      <article className="panel"><h2>实时数据表</h2><TagTable /></article>
    </>
  );
}
