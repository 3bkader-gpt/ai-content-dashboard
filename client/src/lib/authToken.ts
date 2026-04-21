import { isGarbageToken } from "./authUtils";

let accessToken = "";

export function setAccessToken(token: string) {
  accessToken = isGarbageToken(token) ? "" : token.trim();
}

export function getAccessToken(): string {
  return accessToken;
}
