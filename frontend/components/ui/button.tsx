import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-medium transition-all duration-300",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary golden button
        default: [
          "bg-accent text-black rounded-xl",
          "shadow-sm hover:shadow-lg hover:shadow-accent/20",
          "hover:bg-accent-hover hover:-translate-y-0.5",
          "focus-visible:ring-accent",
        ].join(" "),

        // Outlined button
        outline: [
          "bg-transparent border border-border rounded-xl text-fg",
          "hover:border-accent/60 hover:bg-accent-muted",
          "focus-visible:ring-accent",
        ].join(" "),

        // Secondary muted button
        secondary: [
          "bg-surface-elevated text-fg rounded-xl border border-border",
          "hover:bg-surface-hover hover:border-border-accent",
          "focus-visible:ring-accent",
        ].join(" "),

        // Ghost transparent button
        ghost: [
          "bg-transparent text-fg-muted rounded-lg",
          "hover:text-fg hover:bg-surface/60",
        ].join(" "),

        // Purple accent button
        accent2: [
          "bg-accent-2 text-white rounded-xl",
          "shadow-sm hover:shadow-lg hover:shadow-accent-2/20",
          "hover:brightness-110 hover:-translate-y-0.5",
          "focus-visible:ring-accent-2",
        ].join(" "),

        // Destructive button
        destructive: [
          "bg-red-600 text-white rounded-xl",
          "shadow-sm hover:bg-red-700",
          "focus-visible:ring-red-600",
        ].join(" "),

        // Link style
        link: [
          "text-accent underline-offset-4 p-0 h-auto",
          "hover:underline hover:text-accent-hover",
        ].join(" "),

        // Glass button
        glass: [
          "glass rounded-xl text-fg",
          "hover:bg-surface/80 hover:border-accent/40",
          "focus-visible:ring-accent",
        ].join(" "),
      },
      size: {
        default: "h-11 px-5 py-2.5 text-sm",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-13 px-7 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-11 w-11 p-0",
        "icon-sm": "h-9 w-9 p-0",
        "icon-lg": "h-13 w-13 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
