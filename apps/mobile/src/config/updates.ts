import * as Updates from "expo-updates";

export async function applyOtaUpdate(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return;
  const result = await Updates.checkForUpdateAsync();
  if (!result.isAvailable) return;
  await Updates.fetchUpdateAsync();
  await Updates.reloadAsync();
}
