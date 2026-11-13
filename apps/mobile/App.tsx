import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import type { AuthUser } from "@shared";
import { TabBar, type TabKey } from "./src/components/TabBar";
import { restoreSession } from "./src/config/api";
import { theme } from "./src/config/theme";
import { applyOtaUpdate } from "./src/config/updates";
import { LoginScreen } from "./src/features/auth/LoginScreen";
import { SignupScreen } from "./src/features/auth/SignupScreen";
import { DashboardScreen } from "./src/features/dashboard/DashboardScreen";
import { HomeScreen } from "./src/features/home/HomeScreen";
import { PreparedScreen } from "./src/features/home/PreparedScreen";

type Screen = TabKey | "login" | "signup";

function DeskGate({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  return (
    <View style={styles.gate}>
      <Text style={styles.eyebrow}>Staff desk</Text>
      <Text style={styles.gateTitle}>Sign in to open the desk</Text>
      <Text style={styles.gateLede}>The dashboard shows the welcome line and the desks for your role.</Text>
      <Text style={styles.link} onPress={onSignIn}>
        Sign in
      </Text>
      <Text style={styles.link} onPress={onSignUp}>
        Create an account
      </Text>
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [screen, setScreen] = useState<Screen>("home");

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

  function openTab(tab: TabKey) {
    setScreen(tab);
  }

  const showTabs = screen === "home" || screen === "menu" || screen === "visit" || screen === "dashboard";

  return (
    <View style={styles.root}>
      <StatusBar style={screen === "login" ? "light" : "dark"} />
      {!ready ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.ink} />
          <Text style={styles.muted}>Checking the desk…</Text>
        </View>
      ) : (
        <View style={styles.body}>
          {screen === "home" ? (
            <HomeScreen
              signedIn={Boolean(user)}
              onSignIn={() => setScreen("login")}
              onSignUp={() => setScreen("signup")}
              onDesk={() => setScreen("dashboard")}
            />
          ) : null}
          {screen === "menu" ? (
            <PreparedScreen
              title="Menu"
              lede="The card is prepared. Orders are not taken from this screen yet."
              rows={[
                { title: "Veg thali", note: "Prepared" },
                { title: "Dal tadka", note: "Prepared" },
                { title: "Masala chai", note: "Prepared" },
              ]}
            />
          ) : null}
          {screen === "visit" ? (
            <PreparedScreen
              title="Visit"
              lede="Hours and the floor are prepared for this outlet."
              rows={[
                { title: "Hours", note: "11:00–23:00, Asia/Kolkata" },
                { title: "Tables", note: "Prepared" },
                { title: "Counter", note: "Prepared" },
              ]}
            />
          ) : null}
          {screen === "dashboard" ? (
            user ? (
              <DashboardScreen
                user={user}
                onSignOut={() => {
                  setUser(null);
                  setScreen("home");
                }}
              />
            ) : (
              <DeskGate onSignIn={() => setScreen("login")} onSignUp={() => setScreen("signup")} />
            )
          ) : null}
          {screen === "login" ? (
            <LoginScreen
              onBack={() => setScreen("home")}
              onCreateAccount={() => setScreen("signup")}
              onSignedIn={(next) => {
                setUser(next);
                setScreen("dashboard");
              }}
            />
          ) : null}
          {screen === "signup" ? (
            <SignupScreen onBack={() => setScreen("home")} onSignIn={() => setScreen("login")} />
          ) : null}
        </View>
      )}
      {ready && showTabs ? <TabBar current={screen} onChange={openTab} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.paper },
  body: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  muted: { color: theme.muted },
  gate: { flex: 1, backgroundColor: theme.paper, padding: 24, paddingTop: 64 },
  eyebrow: { color: theme.muted, fontSize: 13 },
  gateTitle: { marginTop: 8, color: theme.ink, fontSize: 32, lineHeight: 36, fontWeight: "600" },
  gateLede: { marginTop: 12, color: theme.muted, fontSize: 16 },
  link: { marginTop: 18, color: theme.ink, fontWeight: "700", fontSize: 16 },
});
