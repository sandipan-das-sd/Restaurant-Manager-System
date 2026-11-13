import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../config/theme";

export type TabKey = "home" | "menu" | "visit" | "dashboard";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "home", label: "Home" },
  { key: "menu", label: "Menu" },
  { key: "visit", label: "Visit" },
  { key: "dashboard", label: "Desk" },
];

export function TabBar({ current, onChange }: { current: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = tab.key === current;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
            <Text style={[styles.label, active ? styles.active : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: theme.line,
    backgroundColor: theme.card,
    paddingBottom: 10,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  label: { color: theme.muted, fontWeight: "600" },
  active: { color: theme.ink },
});
