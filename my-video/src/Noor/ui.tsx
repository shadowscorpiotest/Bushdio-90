import React from "react";
import {
  AbsoluteFill,
  Img,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { A, C, FONT } from "./theme";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = frame * 0.25;
  const g1 = 28 + Math.sin(frame / 90) * 8;
  const g2 = 74 + Math.cos(frame / 110) * 8;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${C.bg1} 0%, ${C.bg2} 55%, ${C.bg1} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${g1}% 22%, rgba(47,107,255,0.38), transparent 45%), radial-gradient(circle at ${g2}% 82%, rgba(226,189,107,0.17), transparent 40%)`,
        }}
      />
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.07 }}>
        <defs>
          <pattern
            id="girih"
            width="140"
            height="140"
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${drift} ${drift * 0.5})`}
          >
            <g fill="none" stroke={C.goldSoft} strokeWidth="1.5" transform="translate(70 70)">
              <rect x="-34" y="-34" width="68" height="68" />
              <rect x="-34" y="-34" width="68" height="68" transform="rotate(45)" />
              <circle r="15" />
            </g>
            <path
              d="M0 70 H22 M118 70 H140 M70 0 V22 M70 118 V140"
              stroke={C.goldSoft}
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#girih)" />
      </svg>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 28,
          border: "1.5px solid rgba(226,189,107,0.28)",
          borderRadius: 24,
        }}
      />
    </AbsoluteFill>
  );
};

export const Scene: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <AbsoluteFill style={{ direction: "rtl", fontFamily: FONT, color: C.text, ...style }}>
    {children}
  </AbsoluteFill>
);

// Each scene is an entry animation followed by click steps; the deck is cut at step starts,
// so anything a step animates must settle before the next step begins
export const StepCtx = React.createContext({ lens: [55] as number[] });
export const useAt = () => {
  const { lens } = React.useContext(StepCtx);
  return (i: number) => lens.slice(0, i).reduce((a, b) => a + b, 0);
};

export const useSpring = (delay = 0, damping = 200) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
};

export const Reveal: React.FC<{
  delay?: number;
  y?: number;
  x?: number;
  scale?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 30, x = 0, scale = false, children, style }) => {
  const p = useSpring(delay);
  const s = scale ? 0.85 + 0.15 * p : 1;
  return (
    <div
      style={{
        opacity: p,
        transform: `translate(${(1 - p) * x}px, ${(1 - p) * y}px) scale(${s})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export type IconName =
  | "book"
  | "headphones"
  | "languages"
  | "layers"
  | "type"
  | "library"
  | "search"
  | "bookmark"
  | "check"
  | "play"
  | "pause"
  | "next"
  | "prev"
  | "speaker"
  | "note"
  | "download"
  | "repeat"
  | "sparkles"
  | "info"
  | "smartphone"
  | "tablet"
  | "tv"
  | "star"
  | "globe"
  | "home"
  | "mic"
  | "back";

const paths: Record<IconName, React.ReactNode> = {
  book: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  headphones: (
    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
  ),
  languages: (
    <>
      <path d="m5 8 6 6" />
      <path d="m4 14 6-6 2-3" />
      <path d="M2 5h12" />
      <path d="M7 2h1" />
      <path d="m22 22-5-10-5 10" />
      <path d="M14 18h6" />
    </>
  ),
  layers: (
    <>
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </>
  ),
  type: (
    <>
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
    </>
  ),
  library: (
    <>
      <path d="m16 6 4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  bookmark: <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  play: <polygon points="6 3 20 12 6 21 6 3" />,
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </>
  ),
  next: (
    <>
      <polygon points="5 4 15 12 5 20 5 4" />
      <path d="M19 5v14" />
    </>
  ),
  prev: (
    <>
      <polygon points="19 20 9 12 19 4 19 20" />
      <path d="M5 19V5" />
    </>
  ),
  speaker: (
    <>
      <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" />
      <path d="M16 9a5 5 0 0 1 0 6" />
      <path d="M19.4 18.4a9 9 0 0 0 0-12.8" />
    </>
  ),
  note: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  repeat: (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </>
  ),
  sparkles: (
    <>
      <path d="M9.9 15.5A2 2 0 0 0 8.5 14.1l-6.1-1.6a.5.5 0 0 1 0-1l6.1-1.6A2 2 0 0 0 9.9 8.5l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </>
  ),
  smartphone: (
    <>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </>
  ),
  tablet: (
    <>
      <rect x="3" y="2" width="18" height="20" rx="2" />
      <path d="M12 18h.01" />
    </>
  ),
  tv: (
    <>
      <rect x="2" y="7" width="20" height="15" rx="2" />
      <path d="m17 2-5 5-5-5" />
    </>
  ),
  star: (
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </>
  ),
  mic: (
    <>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </>
  ),
  back: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  home: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>
  ),
};

export const Icon: React.FC<{
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
}> = ({ name, size = 32, color = "currentColor", stroke = 2, fill = "none" }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={fill}
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {paths[name]}
  </svg>
);

export const AppIcon: React.FC<{ size: number; radius?: number }> = ({ size, radius }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: radius ?? size * 0.24,
      overflow: "hidden",
      flexShrink: 0,
    }}
  >
    <Img
      src={staticFile("app-icon.png")}
      style={{ width: "100%", height: "100%", transform: "scale(1.1)" }}
    />
  </div>
);

export const IconBadge: React.FC<{ name: IconName; size?: number }> = ({ name, size = 96 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.3,
      background: `linear-gradient(135deg, ${C.blue}, ${C.blueDeep})`,
      boxShadow: "0 12px 40px rgba(47,107,255,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <Icon name={name} size={size * 0.5} color="white" />
  </div>
);

export const Pill: React.FC<{ children: React.ReactNode; gold?: boolean }> = ({
  children,
  gold,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 26px",
      borderRadius: 999,
      fontSize: 26,
      fontWeight: 700,
      color: gold ? C.bg1 : C.goldSoft,
      background: gold ? C.gold : "rgba(226,189,107,0.12)",
      border: `1.5px solid ${gold ? C.gold : "rgba(226,189,107,0.45)"}`,
    }}
  >
    {children}
  </div>
);

export const Glass: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      background: C.glass,
      border: `1.5px solid ${C.glassBorder}`,
      borderRadius: 28,
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Divider: React.FC<{ delay?: number; width?: number }> = ({
  delay = 0,
  width = 420,
}) => {
  const p = useSpring(delay);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
      <div
        style={{
          width: (width / 2) * p,
          height: 2,
          background: `linear-gradient(to left, ${C.gold}, transparent)`,
        }}
      />
      <div
        style={{
          width: 14,
          height: 14,
          transform: `rotate(45deg) scale(${p})`,
          border: `2px solid ${C.gold}`,
        }}
      />
      <div
        style={{
          width: (width / 2) * p,
          height: 2,
          background: `linear-gradient(to right, ${C.gold}, transparent)`,
        }}
      />
    </div>
  );
};

// Phone frame; the screen (412 × 888) is filled by a ShotScreen or an AppScreen
export const Phone: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const p = useSpring(delay, 18);
  const float = Math.sin(frame / 30) * 8;
  return (
    <div
      style={{
        width: 440,
        height: 916,
        borderRadius: 64,
        padding: 14,
        background: "linear-gradient(145deg, #2a3350, #080c1a)",
        boxShadow:
          "0 50px 120px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.1), 0 0 90px rgba(47,107,255,0.35)",
        transform: `translateY(${(1 - p) * 220 + float}px) rotate(${(1 - p) * -8}deg)`,
        opacity: Math.min(1, p * 1.5),
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 52,
          overflow: "hidden",
          background: A.header,
          position: "relative",
          direction: "rtl",
          fontFamily: FONT,
          color: A.text,
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 116,
            height: 28,
            borderRadius: 20,
            background: "#05080f",
          }}
        />
      </div>
    </div>
  );
};

export const MiniChip: React.FC<{ children: React.ReactNode; active?: boolean }> = ({
  children,
  active,
}) => (
  <div
    style={{
      padding: "6px 14px",
      borderRadius: 999,
      fontSize: 16,
      fontWeight: 700,
      background: active ? A.blue : A.card,
      color: active ? A.blueInk : A.text,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

export const Skeleton: React.FC<{ width: string | number; height?: number }> = ({
  width,
  height = 10,
}) => <div style={{ width, height, borderRadius: 6, background: "#555" }} />;
