import { PageTitle } from "../../components/base/PageTitle";
import { HistoryChart } from "../../modules/history/HistoryChart";
import { HistoryTable } from "../../modules/history/HistoryTable";

export function HistoryView() {
  return (
    <>
      <PageTitle title="历史数据" />
      <section className="history-grid">
        <HistoryChart />
        <HistoryTable />
      </section>
    </>
  );
}
