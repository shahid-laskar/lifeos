import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ArabicText({
  children,
  className,
  size = "lg",
}: {
  children: ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
}) {
  return (
    <p
      lang="ar"
      dir="rtl"
      className={cn(
        "arabic",
        size === "md" && "text-xl",
        size === "lg" && "text-[28px]",
        size === "xl" && "text-[34px]",
        className,
      )}
    >
      {children}
    </p>
  );
}
