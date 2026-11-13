import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "dhabar.session";

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
};

function webGet(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(KEY);
}

function webSet(value: string | null): void {
  if (typeof localStorage === "undefined") return;
  if (value) localStorage.setItem(KEY, value);
  else localStorage.removeItem(KEY);
}

export async function readSession(): Promise<StoredSession | null> {
  try {
    const raw = Platform.OS === "web" ? webGet() : await SecureStore.getItemAsync(KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export async function writeSession(session: StoredSession | null): Promise<void> {
  const raw = session ? JSON.stringify(session) : null;
  try {
    if (Platform.OS === "web") {
      webSet(raw);
      return;
    }
    if (raw) await SecureStore.setItemAsync(KEY, raw);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // A missing key on sign-out should not block the screen.
  }
}
