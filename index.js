import http from 'http';

void async function () {
  // Switch between `makeEchoOptions` (0, OK) and `makeNodeOptions` (1, WIP)
  const options = await [makeEchoOptions, makeNodeOptions][1]();

  // Throw if we receive any other response but an upgrade (handled below)
  const response = http.request(options, async response => {
    const chunks = [];
    for await (const chunk of response) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    throw new Error(`${response.statusCode} ${response.statusMessage}: ${buffer.toString('utf-8')}`);
  });

  response.on('upgrade', async (response, stream, head) => {
    const chunks = [];
    for await (const chunk of response) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    if (buffer.length > 0 || response.statusCode !== 101) {
      throw new Error(`${response.statusCode} ${response.statusMessage}: ${buffer.toString('utf-8')}`);
    }

    stream.on('data', data => console.log('IN:', data));

    stream.on('close', () => console.log('close'));
    stream.on('connect', () => console.log('connect'));
    stream.on('data', () => console.log('data'));
    stream.on('drain', () => console.log('drain'));
    stream.on('end', () => console.log('end'));
    stream.on('error', () => console.log('error'));
    stream.on('lookup', () => console.log('lookup'));
    stream.on('timeout', () => console.log('timeout'));

    console.log('OUT: TEST');
    stream.emit('data', 'TEST');
  });

  response.on('abort', () => console.log('abort'));
  response.on('connect', () => console.log('connect'));
  response.on('continue', () => console.log('continue'));
  response.on('information', () => console.log('information'));
  response.on('response', () => console.log('response'));
  response.on('socket', () => console.log('socket'));
  response.on('timeout', () => console.log('timeout'));
  response.on('upgrade', () => console.log('upgrade'));
  response.on('close', () => console.log('close'));
  response.on('drain', () => console.log('drain'));
  response.on('error', () => console.log('error'));
  response.on('finish', () => console.log('finish'));
  response.on('pipe', () => console.log('pipe'));
  response.on('unpipe', () => console.log('unpipe'));

  response.end();
}()

function makeEchoOptions() {
  return {
    hostname: 'echo.websocket.org',
    headers: {
      Connection: 'Upgrade',
      Upgrade: 'websocket',
      Origin: 'http://echo.websocket.org',
    },
  };
}

async function makeNodeOptions() {
  // Choose a random port (we're just using our own process ID) to avoid conflict
  process.debugPort = process.pid;

  // Start debugging self to later attach to self
  process._debugProcess(process.pid);

  // Download the debugger connection information
  const chunks = [];
  for await (const chunk of await new Promise(resolve => http.get(`http://localhost:${process.pid}/json`, resolve))) {
    chunks.push(chunk);
  }

  // Parse the debugger configuration information JSON and verify its structure
  const data = await JSON.parse(Buffer.concat(chunks));
  const datum = data?.find(datum => datum.webSocketDebuggerUrl.startsWith('ws://localhost:' + process.pid));
  if (datum?.type !== 'node') {
    throw new Error(`Unexpected response of http://localhost:${process.pid}/json: ${JSON.stringify(datum || data)}`);
  }

  return {
    hostname: 'localhost',
    port: process.pid,
    path: datum.id,
    headers: {
      Connection: 'Upgrade',
      Upgrade: 'websocket',
      Host: 'localhost',
      Origin: 'http://localhost:' + process.debugPort,
    },
  };
}
