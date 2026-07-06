import { CheckCircle2, ClipboardList, Wrench } from "lucide-react";
import "./styles.css";

export default function App() {
  return (
    <section className="operator-view">
      <div className="work-card">
        <ClipboardList />
        <div>
          <span>Shift Work Queue</span>
          <strong>3 active device checks</strong>
        </div>
      </div>
      {["Inspect press-001 cooling loop", "Verify PLC Modbus signal", "Acknowledge meter cabinet alarm"].map((task, index) => (
        <div className="task" key={task}>
          {index === 0 ? <Wrench /> : <CheckCircle2 />}
          <span>{task}</span>
          <button>Open</button>
        </div>
      ))}
    </section>
  );
}
