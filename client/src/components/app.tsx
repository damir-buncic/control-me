import { useCallback, useRef, useState } from "react";
import { waitForRtcConnection } from "../utils/webRtc";
import { Message, MessageType, useWebSockets } from "../hooks/useWebSocket";
import { Button, Container, Form, Navbar, NavbarBrand } from "react-bootstrap";

function App() {
  const id = useRef<string | null>(null);
  const [loggedIn, setLoggedIn] = useState<string | null>(null);

  const callback = useCallback(async (msg: Message, ws: WebSocket) => {
    if (msg.type === "id") {
      id.current = msg.id;
    } else if (msg.type === MessageType.connectionRequest) {
      const allow = window.confirm("Connection request from " + msg.replyTo + ". Do you want to accept?");
      if (allow) {
        try {
          const localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
          waitForRtcConnection(ws, localStream);
          ws.send(JSON.stringify({ type: MessageType.connectionResponse, accepted: true, to: msg.replyTo }));
        } catch (e) {
          console.log(e);
          ws.send(JSON.stringify({ type: MessageType.connectionResponse, accepted: false, to: msg.replyTo }));
        }
      } else {
        ws.send(JSON.stringify({ type: MessageType.connectionResponse, accepted: false, to: msg.replyTo }));
      }
    }
  }, []);

  const { send } = useWebSockets(callback);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (e.currentTarget.checkValidity()) {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name")?.toString();
      if (name) {
        send({ type: MessageType.clientReady, name });
        setLoggedIn(name);
      }
    }
  };

  return (
    <div>
      <Navbar className="bg-body-tertiary">
        <Container>
          <NavbarBrand>ControlMe Client</NavbarBrand>
        </Container>
      </Navbar>
      <Container className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
        {!loggedIn ? (
          <Form noValidate onSubmit={handleSubmit} className="d-grid gap-2 w-50">
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" required name="name" defaultValue="Damir" />
            </Form.Group>
            <Button variant="primary" type="submit">
              Log in
            </Button>
          </Form>
        ) : (
          <Container>
            <h1 className="text-center">Welcome {loggedIn}</h1>
          </Container>
        )}
      </Container>
    </div>
  );
}

export default App;
