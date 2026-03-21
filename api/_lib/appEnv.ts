export function getAppEnv() {
  const value = (process.env.APP_ENV || "").trim().toLowerCase();
  if (!value) {
    return "unknown";
  }
  return value;
}
