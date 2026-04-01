import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",

        secondary:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-100 border border-blue-300 dark:border-blue-700 shadow-sm hover:bg-blue-200 dark:hover:bg-blue-900",

        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",

        outline:
          "bg-transparent text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800",

        glass:
          "bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-md hover:bg-white/70 dark:hover:bg-gray-800/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);


export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
