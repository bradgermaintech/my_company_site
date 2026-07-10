import PusherServer from "pusher";

const pusherCluster = process.env.PUSHER_CLUSTER ?? process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "us2";

export const pusherConfig = {
  appId: process.env.PUSHER_APP_ID?.trim(),
  key: process.env.PUSHER_KEY?.trim() ?? process.env.NEXT_PUBLIC_PUSHER_KEY?.trim(),
  secret: process.env.PUSHER_SECRET?.trim(),
  cluster: pusherCluster.trim()
};

export const pusherServer =
  pusherConfig.appId && pusherConfig.key && pusherConfig.secret
    ? new PusherServer({
        appId: pusherConfig.appId,
        key: pusherConfig.key,
        secret: pusherConfig.secret,
        cluster: pusherConfig.cluster,
        useTLS: true
      })
    : null;

export function chatChannel(conversationId: string) {
  return `private-chat-${conversationId}`;
}

export function userChannel(userId: string) {
  return `private-user-${userId}`;
}

function maskValue(value?: string) {
  if (!value) {
    return "missing";
  }

  if (value.length <= 6) {
    return `${value.slice(0, 2)}***`;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export async function triggerPusher(channel: string | string[], event: string, data: unknown) {
  if (!pusherServer) {
    return false;
  }

  try {
    await pusherServer.trigger(channel, event, data);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Pusher error";
    const details =
      error && typeof error === "object"
        ? {
            status: "status" in error ? String(error.status) : undefined,
            body: "body" in error ? String(error.body) : undefined,
            url: "url" in error ? String(error.url) : undefined
          }
        : undefined;
    console.warn(
      `Pusher trigger skipped for ${event}. appId=${maskValue(pusherConfig.appId)} key=${maskValue(
        pusherConfig.key
      )} cluster=${pusherConfig.cluster || "missing"}. Check PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, and PUSHER_CLUSTER. ${message}${
        details?.body ? ` body=${details.body}` : ""
      }`
    );
    return false;
  }
}
