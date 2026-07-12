"use client";

import PusherClient from "pusher-js";

let pusherClient: PusherClient | null = null;

export function getPusherClient() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "us2";

  if (!key) {
    return null;
  }

  if (!pusherClient) {
    pusherClient = new PusherClient(key, {
      cluster,
      authEndpoint: "/api/pusher/auth"
    });
  }

  return pusherClient;
}

export function disconnectPusherClient() {
  pusherClient?.disconnect();
  pusherClient = null;
}
