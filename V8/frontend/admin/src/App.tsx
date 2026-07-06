import { ShieldCheck, Users, Workflow } from "lucide-react";
import "./styles.css";

export default function App() {
  return (
    <section className="admin-grid">
      <article>
        <ShieldCheck />
        <span>RBAC Gateway</span>
        <strong>JWT, tenant scope, rate limits</strong>
      </article>
      <article>
        <Users />
        <span>Tenants</span>
        <strong>Active: tenant-demo</strong>
      </article>
      <article>
        <Workflow />
        <span>Service Policy</span>
        <strong>Broker-only communication</strong>
      </article>
      <div className="admin-table">
        <h3>Control Plane Services</h3>
        {["gateway-service", "tenant-service", "device-service", "license-service", "billing-service"].map((service) => (
          <div key={service}>
            <span>{service}</span>
            <code>stateless</code>
            <strong>PostgreSQL scoped</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
