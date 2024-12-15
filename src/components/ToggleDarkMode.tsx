"use client"

import { Moon } from "lucide-react";
import { Toggle } from "./ui/toggle";

export function ToggleDarkMode () {
  return(
    <Toggle onClick={() => window.document.documentElement.classList.toggle("dark")}>
      <Moon className="size-6" />
    </Toggle>
  )
}