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

I looked through `electron-self-require` repository and it shows this snippet:

```js
const electron = process.mainModule.require('electron')
const fs = process.mainModule.require('fs')
const webContents = electron.webContents.getAllWebContents()[0] // [1] is the shared process
webContents.capturePage(image => fs.writeFileSync('screenshot.png', image.toPNG()))
// Look in `process.cwd()`
```

I used `node-win-pid` and in it `node test code.exe` to find the PID of the main
VS Code window. I then used `process._debugProcess` to put it in debug mode and
used `chrome://inspect` to open dev tools for it.

The dev tools instance for this main process PID shows one JS context:
*Electron Main Context*.

I ran `process.mainModule` in it and checked the paths and the child modules.
I didn't see anything relating to the API or the extensions.

Next up I opened `C:\Users\…\AppData\Local\Programs\Microsoft VS Code\` in Code
and searched for various API method names. I know that the main process module
path is in `resources\app\out` so I limited my search to there for now.

I was able to identity these files as potential interests:

- vs\workbench\services\extensions\node\extensionHostProcess.js
- vs\workbench\services\extensions\worker\extensionHostWorker.js

I am not sure how to get to these modules from the main process I have debug
access to. The snipped there looks useless as I'm pretty sure the access to the
API is not from the render process but from the main process in some way.

I tried running `process.mainModule.require('vscode')` to no luck in the main
process. I also tried `process.mainModule.children[${index}].require('vscode')`
for all the child modules of the main module, again, to no luck.

```js
process.mainModule.require('./vs/workbench/services/extensions/node/extensionHostProcess.js')
```

This failed in a new way: *`define` is not defined*, not *Cannot find module*.

The next step should be to attach to all `code.exe` PIDs, not just the main one,
and seeing if one of those processes has a path `extensionHostProcess.js` or has
such path in its `children` modules. Use either of:

- `tasklist /FI "ImageName eq Code.exe"`
- `wmic process get processid,executablepath|findstr Code.exe`

Let's attach one by one, killing VS Code between each session otherwise the old
session will not let the new session take over. For each of the PIDs, do:

- Run `node -e "process._debugProcess(…)"`
- Refresh `chrome://inspect` until it shows
- Evaluate `process.mainModule.filename` in the dev tools and note it
- Evaluate `require('inspector').close()` to stop the debugger attachment

The paths found:

- [ ] Fill in the paths found and see if any is `extensionHost` or similar
