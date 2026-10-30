import { ArrowDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessingConnectorProps {
  isActive: boolean;
  isComplete?: boolean;
}

export function ProcessingConnector({
  isActive,
  isComplete = false,
}: ProcessingConnectorProps) {
  return (
    <div className="relative h-16 flex items-center justify-center">
      {/* Static connecting line */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px transition-colors duration-300",
          isActive
            ? "bg-primary/30"
            : isComplete
              ? "bg-primary/30"
              : "bg-border",
        )}
      />

      {/* Center node */}
      <div
        className={cn(
          "relative z-10 h-9 w-9 rounded-full border bg-background flex items-center justify-center transition-colors duration-300",
          isActive
            ? "border-primary"
            : isComplete
              ? "border-primary"
              : "border-border",
        )}
      >
        {isActive && (
          <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        )}

        {isComplete && !isActive ? (
          <Check className="h-4 w-4 relative z-10 text-primary animate-in zoom-in-50 duration-300" />
        ) : (
          <ArrowDown
            className={cn(
              "h-4 w-4 relative z-10 transition-colors duration-300",
              isActive ? "text-primary" : "text-muted-foreground opacity-80",
            )}
          />
        )}
      </div>
    </div>
  );
}
