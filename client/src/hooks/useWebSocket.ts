import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export enum MessageType {
  id = "id",
  connectionRequest = "connection-request",
  connectionResponse = "connection-response",
  clientReady = "client-ready",
}
export type Message =
  | { type: MessageType.id; id: string }
  | { type: MessageType.clientReady; name: string }
  | { type: MessageType.connectionRequest; replyTo: string }
  | { type: MessageType.connectionResponse; accepted: boolean };

export function useWebSockets(callback: (msg: Message, ws: WebSocket) => void) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const messages = useRef<object[]>([]);

  useEffect(() => {
    const socket = new WebSocket(import.meta.env.VITE_WSS_URL);
    setWs(socket);

    socket.addEventListener("open", () => {
      if (messages.current.length) {
        messages.current.forEach((msg) => socket.send(JSON.stringify(msg)));
        messages.current = [];
      }
    });

    socket.addEventListener("message", (event) => {
      callback(JSON.parse(event.data), socket);
    });

    return () => {
      socket.close();
    };
  }, [callback]);

  const send = useCallback(
    (msg: Message) => {
      if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
      else messages.current.push(msg);
    },
    [ws]
  );

  const obj = useMemo(() => ({ send, ws: ws }), [send, ws]);

  return obj;
}
