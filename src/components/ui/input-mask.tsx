import { cn } from "@/lib/utils/cn";
import React from "react";
import { IMaskInput } from "react-imask";

type InputMaskProps = React.ComponentProps<typeof IMaskInput> & {
  className?: string;
  onAccept?: (value: string) => void;
};

const InputMask = React.forwardRef<HTMLInputElement, InputMaskProps>(
  ({ onAccept, className, ...props }, ref) => {
    return (
      <IMaskInput
        {...props}
        unmask={true}
        inputRef={ref}
        onAccept={(value) => onAccept?.(String(value))}
        className={cn(
          "bg-input/30 border-primary/40 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 rounded border px-3 py-1 text-base transition-colors file:h-7 file:text-sm file:font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "data-[invalid=true]:border-red-900 data-[invalid=true]:ring-red-900",
          className,
        )}
      />
    );
  },
);

InputMask.displayName = "InputMask";
export { InputMask };
