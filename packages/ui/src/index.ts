import { createElement as h, type ReactNode } from "react";

export function StarterCard({ title, detail }: { title: string; detail: string }): ReactNode {
  return h(
    "section",
    { className: "starter-card" },
    h("h2", null, title),
    h("p", null, detail),
  );
}

export function ChiccLogo({ className = "" }: { className?: string }): ReactNode {
  return h(
    "svg",
    {
      className,
      viewBox: "0 0 320 320",
      role: "img",
      "aria-label": "Chicc — The scent of the aura",
      xmlns: "http://www.w3.org/2000/svg",
    },
    h("circle", { cx: "160", cy: "160", r: "153", fill: "#f0e5ce", stroke: "#aa8143", strokeWidth: "5" }),
    h("circle", { cx: "160", cy: "160", r: "146", fill: "none", stroke: "#b79457", strokeOpacity: ".28", strokeWidth: "1" }),
    h(
      "g",
      { fill: "none", stroke: "#aa8143", strokeLinecap: "round", strokeLinejoin: "round" },
      h("path", { d: "M160 39c20 19-8 31-4 47 3 10 13 13 15 23 3 12-7 20-11 30", strokeWidth: "4" }),
      h("path", { d: "M160 57c-17 16-21 28-13 39", strokeWidth: "2.2" }),
      h("path", { d: "M139 119h42v9h10v41c0 9-6 15-15 15h-32c-9 0-15-6-15-15v-41h10z", strokeWidth: "4" }),
      h("path", { d: "M151 119v-13h18v13M143 137h36", strokeWidth: "3" }),
    ),
    h("text", { x: "160", y: "218", textAnchor: "middle", fill: "#21160f", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "66", fontStyle: "italic", letterSpacing: "-5" }, "Chicc"),
    h("path", { d: "M78 244h67m30 0h67", stroke: "#aa8143", strokeWidth: "1.5" }),
    h("path", { d: "m160 235 3 7 7 2-7 3-3 7-3-7-7-3 7-2z", fill: "#aa8143" }),
    h("text", { x: "160", y: "271", textAnchor: "middle", fill: "#403326", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "14", letterSpacing: "3.1" }, "The scent of the aura"),
  );
}

export type ChiccIconName = "arrow-up-right" | "arrow-right" | "arrow-left" | "check" | "sparkles" | "plus";

const chiccIconPaths: Record<ChiccIconName, ReactNode> = {
  "arrow-up-right": h("path", { d: "M7 17 17 7M8 7h9v9" }),
  "arrow-right": h("path", { d: "M5 12h14m-7-7 7 7-7 7" }),
  "arrow-left": h("path", { d: "M19 12H5m7 7-7-7 7-7" }),
  check: h("path", { d: "m5 12 4 4L19 6" }),
  sparkles: h("path", { d: "m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" }),
  plus: h("path", { d: "M12 5v14M5 12h14" }),
};

export function ChiccIcon({ name, size = 18, className = "" }: { name: ChiccIconName; size?: number; className?: string }): ReactNode {
  return h("svg", {
    className,
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false",
  }, chiccIconPaths[name]);
}
