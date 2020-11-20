import http from 'http';
import assert from 'assert';

void async function () {
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

  const options = {
    host: 'localhost',
    port: process.pid,
    path: '/' + datum.id,
    headers: {
      Connection: 'Upgrade',
      Upgrade: 'websocket',
      'Sec-WebSocket-Key': 'AAAAAAAAAAAAAAAAAAAAAA==', // Buffer.alloc(16).toString('base64')
    },
  };

  // Throw if we receive any other response but an upgrade (handled below)
  const response = http.get(options, async response => {
    const chunks = [];
    for await (const chunk of response) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    throw new Error(`${response.statusCode} ${response.statusMessage}: ${buffer.toString('utf-8')}`);
  });

  response.on('upgrade', async (response, stream, head) => {
    assert.strictEqual(head.length, 0);
    assert.strictEqual(response.headers['sec-websocket-accept'], 'ICX+Yqv66kxgM0FcWaLWlFLwTAI='); // createHash('sha1').update('AAAAAAAAAAAAAAAAAAAAAA==258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')

    const chunks = [];
    for await (const chunk of response) {
      chunks.push(chunk);
    }

    // Throw if we aren't switching protocols or we still have a response
    const buffer = Buffer.concat(chunks);
    if (response.statusCode !== 101 || buffer.length > 0) {
      throw new Error(`${response.statusCode} ${response.statusMessage}: ${buffer.toString('utf-8')}`);
    }

    stream.on('data', data => {
      assert.strictEqual((data[0] & 0x80), 0x80); // is FIN
      assert.strictEqual((data[0] & 0x0f), 1); // op code 1 (text)
      console.log(data.slice(2).toString());
    });

    // stream.on('close', () => console.log('close'));
    // stream.on('connect', () => console.log('connect'));
    // stream.on('data', () => console.log('data'));
    // stream.on('drain', () => console.log('drain'));
    // stream.on('end', () => console.log('end'));
    // stream.on('error', () => console.log('error'));
    // stream.on('lookup', () => console.log('lookup'));
    // stream.on('timeout', () => console.log('timeout'));

    let id = 0;
    setInterval(() => {
      id++;

      // https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-evaluate
      const data = Buffer.from(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: 'new Date().toLocaleTimeString()' } }));
      const target = Buffer.alloc(6);
      target[0] = 1 /* op code 1 - text */ | 0x80;
      target[1] = data.length | 0x80;

      stream.write(target);
      stream.write(data);
    }, 1000);
  });

  // response.on('abort', () => console.log('abort'));
  // response.on('connect', () => console.log('connect'));
  // response.on('continue', () => console.log('continue'));
  // response.on('information', () => console.log('information'));
  // response.on('response', () => console.log('response'));
  // response.on('socket', () => console.log('socket'));
  // response.on('timeout', () => console.log('timeout'));
  // response.on('upgrade', () => console.log('upgrade'));
  // response.on('close', () => console.log('close'));
  // response.on('drain', () => console.log('drain'));
  // response.on('error', () => console.log('error'));
  // response.on('finish', () => console.log('finish'));
  // response.on('pipe', () => console.log('pipe'));
  // response.on('unpipe', () => console.log('unpipe'));

  response.end();
}()
