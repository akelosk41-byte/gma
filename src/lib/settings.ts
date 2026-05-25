"use client";

const KEY_API = "gma.closerouter.apiKey";
const KEY_BASE = "gma.closerouter.baseUrl";
const KEY_GH = "gma.github.token";

function readLS(key: string): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(key) ?? "";
}

function writeLS(key: string, value: string): void {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(key, value);
  else window.localStorage.removeItem(key);
}

export function loadApiKey(): string {
  return readLS(KEY_API);
}
export function saveApiKey(value: string): void {
  writeLS(KEY_API, value);
}
export function loadBaseUrl(): string {
  return readLS(KEY_BASE);
}
export function saveBaseUrl(value: string): void {
  writeLS(KEY_BASE, value);
}
export function loadGithubToken(): string {
  return readLS(KEY_GH);
}
export function saveGithubToken(value: string): void {
  writeLS(KEY_GH, value);
}
