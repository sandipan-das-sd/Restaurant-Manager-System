import { useEffect, useState } from "react";
import type { DashboardFeature, DashboardResponse, FeatureDetail } from "@shared";
import { AppHeader } from "../../components/AppHeader";
import { FeatureCard } from "../../components/FeatureCard";
import { RoleBadge } from "../../components/RoleBadge";
import { ApiError, api } from "../../config/api";
import { useAuth } from "../auth/AuthProvider";

export function DashboardScreen() {
  const { user, signOut } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<DashboardFeature | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api<DashboardResponse>("/api/v1/dashboard")
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof ApiError ? caught.message : "The desk could not be opened.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function openFeature(feature: DashboardFeature) {
    setSelected(feature);
    setDetail(null);
    try {
      const result = await api<FeatureDetail>(`/api/v1/features/${feature.key}`);
      setDetail(result.message);
    } catch (caught) {
      setDetail(caught instanceof ApiError ? caught.message : "The desk could not be opened.");
    }
  }

  return (
    <div className="desk">
      <AppHeader email={user?.email} onSignOut={() => void signOut()} />
      <main className="stage">
        {!dashboard && !error ? <p className="status-line">Opening the desk…</p> : null}
        {error ? (
          <div className="status-block">
            <p>{error}</p>
            <button type="button" className="primary" onClick={() => setReloadKey((value) => value + 1)}>
              Try again
            </button>
          </div>
        ) : null}
        {dashboard ? (
          <section className="welcome">
            <RoleBadge name={dashboard.roleName} accent={dashboard.accent} />
            <h1>{dashboard.welcome}</h1>
            <p className="person">{dashboard.personName}</p>
            <p className="description">{dashboard.roleDescription}</p>
            <h2>Desks for this role</h2>
            <div className="feature-grid">
              {dashboard.features.map((feature) => (
                <FeatureCard
                  key={feature.key}
                  feature={feature}
                  selected={selected?.key === feature.key}
                  onSelect={() => void openFeature(feature)}
                />
              ))}
            </div>
            {detail ? <p className="feature-note">{detail}</p> : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
