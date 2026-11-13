/** @param {{ config: import("expo/config").ExpoConfig }} ctx */
module.exports = ({ config }) => {
  const projectId = process.env.EAS_PROJECT_ID || config.extra?.eas?.projectId || "";

  return {
    ...config,
    runtimeVersion: { policy: "appVersion" },
    updates: projectId
      ? {
          url: `https://u.expo.dev/${projectId}`,
          fallbackToCacheTimeout: 0,
          checkAutomatically: "ON_LOAD",
        }
      : {
          enabled: false,
          fallbackToCacheTimeout: 0,
        },
    extra: {
      ...config.extra,
      eas: projectId ? { projectId } : config.extra?.eas,
    },
  };
};
