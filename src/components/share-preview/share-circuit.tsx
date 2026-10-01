import { sharePalette } from "@/components/share-preview/share-palette";

export function ShareCircuit() {
  return (
    <svg
      width="1200"
      height="630"
      viewBox="0 0 1200 630"
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <path
        d="M1040 24 L1040 90 L1090 140 L1090 230 L1140 280 L1140 360"
        stroke={sharePalette.trace}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M1168 150 L1168 380 L1128 420 L1128 500"
        stroke={sharePalette.trace}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M900 100 L900 190 L960 250 L960 430 L920 470 L920 540"
        stroke={sharePalette.trace}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M860 470 L860 530 L910 580 L1080 580 L1120 620"
        stroke={sharePalette.trace}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M1088 48 L1160 48 L1190 78 L1190 140"
        stroke={sharePalette.hair}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="1040" cy="24" r="8" fill={sharePalette.hair} />
      <circle cx="1040" cy="24" r="3" fill={sharePalette.limeDeep} />
      <circle cx="1168" cy="150" r="8" fill={sharePalette.hair} />
      <circle cx="1168" cy="150" r="3" fill={sharePalette.lime} />
      <circle cx="920" cy="540" r="8" fill={sharePalette.hair} />
      <circle cx="920" cy="540" r="3" fill={sharePalette.limeDeep} />
      <rect
        x="1108"
        y="500"
        width="22"
        height="12"
        rx="1.5"
        fill={sharePalette.onLime}
        stroke={sharePalette.trace}
        strokeWidth="1.2"
      />
    </svg>
  );
}
