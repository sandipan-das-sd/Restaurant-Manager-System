import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { APP_NAME, DEMO_ACCOUNTS, DEMO_PASSWORD, roleByKey, type AuthUser } from "@shared";
import { ApiError, signInRequest } from "../../config/api";
import { theme } from "../../config/theme";

export function LoginScreen({
  onSignedIn,
  onCreateAccount,
  onBack,
}: {
  onSignedIn: (user: AuthUser) => void;
  onCreateAccount: () => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(nextEmail: string, nextPassword: string) {
    setError(null);
    setPending(true);
    try {
      const session = await signInRequest(nextEmail, nextPassword);
      onSignedIn(session.user);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Sign-in failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.login} keyboardShouldPersistTaps="handled">
      <Pressable onPress={onBack} style={styles.backWrap}>
        <Text style={styles.back}>Back to home</Text>
      </Pressable>
      <View style={styles.brand}>
        <Text style={styles.eyebrow}>Staff desk</Text>
        <Text style={styles.wordmark}>{APP_NAME}</Text>
        <Text style={styles.lede}>Sign in. The desk opens with your role.</Text>
      </View>
      <Text style={styles.label}>Email</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <Text style={styles.label}>Password</Text>
      <TextInput secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.primary} disabled={pending} onPress={() => void submit(email, password)}>
        <Text style={styles.primaryText}>{pending ? "Opening…" : "Enter the desk"}</Text>
      </Pressable>
      <Pressable onPress={onCreateAccount}>
        <Text style={styles.create}>Create an account</Text>
      </Pressable>
      <Text style={styles.hint}>Or open a demo role. Password for each is {DEMO_PASSWORD}.</Text>
      <View style={styles.chips}>
        {DEMO_ACCOUNTS.map((account) => {
          const role = roleByKey(account.role);
          return (
            <Pressable
              key={account.email}
              disabled={pending}
              onPress={() => {
                setEmail(account.email);
                setPassword(DEMO_PASSWORD);
                void submit(account.email, DEMO_PASSWORD);
              }}
              style={[styles.chip, { borderColor: role.accent }]}
            >
              <View style={[styles.dot, { backgroundColor: role.accent }]} />
              <Text style={styles.chipText}>{role.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  login: { paddingBottom: 40, backgroundColor: theme.paper },
  backWrap: { backgroundColor: theme.ink, paddingTop: 56, paddingHorizontal: 24 },
  back: { color: "#d9cfc3" },
  brand: { backgroundColor: theme.ink, paddingTop: 16, paddingHorizontal: 24, paddingBottom: 28, gap: 8 },
  create: { color: theme.ink, fontWeight: "600", marginTop: 16, marginHorizontal: 24 },
  eyebrow: { color: "#d9cfc3", fontSize: 13 },
  wordmark: { color: theme.cream, fontSize: 36, fontWeight: "600", lineHeight: 40 },
  lede: { color: "#d9cfc3", fontSize: 18, maxWidth: 240 },
  label: { marginTop: 18, marginHorizontal: 24, fontWeight: "600", color: theme.ink },
  input: {
    marginTop: 6,
    marginHorizontal: 24,
    backgroundColor: theme.card,
    borderColor: theme.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.ink,
  },
  primary: {
    marginTop: 18,
    marginHorizontal: 24,
    backgroundColor: theme.ink,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: theme.cream, fontWeight: "600" },
  error: { color: theme.danger, marginTop: 12, marginHorizontal: 24 },
  hint: { color: theme.muted, marginTop: 18, marginHorizontal: 24 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, marginHorizontal: 24 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    backgroundColor: theme.card,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipText: { color: theme.ink, fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: 99 },
});
