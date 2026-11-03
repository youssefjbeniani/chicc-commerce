import type { ReactNode } from "react";

export function StarterCard({ title, detail }: { title: string; detail: string }): ReactNode {
  return (
    <section className="starter-card">
      <h2>{title}</h2>
      <p>{detail}</p>
    </section>
  );
}

export function ChiccLogo({ className = "" }: { className?: string }): ReactNode {
  return (
    <svg className={className} viewBox="0 0 320 320" role="img" aria-label="Chicc — The scent of the aura" xmlns="http://www.w3.org/2000/svg">
      <circle cx="160" cy="160" r="153" fill="#f0e5ce" stroke="#aa8143" strokeWidth="5" />
      <circle cx="160" cy="160" r="146" fill="none" stroke="#b79457" strokeOpacity=".28" strokeWidth="1" />
      <g fill="none" stroke="#aa8143" strokeLinecap="round" strokeLinejoin="round">
        <path d="M160 39c20 19-8 31-4 47 3 10 13 13 15 23 3 12-7 20-11 30" strokeWidth="4" />
        <path d="M160 57c-17 16-21 28-13 39" strokeWidth="2.2" />
        <path d="M139 119h42v9h10v41c0 9-6 15-15 15h-32c-9 0-15-6-15-15v-41h10z" strokeWidth="4" />
        <path d="M151 119v-13h18v13M143 137h36" strokeWidth="3" />
      </g>
      <text x="160" y="218" textAnchor="middle" fill="#21160f" fontFamily="Georgia, 'Times New Roman', serif" fontSize="66" fontStyle="italic" letterSpacing="-5">Chicc</text>
      <path d="M78 244h67m30 0h67" stroke="#aa8143" strokeWidth="1.5" />
      <path d="m160 235 3 7 7 2-7 3-3 7-3-7-7-3 7-2z" fill="#aa8143" />
      <text x="160" y="271" textAnchor="middle" fill="#403326" fontFamily="Georgia, 'Times New Roman', serif" fontSize="14" letterSpacing="3.1">The scent of the aura</text>
    </svg>
  );
}
