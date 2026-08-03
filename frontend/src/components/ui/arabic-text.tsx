import * as React from "react";
import { cn } from "@/lib/utils";

const ArabicText = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("ar", className)} {...props} />
  )
);
ArabicText.displayName = "ArabicText";

export { ArabicText };
