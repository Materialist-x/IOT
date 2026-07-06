import { CalendarClock, Gauge, ServerCog } from "lucide-react";
import "./styles.css";

export default function App() {
  return (
    <section className="tenant-grid">
      <div className="license">
        <CalendarClock />
        <div>
          <span>Enterprise License</span>
          <strong>10,000 devices</strong>
        </div>
      </div>
      <div className="quota">
        <Gauge />
        <div>
          <span>Data Rate</span>
          <strong>100,000/min</strong>
        </div>
      </div>
      <div className="portal-table">
        <h3>Tenant Isolation</h3>
        {["Cache keys include tenantId", "Realtime channels are tenant scoped", "Device queries require tenantId", "Billing usage emits tenantId"].map((item) => (
          <p key={item}><ServerCog size={16} /> {item}</p>
        ))}
      </div>
    </section>
  );
}
