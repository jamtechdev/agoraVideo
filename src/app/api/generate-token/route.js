import { RtcTokenBuilder, RtcRole } from "agora-access-token";

const APP_ID = "8c9812a61314467196175a0c11804572";
const APP_CERTIFICATE = "5f01d227e45244f1995240d62b3a4761";

export async function POST(req) {
  try {
    const { channelName, uid } = await req.json(); // Parse request body

    if (!channelName) {
      return new Response(JSON.stringify({ error: "Channel name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const role = RtcRole.PUBLISHER;
    const expireTimeInSeconds = 300; // 5 minutes
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTs = currentTimestamp + expireTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid || 0, // Default UID 0
      role,
      privilegeExpireTs
    );

    return new Response(
      JSON.stringify({ token, uid: uid || 0 }), // Ensure response is properly stringified
      {
        status: 200,
        headers: { "Content-Type": "application/json" }, // Ensure JSON response
      }
    );
  } catch (error) {
    console.error("Error generating Agora token:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate token" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
