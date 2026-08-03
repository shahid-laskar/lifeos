import * as React from "react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

// Mock buttonVariants for shadcn components
export const buttonVariants = ({ className, variant, size }: any = {}) => {
  return cn(
    "inline-flex items-center justify-center rounded-[11px] px-4 py-[9px] text-[13px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variant === "default"
      ? "bg-[var(--primary)] text-white dark:text-[#08120f]"
      : variant === "ghost"
      ? "bg-transparent text-[var(--primary)]"
      : "bg-transparent border border-[var(--line)]",
    className
  );
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "secondary" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
