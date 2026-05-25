"use client";

const KEY_API = "gma.closerouter.apiKey";
const KEY_BASE = "gma.closerouter.baseUrl";

export function loadApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY_API) ?? "";
}

export function saveApiKey(value: string): void {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(KEY_API, value);
  } else {
    window.localStorage.removeItem(KEY_API);
  }
}

export function loadBaseUrl(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY_BASE) ?? "";
}

export function saveBaseUrl(value: string): void {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(KEY_BASE, value);
  } else {
    window.localStorage.removeItem(KEY_BASE);
  }
}
