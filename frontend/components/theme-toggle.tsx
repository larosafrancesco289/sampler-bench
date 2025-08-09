"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="relative overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-lg dark:hover:shadow-xl group border-border"
    >
      {mounted && resolvedTheme === "dark" ? (
        <Moon className="h-[1.2rem] w-[1.2rem] text-accent transition-colors duration-300" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] text-fg-muted group-hover:text-fg transition-colors duration-300" />
      )}
      <span className="sr-only">Toggle theme</span>
      
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
    </Button>
  )
} 