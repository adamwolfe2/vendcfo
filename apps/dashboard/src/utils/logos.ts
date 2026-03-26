const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_API_KEY || "";

export function getWebsiteLogo(website?: string | null) {
  if (!website) return "";

  return `https://img.logo.dev/${website}?token=${LOGO_DEV_TOKEN}&size=180&retina=true`;
}
