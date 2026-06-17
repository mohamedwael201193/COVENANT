export function getDashboardBase(): string {
  return (
    process.env.COVENANT_DASHBOARD_URL?.replace(/\/$/, "") ??
    "https://covenant-web-mu.vercel.app"
  );
}

export function buildSiweMessage(walletAddress: string, nonce: string): string {
  const uri = getDashboardBase();
  const domain = new URL(uri).host;
  const issuedAt = new Date().toISOString();
  return `${domain} wants you to sign in with your Ethereum account:
${walletAddress}

Sign in to COVENANT agent session. No transaction will be sent.

URI: ${uri}
Version: 1
Chain ID: 688689
Nonce: ${nonce}
Issued At: ${issuedAt}`;
}
