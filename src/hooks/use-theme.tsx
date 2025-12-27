import { createContext, useContext } from "react"

export type Theme = "dark" | "light"

export type ThemeProviderState = {
  theme: Theme
  toggleTheme: () => void
}

export const initialState: ThemeProviderState = {
  theme: "light",
  toggleTheme: () => null,
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}