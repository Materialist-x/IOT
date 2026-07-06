import { ReactNode } from "react";

export function PageTitle({ title, extra }: { title: string; extra?: ReactNode }) {
  return (
    <div className="page-title">
      <h1>{title}</h1>
      {extra}
    </div>
  );
}
