"use client";

import { useCallback, useSyncExternalStore } from "react";

export type VeraTheme = "light" | "dark";

const STORAGE_KEY = "vera-theme";

function readStoredTheme(): VeraTheme {
  const stored = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return stored === "dark" || (!stored && prefersDark) ? "dark" : "light";
}

let currentTheme: VeraTheme =
  typeof window === "undefined" ? "light" : readStoredTheme();

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): VeraTheme {
  return currentTheme;
}

function getServerSnapshot(): VeraTheme {
  return "light";
}

export function useVeraTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next: VeraTheme = theme === "dark" ? "light" : "dark";
    currentTheme = next;
    localStorage.setItem(STORAGE_KEY, next);
    listeners.forEach((listener) => listener());
  }, [theme]);

  return { theme, toggle };
}
