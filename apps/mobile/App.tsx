import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { AuthUser } from "@shared";
import { restoreSession } from "./src/config/api";
import { theme } from "./src/config/theme";
import { applyOtaUpdate } from "./src/config/updates";
import { LoginScreen } from "./src/features/auth/LoginScreen";
import { DashboardScreen } from "./src/features/dashboard/DashboardScreen";

export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    applyOtaUpdate()
      .catch(() => {
        // The copy already on the phone stays if the update server is unreachable.
      })
      .then(() => (cancelled ? null : restoreSession()))
      .then((session) => {
        if (!cancelled && session) setUser(session.user);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {!ready ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.ink} />
          <Text style={styles.muted}>Checking the desk…</Text>
        </View>
      ) : user ? (
        <DashboardScreen user={user} onSignOut={() => setUser(null)} />
      ) : (
        <LoginScreen onSignedIn={setUser} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  muted: { color: theme.muted },
});
