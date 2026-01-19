import Ably from "ably";

export async function getAblyClient(clientId: string) {
  const res = await fetch("/api/ably-token?role=" + clientId);
  const tokenRequest = await res.json();

  return new Ably.Realtime({
    authUrl: "/api/ably-token?role=" + clientId,
  });
}