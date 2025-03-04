"use client";
import { useEffect, useRef, useState } from "react";
import {
  createClient,
  createMicrophoneAndCameraTracks,
} from "agora-rtc-sdk-ng";
import axios from "axios";
import Toast from "@/components/Toast";

const APP_ID = "8c9812a61314467196175a0c11804572";
const SERVER_URL = "/api/generate-token";

export default function VideoCall({ channel }) {
  const [token, setToken] = useState(null);
  const [uid, setUid] = useState(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const client = useRef(null);
  const localTracks = useRef([]);
  const remoteUsers = useRef({});

  const fetchToken = async () => {
    try {
      const response = await axios.post(SERVER_URL, {
        channelName: channel,
        uid: 0,
      });
      setToken(response.data.token);
      setUid(response.data.uid);
    } catch (error) {
      console.error("Error fetching token", error);
    }
  };
  useEffect(() => {
    fetchToken();
  }, [channel]);

  useEffect(() => {
    if (token) {
      startCall();
    }
  }, [token]);

  const startCall = async () => {
    let count = 0;
    client.current = createClient({ mode: "rtc", codec: "vp8" });
    toggleCamera();
    toggleMic();
    client.current.on("token-privilege-did-expire", async () => {
      setShowToast(true);
      toggleCamera();
      toggleMic();
      // await fetchToken();
      // await client.current.leave();
      // await client.current.join(APP_ID, channel, token, uid);
    });

    await client.current.join(APP_ID, channel, token, uid);
    localTracks.current = await createMicrophoneAndCameraTracks();

    console.log(localTracks, "local tracks");

    const localPlayer = document.createElement("div");
    localPlayer.id = `user-${uid}`;
    localPlayer.style.width = "200px";
    localPlayer.style.height = "150px";
    localPlayer.style.background = "black";
    document.getElementById("local-video").appendChild(localPlayer);

    localTracks.current[1].play(`user-${uid}`);
    await client.current.publish(localTracks.current);

    client.current.on("user-published", async (user, mediaType) => {
      await client.current.subscribe(user, mediaType);
      console.log(user, "users");

      if (mediaType === "video" && count < 1) {
        count++;
        const remotePlayer = document.createElement("div");
        remotePlayer.id = `user-${user.uid}`;
        remotePlayer.style.width = "200px";
        remotePlayer.style.height = "150px";
        remotePlayer.style.background = "black";
        document.getElementById("remote-video").appendChild(remotePlayer);

        user.videoTrack.play(`user-${user.uid}`);
      }
    });
  };

  const leaveCall = async () => {
    for (let track of localTracks.current) {
      track.stop();
      track.close();
    }

    await client.current.leave();
    document.getElementById("local-video").innerHTML = "";
    document.getElementById("remote-video").innerHTML = "";
  };

  const toggleMic = async () => {
    if (localTracks.current[0]) {
      await localTracks.current[0].setMuted(micEnabled);
      setMicEnabled(!micEnabled);
    }
  };

  const toggleCamera = async () => {
    if (localTracks.current[1]) {
      if (cameraEnabled) {
        await localTracks.current[1].setEnabled(false);
      } else {
        await localTracks.current[1].setEnabled(true);
      }
      setCameraEnabled(!cameraEnabled);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white mt-5">
      <h1 className="text-3xl font-bold mb-6">Agora Video Call</h1>
      <div className="flex space-x-4 mb-6">
        <button
          onClick={startCall}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
        >
          Join Call
        </button>
        <button
          onClick={leaveCall}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
        >
          Leave Call
        </button>
        <button
          onClick={toggleMic}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          {micEnabled ? "Mute Mic 🎙️" : "Unmute Mic 🔇"}
        </button>
        <button
          onClick={toggleCamera}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg"
        >
          {cameraEnabled ? "Turn Off Camera 📷" : "Turn On Camera 🎥"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div
          id="local-video"
          className="w-64 h-48 border-2 border-green-500 rounded-lg bg-black flex items-center justify-center"
        >
          <p className="text-gray-400">Local Video</p>
        </div>
        <div
          id="remote-video"
          className="w-64 h-48 border-2 border-blue-500 rounded-lg bg-black flex items-center justify-center"
        >
          <p className="text-gray-400">Remote Video</p>
        </div>
      </div>
      {showToast && (
        <Toast
          message={"Session expired!"}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
