# Node WebSocket Client

Pure Node web socket client.

Run using `node .`.

## To-Do

### Adapt to be able to talk to the CDP

https://chromedevtools.github.io/devtools-protocol/#endpoints

See if I need these headers or I can do without them:

```js
{
  // https://en.wikipedia.org/wiki/WebSocket#Protocol_handshake
  'Sec-WebSocket-Key': '…',
  'Sec-WebSocket-Version': 13,
}
```
