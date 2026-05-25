"use client";

const KEY_API = "gma.closerouter.apiKey";
const KEY_BASE = "gma.closerouter.baseUrl";
const KEY_GH = "gma.github.token";
const KEY_GH_CLIENT = "gma.github.clientId";
const KEY_GH_SECRET = "gma.github.clientSecret";
const KEY_GH_USER = "gma.github.user";
const KEY_MODEL = "gma.closerouter.model";

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
export function loadGithubClientId(): string {
  return readLS(KEY_GH_CLIENT);
}
export function saveGithubClientId(value: string): void {
  writeLS(KEY_GH_CLIENT, value);
}
export function loadGithubClientSecret(): string {
  return readLS(KEY_GH_SECRET);
}
export function saveGithubClientSecret(value: string): void {
  writeLS(KEY_GH_SECRET, value);
}
export function loadGithubUser(): string {
  return readLS(KEY_GH_USER);
}
export function saveGithubUser(value: string): void {
  writeLS(KEY_GH_USER, value);
}
export function loadSelectedModel(): string {
  return readLS(KEY_MODEL);
}
export function saveSelectedModel(value: string): void {
  writeLS(KEY_MODEL, value);
}
