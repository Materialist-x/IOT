import { FormEvent, useState } from "react";
import { Eye, ShieldCheck, Users } from "lucide-react";
import { Role } from "../../types/domain";

export function LoginView({ onLogin }: { onLogin: (username: string, role: Role, tenantId: string) => void }) {
  const [role, setRole] = useState<Role>("admin");
  const [username, setUsername] = useState("admin");
  const [tenantId, setTenantId] = useState("T1");

  function submit(event: FormEvent): void {
    event.preventDefault();
    onLogin(username, role, tenantId);
  }

  return (
    <main className="login-view">
      <form className="login-card" onSubmit={submit}>
        <h1>V8 SCADA 工业平台</h1>
        <div className="segmented three">
          <button type="button" className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}><ShieldCheck size={16} />管理员</button>
          <button type="button" className={role === "operator" ? "active" : ""} onClick={() => setRole("operator")}><Users size={16} />操作员</button>
          <button type="button" className={role === "viewer" ? "active" : ""} onClick={() => setRole("viewer")}><Eye size={16} />访客</button>
        </div>
        <label>租户编号<input value={tenantId} onChange={(event) => setTenantId(event.target.value)} /></label>
        <label>登录账号<input value={username} onChange={(event) => setUsername(event.target.value)} /></label>
        <label>登录密码<input type="password" defaultValue="123456" /></label>
        <button type="submit">登录系统</button>
      </form>
    </main>
  );
}
