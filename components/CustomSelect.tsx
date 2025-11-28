'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, User } from 'lucide-react'

interface Option {
    value: string
    label: string
}

interface CustomSelectProps {
    options: Option[]
    value: string | null
    onChange: (value: string | null) => void
    placeholder?: string
    className?: string
}

export default function CustomSelect({ options, value, onChange, placeholder = "Select...", className = "" }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all duration-200
          ${isOpen
                        ? 'border-primary ring-2 ring-primary/20 bg-background'
                        : 'border-border bg-background hover:bg-background/80 hover:border-primary/50'
                    }
        `}
            >
                <span className={`text-sm truncate ${selectedOption ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 overflow-hidden bg-popover border border-border rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                        <div
                            onClick={() => {
                                onChange(null)
                                setIsOpen(false)
                            }}
                            className={`
                flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors
                ${!value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-secondary'}
              `}
                        >
                            <span>{placeholder}</span>
                            {!value && <Check className="w-3.5 h-3.5" />}
                        </div>
                        {options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value)
                                    setIsOpen(false)
                                }}
                                className={`
                  flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors
                  ${value === option.value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-secondary'}
                `}
                            >
                                <span className="truncate">{option.label}</span>
                                {value === option.value && <Check className="w-3.5 h-3.5" />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
