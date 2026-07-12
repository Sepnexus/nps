import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default:
          "bg-dark-panel text-dark-panel-foreground hover:brightness-110 rounded-[13px]",
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-dark rounded-[13px]",
        outline:
          "border border-border bg-white/60 text-foreground hover:bg-white rounded-[12px]",
        secondary:
          "bg-secondary text-secondary-foreground hover:brightness-95 rounded-[12px]",
        ghost:
          "hover:bg-[rgba(33,29,24,0.06)] text-foreground rounded-[10px]",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-95 rounded-[12px]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 text-[13.5px]",
        sm: "h-8 px-3 text-[12.5px]",
        lg: "h-11 px-6 text-[14px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
