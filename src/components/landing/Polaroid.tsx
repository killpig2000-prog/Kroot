import type { CSSProperties } from "react";

// Illustrated "photo" scenes for the scrapbook polaroids — pure CSS gradients,
// no network images, so the landing paints instantly and never breaks offline.
export type SceneKey = "hanok" | "night" | "food" | "cafe" | "han" | "market";

const SCENES: Record<SceneKey, { base: string; overlay: CSSProperties }> = {
  hanok: {
    base: "linear-gradient(180deg,#cfe3f5 0%,#e9e2cf 52%,#b09468 100%)",
    overlay: {
      left: 0, right: 0, bottom: "26%", height: "26%",
      background: "linear-gradient(175deg,#4a4038 40%,#2d261c 100%)",
      clipPath: "polygon(0 62%,8% 30%,50% 8%,92% 30%,100% 62%,100% 100%,0 100%)",
    },
  },
  night: {
    base: "linear-gradient(180deg,#1b2440 0%,#232c52 45%,#3b2a55 100%)",
    overlay: {
      inset: 0,
      background:
        "radial-gradient(circle 2px at 12% 68%,#ffd166 60%,transparent 61%)," +
        "radial-gradient(circle 2px at 26% 55%,#fca5a5 60%,transparent 61%)," +
        "radial-gradient(circle 3px at 43% 72%,#fde68a 60%,transparent 61%)," +
        "radial-gradient(circle 2px at 61% 58%,#93c5fd 60%,transparent 61%)," +
        "radial-gradient(circle 3px at 74% 66%,#f9a8d4 60%,transparent 61%)," +
        "radial-gradient(circle 4px at 55% 80%,#fde68a 60%,transparent 61%)",
    },
  },
  food: {
    base: "linear-gradient(180deg,#5a2e14 0%,#8a4a1c 55%,#c2703a 100%)",
    overlay: {
      inset: 0, filter: "blur(1px)",
      background:
        "radial-gradient(circle 24px at 30% 78%,#f59e0b 58%,transparent 60%)," +
        "radial-gradient(circle 18px at 62% 84%,#ef4444 58%,transparent 60%)," +
        "radial-gradient(circle 15px at 84% 74%,#fbbf24 58%,transparent 60%)," +
        "radial-gradient(circle 40px at 50% 12%,rgba(255,240,200,.5) 40%,transparent 70%)",
    },
  },
  cafe: {
    base: "linear-gradient(180deg,#e8d9c3 0%,#cdb190 60%,#9a7b57 100%)",
    overlay: {
      inset: 0,
      background:
        "radial-gradient(circle 26px at 26% 70%,#6b4226 60%,transparent 62%)," +
        "radial-gradient(circle 11px at 26% 52%,#f5efe4 60%,transparent 62%)," +
        "radial-gradient(circle 22px at 70% 76%,#3f6e4e 60%,transparent 62%)," +
        "radial-gradient(circle 55px at 82% 8%,rgba(255,250,235,.65) 40%,transparent 70%)",
    },
  },
  han: {
    base: "linear-gradient(180deg,#fbcfe8 0%,#f9a8d4 30%,#6d84c4 75%,#3b4a7a 100%)",
    overlay: {
      left: 0, right: 0, bottom: 0, height: "34%",
      background:
        "repeating-linear-gradient(90deg,rgba(255,255,255,.35) 0 2px,transparent 2px 26px),linear-gradient(#41528c,#2b3763)",
    },
  },
  market: {
    base: "linear-gradient(180deg,#374151 0%,#6b7280 40%,#b45309 100%)",
    overlay: {
      left: 0, right: 0, top: "8%", height: "22%",
      background:
        "repeating-linear-gradient(90deg,rgba(251,191,36,.5) 0 18px,rgba(239,68,68,.5) 18px 36px,rgba(59,130,246,.4) 36px 54px)",
    },
  },
};

export type TapeColor = "blue" | "yellow" | "pink";

const TAPE: Record<TapeColor, CSSProperties> = {
  blue: { background: "rgba(190,227,248,.65)", borderColor: "rgba(150,200,230,.45)" },
  yellow: { background: "rgba(253,230,138,.6)", borderColor: "rgba(217,180,90,.45)" },
  pink: { background: "rgba(251,207,232,.6)", borderColor: "rgba(230,150,190,.45)" },
};

export function Tape({ color = "blue", className = "" }: { color?: TapeColor; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute -top-2 left-1/2 -translate-x-1/2 -rotate-3 w-[54px] h-[17px] border z-10 ${className}`}
      style={TAPE[color]}
    />
  );
}

export default function Polaroid({
  scene,
  caption,
  tape = "blue",
  className = "",
  style,
}: {
  scene: SceneKey;
  caption: string;
  tape?: TapeColor;
  className?: string;
  style?: CSSProperties;
}) {
  const s = SCENES[scene];
  return (
    <figure
      aria-hidden="true"
      className={`m-0 bg-white border border-[#E3DDD0] p-[7px] pb-6 shadow-[0_14px_30px_-14px_rgba(60,50,30,.35)] ${className}`}
      style={style}
    >
      <Tape color={tape} />
      <div className="relative w-full h-full overflow-hidden" style={{ background: s.base }}>
        <span className="absolute" style={s.overlay} />
      </div>
      <figcaption className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-semibold text-[#8A8478]">
        {caption}
      </figcaption>
    </figure>
  );
}
