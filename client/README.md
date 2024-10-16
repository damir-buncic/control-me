# Electron client

Electron app used for controlling the host machine mouse.

Control is done with the help of [libnut-core](https://github.com/nut-tree/libnut-core) library (must be compiled manualy)

## Running the client

Create `.env` with following entries:

```
VITE_WSS_URL=<url of ws server>
```

run following command in terminal:

```
npm run dev
```
