import * as React from "react";
import { cn } from "@/lib/utils";

const Quote = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("quote mt-3", className)} {...props} />
  )
);
Quote.displayName = "Quote";

const Attrib = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("attrib mt-2.5", className)} {...props} />
  )
);
Attrib.displayName = "Attrib";

export { Quote, Attrib };
