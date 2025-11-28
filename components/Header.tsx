"use client"

import * as React from "react"
import { Moon, Sun, GraduationCap } from "lucide-react"
import { useTheme } from "next-themes"

export function Header() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-bold tracking-tight font-display">
                        RA Allocation
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                            aria-label="Toggle theme"
                        >
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
}
