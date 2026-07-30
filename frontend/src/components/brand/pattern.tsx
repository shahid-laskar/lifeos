import { cn } from "@/lib/utils";

/**
 * Subtle 8-point Islamic star pattern, drawn as an inline SVG tile.
 * Sits behind card content as texture — never as a foreground element.
 */
export function GeometricPattern({
  className,
  opacity = 0.06,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      style={{ opacity }}
    >
      <defs>
        <pattern
          id="mlos-star-8"
          width="72"
          height="72"
          patternUnits="userSpaceOnUse"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinejoin="round"
          >
            <polygon points="36,6 44,20 60,16 56,32 70,40 56,48 60,64 44,60 36,74 28,60 12,64 16,48 2,40 16,32 12,16 28,20" />
            <polygon points="36,18 42,28 54,28 48,38 54,50 42,50 36,60 30,50 18,50 24,38 18,28 30,28" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mlos-star-8)" />
    </svg>
  );
}

/** Rotating 8-point star used for all loading states. */
export function StarSpinner({
  className,
  size = 28,
  label = "Loading",
}: {
  className?: string;
  size?: number;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        className="star-spin text-primary"
      >
        <polygon
          points="20,2 25,12 36,10 33,21 40,29 29,32 27,38 20,33 13,38 11,32 0,29 7,21 4,10 15,12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          opacity="0.85"
        />
      </svg>
    </span>
  );
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <StarSpinner />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
