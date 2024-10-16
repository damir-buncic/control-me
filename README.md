# Simple TeamViewer clone demo

### Project consists of 3 components:

- client - electron application used for controlling the host machine
- server - express server used for sync between client and admin via WebSockets
- frontend - admin fronted used to control the client machine

### How it works?

1. Admin opens the frontend app and sees a table with active clients (empty at the beginning)
2. The user runs the client electron app, chooses a name, and logs in (sends a login request to the server)
3. Server notifies admin that there is a new client online
4. Admin requests connection to the client (click on Connect button)
5. The client prompts the user if it wants to allow connection
6. If the user accepts the connection, the frontend starts the process of initializing WebRTC connection with the client
7. If the connection is successful, the client starts sending a video stream of the screen to the admin
8. Admin can now control the client's mouse (mouse events are sent via webrtc data channel)

### Video demo

<video src="assets/demo.mp4" width="700" height="268" controls></video>

https://github.com/user-attachments/assets/120a11b8-fe69-4b6b-a2eb-809aecb2b379
