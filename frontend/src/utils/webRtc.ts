const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export async function connectToClient(
  id: string,
  ws: WebSocket,
  onTrackAdded: (stream: MediaStream) => void
): Promise<{ dataChannel: RTCDataChannel; connection: RTCPeerConnection }> {
  return new Promise((resolve) => {
    let peerConnection: RTCPeerConnection | null = null;

    ws.send(JSON.stringify({ type: "connection-request", to: id }));

    ws.addEventListener("message", async (msg: MessageEvent<string>) => {
      const message = JSON.parse(msg.data);
      if (message.type === "connection-response" && message.accepted) {
        peerConnection = new RTCPeerConnection(configuration);
        const dc = peerConnection.createDataChannel("my channel");

        peerConnection.ontrack = async (event) => {
          console.log("GOT TRACK");
          const [remoteStream] = event.streams;
          onTrackAdded(remoteStream);
        };

        peerConnection.addEventListener("connectionstatechange", () => {
          if (peerConnection?.connectionState === "connected") {
            console.log("CONNECTED");
            dc.onopen = () => {
              resolve({ dataChannel: dc, connection: peerConnection! });
              console.log("DC opened");
              //dc.send("WOHO");
            };
            dc.onmessage = function (event) {
              console.log("RECEIVED DC DATA on ADMIN", event.data);
            };
          }
        });
        peerConnection.addEventListener("icecandidate", (event) => {
          if (event.candidate) {
            ws.send(JSON.stringify({ type: "ice-candidate", candidate: event.candidate, id }));
          }
        });
        peerConnection.onnegotiationneeded = function (e) {
          console.log("onnegotiationneeded", e);
        };
        const offer = await peerConnection.createOffer({ offerToReceiveVideo: true });
        await peerConnection.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: "offer", id, offer: offer }));
      } else if (message.answer) {
        const remoteDesc = new RTCSessionDescription(message.answer);

        await peerConnection?.setRemoteDescription(remoteDesc);
      } else if (message.candidate) {
        try {
          if (peerConnection) {
            await peerConnection.addIceCandidate(message.candidate);
          }
        } catch (e) {
          console.error("Error adding received ice candidate", e);
        }
      }
    });
  });
}
