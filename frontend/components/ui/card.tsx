import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'accent' | 'subtle'
  hover?: boolean
  glow?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, glow = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-2xl overflow-hidden transition-all duration-300",
        // Variants
        {
          "bg-surface border border-border shadow-card": variant === 'default',
          "bg-surface-elevated border border-border shadow-elevated": variant === 'elevated',
          "glass": variant === 'glass',
          "bg-accent-muted/30 border border-border-accent": variant === 'accent',
          "bg-surface/50 border border-border-subtle": variant === 'subtle',
        },
        // Hover effects
        hover && "hover:shadow-elevated hover:-translate-y-1 hover:border-border-accent cursor-pointer",
        // Glow effect
        glow && "glow-subtle",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-5 sm:p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4'
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Tag = 'h3', ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn(
        "text-lg sm:text-xl font-display leading-tight tracking-tight text-fg",
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-fg-muted leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 sm:p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center gap-3 p-5 sm:p-6 pt-0",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Divider for card sections
const CardDivider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mx-5 sm:mx-6 h-px bg-border", className)}
    {...props}
  />
))
CardDivider.displayName = "CardDivider"

// Card with inner glow effect
interface CardWithGlowProps extends CardProps {
  glowColor?: 'gold' | 'purple'
}

const CardWithGlow = React.forwardRef<HTMLDivElement, CardWithGlowProps>(
  ({ className, glowColor = 'gold', children, ...props }, ref) => (
    <Card ref={ref} className={cn("relative", className)} {...props}>
      {/* Inner glow */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: glowColor === 'gold'
            ? 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 60%)'
            : 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(123,63,160,0.12) 0%, transparent 60%)'
        }}
      />
      <div className="relative z-10">{children}</div>
    </Card>
  )
)
CardWithGlow.displayName = "CardWithGlow"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardDivider,
  CardWithGlow
}
