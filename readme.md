# Node Chrome DevTools Protocol Web Socket

Pure Node web socket client talking to CDP (Chrome DevTools Protocol) web socket
obtained by attaching to a process by its PID.

## Installation

`git submodule add https://github.com/tomashubelbauer/node-cdp-ws`

## Usage

```js
import cdp from './node-cdp-ws/index.js';

const send = await cdp(process.pid, console.log);

// https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-evaluate
send({ id: 1, method: 'Runtime.evaluate', params: { expression: 'new Date().toLocaleTimeString()' } });
```

`cdp` also accepts an optional 3rd argument `port` which defaults to `9229`.

## Development

Run using `node test`.

### To-Do

#### Test out with CDP methods which return large results, like Electron screenshot

https://github.com/TomasHubelbauer/electron-inspect-require

https://github.com/TomasHubelbauer/electron-self-screenshot

Add an `example` directory and keep the Electron screenshot example there.
