import type { ReactNode } from "react";

export function StarterCard({ title, detail }: { title: string; detail: string }): ReactNode {
  return (
    <section className="starter-card">
      <h2>{title}</h2>
      <p>{detail}</p>
    </section>
  );
}
