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
          <Pressable
            key={tab.key}
            style={[styles.tab, active ? styles.tabActive : null]}
            onPress={() => onChange(tab.key)}
          >
            <Text style={[styles.label, active ? styles.active : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 22,
    flexDirection: "row",
    backgroundColor: theme.ink,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 6,
    elevation: 10,
    shadowColor: "#1a1714",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  tab: { flex: 1, alignItems: "center", borderRadius: 999, paddingVertical: 12 },
  tabActive: { backgroundColor: theme.cream },
  label: { color: "#d9cfc3", fontWeight: "600" },
  active: { color: theme.ink },
});
