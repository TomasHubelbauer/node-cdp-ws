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

Use `chrome://inspect` in Chrome/Edge to be able to use dev tools to debug.

### To-Do

#### Test out with CDP methods which return large results, like Electron screenshot

https://github.com/TomasHubelbauer/electron-inspect-require

https://github.com/TomasHubelbauer/electron-self-screenshot

The `electron` example in `example` is WIP. To test with it, install Electron
globally using `npm i -g electron` and go to the `example/electron` directory
and run `electron .` or skip installing Electron globally and use the command
`npx electron .` instead of `electron .`.

The Electron application will print its PID. Split the terminal and run
`node test ${pid}` providing the printed PID. This will attach a debugger to the
Electron binary and work against it rather than own process.

- [ ] Use `node-win-pid` and pass `electron` instead of the PID and look it up

See if the `electron-self-require` repository could be used to obtain some hint
on how to access the VS Code API in the dev tools and then from CDP.
