import type { DashboardFeature } from "@shared";

export function FeatureCard({
  feature,
  selected,
  onSelect,
}: {
  feature: DashboardFeature;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={feature.allowed ? "feature-card" : "feature-card locked"}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="state">{feature.allowed ? "Open" : "Closed"}</span>
      <strong>{feature.title}</strong>
      <p>{feature.summary}</p>
    </button>
  );
}
