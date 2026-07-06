import { FormEvent, useState } from "react";
import { rolePermissions } from "../../core/permission/rbac";
import { Role } from "../../types/domain";

type Account = { id: string; username: string; role: Role; status: string };

export function UserAdminPanel() {
  const [accounts, setAccounts] = useState<Account[]>([
    { id: "U1", username: "admin", role: "admin", status: "启用" },
    { id: "U2", username: "operator01", role: "operator", status: "启用" },
    { id: "U3", username: "viewer01", role: "viewer", status: "启用" }
  ]);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role>("operator");

  function submit(event: FormEvent): void {
    event.preventDefault();
    if (!username) return;
    setAccounts([{ id: `U${Date.now()}`, username, role, status: "启用" }, ...accounts]);
    setUsername("");
  }

  return (
    <section className="split-grid">
      <form className="panel stack-form" onSubmit={submit}>
        <h2>创建账号</h2>
        <label>登录账号<input value={username} onChange={(event) => setUsername(event.target.value)} /></label>
        <label>角色
          <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <option value="operator">操作员</option>
            <option value="viewer">访客</option>
            <option value="admin">管理员</option>
          </select>
        </label>
        <button type="submit">添加账号</button>
      </form>
      <article className="panel">
        <h2>RBAC 权限矩阵</h2>
        <div className="table-scroll">
          <table>
            <thead><tr><th>账号</th><th>角色</th><th>权限</th><th>状态</th></tr></thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.username}</td>
                  <td>{roleLabel(account.role)}</td>
                  <td>{rolePermissions[account.role].join(", ")}</td>
                  <td>{account.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function roleLabel(role: Role): string {
  if (role === "admin") return "管理员";
  if (role === "operator") return "操作员";
  return "访客";
}
