import { Button, Card, CardBody, CardHeader, Container, Table } from "react-bootstrap";
import { MouseEvent, TouchEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { Message, MessageType, useWebSockets } from "../hooks/useWebSocket";
import { connectToClient } from "../utils/webRtc";

function Clients() {
  const [clients, setClients] = useState<{ id: string; name: string; loading?: boolean }[]>([]);
  const id = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentClient, setCurrentClient] = useState<string | null>(null);

  const rtcConnection = useRef<{ dataChannel: RTCDataChannel; connection: RTCPeerConnection } | null>(null);

  const callback = useCallback((msg: Message) => {
    console.log("GOT MESSAGE", msg);
    if (msg.type === "id") {
      id.current = msg.id;
    }
    if (msg.type === "client-online") {
      setClients((clients) => [...clients, { id: msg.id, name: msg.name }]);
    }
  }, []);
  const { send, ws } = useWebSockets(callback);

  useEffect(() => {
    send({ type: MessageType.adminReady });
  }, [send]);

  const mouseMove = (e: MouseEvent) => {
    const video = e.currentTarget as HTMLVideoElement;
    if (video.srcObject) {
      const x = (e.pageX - video.offsetLeft) / video.clientWidth;
      const y = (e.pageY - video.offsetTop) / video.clientHeight;
      if (rtcConnection.current) {
        rtcConnection.current.dataChannel.send(JSON.stringify({ x, y }));
      }
      console.log(x, y);
    }
  };

  const touchMove: TouchEventHandler = (e) => {
    const video = e.currentTarget as HTMLVideoElement;
    if (video.srcObject) {
      const x = (e.changedTouches[0].pageX - video.offsetLeft) / video.clientWidth;
      const y = (e.changedTouches[0].pageY - video.offsetTop) / video.clientHeight;
      if (rtcConnection.current) {
        rtcConnection.current.dataChannel.send(JSON.stringify({ x, y }));
      }
      console.log(x, y);
    }
  };

  const connect = async (e: MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.dataset.id;
    if (id) {
      setClients(clients.map((c) => (c.id === id ? { ...c, loading: true } : c)));
      rtcConnection.current = await connectToClient(id, ws!, (s) => {
        setCurrentClient(id);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      });
    }
  };

  function disconnect() {
    if (rtcConnection.current) {
      rtcConnection.current.dataChannel.close();
      rtcConnection.current.connection.close();
      setCurrentClient(null);
      setClients(clients.map((c) => ({ ...c, loading: false })));
    }
  }

  return (
    <Container className="mt-3">
      <Card className={currentClient ? "d-block" : "d-none"}>
        <CardHeader>Client {currentClient}</CardHeader>

        <CardBody>
          <Button onClick={disconnect}>Disconnect</Button>
          <video
            onMouseMove={mouseMove}
            onTouchMove={touchMove}
            ref={videoRef}
            controls={false}
            autoPlay
            muted
            style={{ width: "100%", cursor: "none" }}
          />
        </CardBody>
      </Card>

      <Card className={currentClient ? "d-none" : "d-block"}>
        <CardHeader>Available Clients</CardHeader>
        <CardBody>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th></th>
              </tr>
            </thead>
            {clients.length > 0 && (
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td className="w-25">
                      <Button size="sm" variant="outline-primary" data-id={c.id} onClick={connect} disabled={c.loading}>
                        {c.loading ? "Connecting" : "Connect"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
            {clients.length === 0 && (
              <tbody>
                <tr>
                  <td className="text-center" colSpan={2}>
                    No active clients
                  </td>
                </tr>
              </tbody>
            )}
          </Table>
        </CardBody>
      </Card>
    </Container>
  );
}

export default Clients;
