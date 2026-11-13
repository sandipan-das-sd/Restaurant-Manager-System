import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import type { AuthUser, DashboardFeature, DashboardResponse, FeatureDetail } from "@shared";
import { AppHeader } from "../../components/AppHeader";
import { FeatureCard } from "../../components/FeatureCard";
import { RoleBadge } from "../../components/RoleBadge";
import { ApiError, api, signOutRequest } from "../../config/api";
import { theme } from "../../config/theme";

export function DashboardScreen({ user, onSignOut }: { user: AuthUser; onSignOut: () => void }) {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api<DashboardResponse>("/api/v1/dashboard")
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof ApiError ? caught.message : "The desk could not be opened.");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function openFeature(feature: DashboardFeature) {
    setSelected(feature.key);
    setDetail(null);
    try {
      const result = await api<FeatureDetail>(`/api/v1/features/${feature.key}`);
      setDetail(result.message);
    } catch (caught) {
      setDetail(caught instanceof ApiError ? caught.message : "The desk could not be opened.");
    }
  }

  return (
    <View style={styles.desk}>
      <AppHeader
        onSignOut={() => {
          void signOutRequest().finally(onSignOut);
        }}
      />
      <ScrollView contentContainerStyle={styles.stage}>
        {!dashboard && !error ? <ActivityIndicator color={theme.ink} /> : null}
        {error ? (
          <Text style={styles.error} onPress={() => setReloadKey((value) => value + 1)}>
            {error}. Tap to try again.
          </Text>
        ) : null}
        {dashboard ? (
          <View>
            <RoleBadge name={dashboard.roleName} accent={dashboard.accent} />
            <Text style={styles.welcome}>{dashboard.welcome}</Text>
            <Text style={styles.person}>{dashboard.personName}</Text>
            <Text style={styles.description}>{dashboard.roleDescription}</Text>
            <Text style={styles.section}>Desks for this role</Text>
            {dashboard.features.map((feature) => (
              <FeatureCard
                key={feature.key}
                feature={feature}
                selected={selected === feature.key}
                onSelect={() => void openFeature(feature)}
              />
            ))}
            {detail ? <Text style={styles.note}>{detail}</Text> : null}
            <Text style={styles.hint}>{user.email}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  desk: { flex: 1, backgroundColor: theme.paper },
  stage: { padding: 24, paddingBottom: 120 },
  welcome: { marginTop: 16, fontSize: 32, lineHeight: 36, fontWeight: "600", color: theme.ink },
  person: { marginTop: 14, fontSize: 20, fontWeight: "600", color: theme.ink },
  description: { marginTop: 6, fontSize: 16, color: theme.muted },
  section: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.muted,
    fontWeight: "700",
  },
  note: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.card,
    color: theme.ink,
  },
  hint: { color: theme.muted, marginTop: 16 },
  error: { color: theme.danger },
});
