"use client"

import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("light")}
        className={`h-7 w-7 p-0 ${theme === "light" ? "bg-background shadow-sm" : "hover:bg-transparent"}`}
        aria-label="Tema claro"
      >
        <Sun className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("dark")}
        className={`h-7 w-7 p-0 ${theme === "dark" ? "bg-background shadow-sm" : "hover:bg-transparent"}`}
        aria-label="Tema escuro"
      >
        <Moon className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme("system")}
        className={`h-7 w-7 p-0 ${theme === "system" ? "bg-background shadow-sm" : "hover:bg-transparent"}`}
        aria-label="Tema do sistema"
      >
        <Monitor className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
