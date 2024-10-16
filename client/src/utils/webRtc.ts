const configuration = {
  //iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export async function waitForRtcConnection(ws: WebSocket, stream: MediaStream) {
  console.log("LISTENING FOR A CALL");

  const peerConnection = new RTCPeerConnection(configuration);
  peerConnection.addEventListener("track", async () => {
    console.log("GOT TRACK");
  });

  stream.getTracks().forEach((track) => {
    console.log("ADDING STREAM", track);
    peerConnection.addTrack(track, stream);
  });

  peerConnection.addEventListener("connectionstatechange", () => {
    if (peerConnection.connectionState === "connected") {
      peerConnection.ondatachannel = (event) => {
        const receiveChannel = event.channel;
        receiveChannel.onmessage = function (event) {
          const pos = JSON.parse(event.data);
          console.log("RECEIVED", pos.x, pos.y);
          window.ipcRenderer.send("move-mouse", { x: pos.x * 1920, y: pos.y * 1080 });
        };
      };
      console.log("CONNECTION oppened");
    }
  });

  ws.addEventListener("message", async (msg: MessageEvent<string>) => {
    const message = JSON.parse(msg.data);
    if (message.offer) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      ws.send(JSON.stringify({ type: "answer", answer: answer, id: message.id }));

      peerConnection.onnegotiationneeded = function (e) {
        console.log("onnegotiationneeded", e);
      };

      peerConnection.addEventListener("icecandidate", (event) => {
        if (event.candidate) {
          ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate, id: message.id }));
        }
      });
    } else if (message.candidate) {
      try {
        await peerConnection.addIceCandidate(message.candidate);
      } catch (e) {
        console.error("Error adding received ice candidate", e);
      }
    }
  });
}
