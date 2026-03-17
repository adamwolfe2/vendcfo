export function getAppUrl() {
  // Allow explicit override via DASHBOARD_URL env var (useful for worker/non-Vercel deployments)
  if (process.env.DASHBOARD_URL) {
    return process.env.DASHBOARD_URL;
  }

  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    return "https://app.vendhub.com";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3001";
}

export function getEmailUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return "https://vendhub.com";
}

export function getWebsiteUrl() {
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    return "https://vendhub.com";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function getCdnUrl() {
  return "https://cdn.vendhub.com";
}

export function getApiUrl() {
  // Allow explicit override via API_URL env var
  if (process.env.API_URL) {
    return process.env.API_URL;
  }

  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    return "https://api.vendhub.com";
  }

  return "http://localhost:3002";
}
