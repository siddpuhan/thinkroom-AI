import { motion } from "framer-motion";

type LogoSize = "sm" | "md" | "lg" | "xl";
type LogoVariant = "default" | "monochrome" | "light";

const sizeMap: Record<LogoSize, { box: number; icon: number; text: string; sub: string }> = {
  sm: { box: 28, icon: 28, text: "15px", sub: "11px" },
  md: { box: 32, icon: 32, text: "17px", sub: "12px" },
  lg: { box: 40, icon: 40, text: "21px", sub: "14px" },
  xl: { box: 48, icon: 48, text: "26px", sub: "16px" },
};

interface LogoIconProps {
  size?: LogoSize;
  animated?: boolean;
  className?: string;
}

function TMark({ size = 32, animated = false }: { size: number; animated?: boolean }) {
  const s = size / 32;
  return (
    <>
      <rect x={3.5 * s} y={8 * s} width={25 * s} height={6 * s} rx={3 * s} fill="currentColor" />
      <rect x={12.5 * s} y={14 * s} width={7 * s} height={10 * s} rx={3.5 * s} fill="currentColor" />
      <circle cx={12.5 * s} cy={26.5 * s} r={1.2 * s} fill="currentColor" opacity={animated ? 1 : 0.3} />
      <motion.circle
        cx={16 * s}
        cy={26.5 * s}
        r={1.8 * s}
        fill="currentColor"
        animate={animated ? { scale: [1, 1.15, 1] } : undefined}
        transition={animated ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : undefined}
      />
      <circle cx={19.5 * s} cy={26.5 * s} r={1.2 * s} fill="currentColor" opacity={animated ? 1 : 0.3} />
    </>
  );
}

export function LogoIcon({ size = "md", animated = false, className = "" }: LogoIconProps) {
  const dims = sizeMap[size];
  return (
    <svg
      width={dims.icon}
      height={dims.icon}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="9" fill="#7C5CFC" />
      <g fill="white">
        <TMark size={32} animated={animated} />
      </g>
    </svg>
  );
}

export function LogoMark({ size = "md", animated = false, className = "" }: LogoIconProps) {
  const dims = sizeMap[size];
  return (
    <svg
      width={dims.icon}
      height={dims.icon}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <TMark size={32} animated={animated} />
    </svg>
  );
}

interface LogoHorizontalProps {
  size?: LogoSize;
  variant?: LogoVariant;
  animated?: boolean;
  className?: string;
}

export function LogoHorizontal({ size = "md", variant = "default", animated = false, className = "" }: LogoHorizontalProps) {
  const dims = sizeMap[size];
  const textColor = variant === "monochrome" ? "#1A1A1A" : variant === "light" ? "#FFFFFF" : "#1A1A1A";
  const accentColor = variant === "monochrome" ? "#1A1A1A" : "#7C5CFC";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {variant === "monochrome" ? (
        <svg width={dims.icon} height={dims.icon} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="9" fill={textColor} />
          <g fill={textColor === "#1A1A1A" ? "white" : textColor}>
            <TMark size={32} animated={animated} />
          </g>
        </svg>
      ) : variant === "light" ? (
        <svg width={dims.icon} height={dims.icon} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="9" fill={accentColor} />
          <g fill="white">
            <TMark size={32} animated={animated} />
          </g>
        </svg>
      ) : (
        <LogoIcon size={size} animated={animated} />
      )}

      <div className="flex items-baseline gap-1.5" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
        <span
          className="font-extrabold tracking-[-0.03em] leading-none"
          style={{ fontSize: dims.text, color: textColor }}
        >
          ThinkRoom
        </span>
        <span
          className="font-semibold tracking-[-0.02em] leading-none"
          style={{ fontSize: dims.sub, color: variant === "monochrome" ? textColor : "#7C5CFC", opacity: 0.8 }}
        >
          AI
        </span>
      </div>
    </div>
  );
}

export function LogomarkFavicon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="9" fill="#7C5CFC" />
      <g fill="white">
        <rect x="4" y="8" width="24" height="6" rx="3" />
        <rect x="13" y="14" width="6" height="11" rx="3" />
        <circle cx="16" cy="28" r="2" fill="white" />
      </g>
    </svg>
  );
}

export function LogomarkLight() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="9" fill="#1A1A1A" />
      <g fill="white">
        <rect x="4" y="8" width="24" height="6" rx="3" />
        <rect x="13" y="14" width="6" height="11" rx="3" />
        <circle cx="12.5" cy="27" r="1.3" fill="white" opacity="0.3" />
        <circle cx="16" cy="27" r="1.8" fill="white" />
        <circle cx="19.5" cy="27" r="1.3" fill="white" opacity="0.3" />
      </g>
    </svg>
  );
}

export function LogomarkDark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="9" fill="#7C5CFC" />
      <g fill="white">
        <rect x="4" y="8" width="24" height="6" rx="3" />
        <rect x="13" y="14" width="6" height="11" rx="3" />
        <circle cx="12.5" cy="27" r="1.3" fill="white" opacity="0.3" />
        <circle cx="16" cy="27" r="1.8" fill="white" />
        <circle cx="19.5" cy="27" r="1.3" fill="white" opacity="0.3" />
      </g>
    </svg>
  );
}

export function LogoMonochrome({ size = "md", className = "" }: { size?: LogoSize; className?: string }) {
  return <LogoHorizontal size={size} variant="monochrome" className={className} />;
}
