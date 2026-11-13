import { Pressable, StyleSheet, Text, View } from "react-native";
import { APP_NAME } from "@shared";
import { theme } from "../../config/theme";

export function HomeScreen({
  signedIn,
  onSignIn,
  onSignUp,
  onDesk,
}: {
  signedIn: boolean;
  onSignIn: () => void;
  onSignUp: () => void;
  onDesk: () => void;
}) {
  return (
    <View style={styles.page}>
      <Text style={styles.eyebrow}>One outlet</Text>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.lede}>The floor, the menu, and the staff desk for this restaurant.</Text>
      {signedIn ? (
        <Pressable style={styles.primary} onPress={onDesk}>
          <Text style={styles.primaryText}>Open the desk</Text>
        </Pressable>
      ) : (
        <View style={styles.actions}>
          <Pressable style={styles.primary} onPress={onSignIn}>
            <Text style={styles.primaryText}>Sign in</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onSignUp}>
            <Text style={styles.secondaryText}>Create an account</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.note}>Menu and Visit are prepared screens. The desk opens after sign-in.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.paper, padding: 24, paddingTop: 64 },
  eyebrow: { color: theme.muted, fontSize: 13 },
  title: { marginTop: 8, color: theme.ink, fontSize: 36, lineHeight: 40, fontWeight: "600" },
  lede: { marginTop: 12, color: theme.muted, fontSize: 18, maxWidth: 280 },
  actions: { marginTop: 22, gap: 10 },
  primary: {
    marginTop: 22,
    backgroundColor: theme.ink,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: theme.cream, fontWeight: "600" },
  secondary: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.card,
  },
  secondaryText: { color: theme.ink, fontWeight: "600" },
  note: { marginTop: 28, color: theme.muted },
});
