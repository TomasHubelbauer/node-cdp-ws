import http from 'http';
import assert from 'assert';

export default async function (/** @type {number | string} */ pidOrUrl, /** @type {function} */ receive, /** @type {number} */ _port = 9229) {
  /** @type {URL} */
  let url;

  if (typeof pidOrUrl === 'number') {
    const pid = pidOrUrl;
    const port = _port;

    // Start debugging the process
    process._debugProcess(pid);

    // Download the debugger connection information
    const chunks = [];
    for await (const chunk of await new Promise(resolve => http.get(`http://localhost:${port}/json`, resolve))) {
      chunks.push(chunk);
    }

    // TODO: Consider throwing if there isn't only the sole right item in the array
    // Parse the debugger configuration information JSON and verify its structure
    const data = await JSON.parse(Buffer.concat(chunks));
    const datum = data?.find(datum => datum.webSocketDebuggerUrl.startsWith('ws://localhost:' + port));
    if (datum?.type !== 'node') {
      throw new Error(`Unexpected response of http://localhost:${port}/json: ${JSON.stringify(datum || data)}`);
    }

    url = new URL(datum.webSocketDebuggerUrl);
  }
  else if (typeof pidOrUrl === 'string') {
    url = new URL(pidOrUrl);
  }
  else {
    throw new Error('Either a PID or a URL must be passed in as an argument.');
  }

  const { hostname: host, port, pathname: path } = url;

  /** @type {http.RequestOptions} */
  const options = {
    host,
    port,
    path,
    headers: {
      Connection: 'Upgrade',
      Upgrade: 'websocket',

      // Send this web socket header as CDP expects it
      // Note that it can be static as we aren't using it for its intended purpose
      // `Buffer.alloc(16).toString('base64')`
      'Sec-WebSocket-Key': 'AAAAAAAAAAAAAAAAAAAAAA==',
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

  const send = await new Promise((resolve, reject) => {
    response.on('error', reject);

    response.on('upgrade', async (response, stream, head) => {
      assert.strictEqual(head.length, 0);

      // `crypto.createHash('sha1').update('AAAAAAAAAAAAAAAAAAAAAA==258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')`
      assert.strictEqual(response.headers['sec-websocket-accept'], 'ICX+Yqv66kxgM0FcWaLWlFLwTAI=');

      const chunks = [];
      for await (const chunk of response) {
        chunks.push(chunk);
      }

      // Throw if we aren't switching protocols or we still have a response
      const buffer = Buffer.concat(chunks);
      if (response.statusCode !== 101 || buffer.length > 0) {
        reject(`${response.statusCode} ${response.statusMessage}: ${buffer.toString('utf-8')}`);
        return;
      }

      stream.on('data', data => {
        assert.strictEqual((data[0] & 0x80), 0x80); // is FIN
        assert.strictEqual((data[0] & 0x0f), 1); // op code 1 (text)
        receive(JSON.parse(data.slice(2)));
      });

      // stream.on('close', () => console.log('close'));
      // stream.on('connect', () => console.log('connect'));
      // stream.on('data', () => console.log('data'));
      // stream.on('drain', () => console.log('drain'));
      // stream.on('end', () => console.log('end'));
      // stream.on('error', () => console.log('error'));
      // stream.on('lookup', () => console.log('lookup'));
      // stream.on('timeout', () => console.log('timeout'));

      resolve(message => {
        const data = Buffer.from(JSON.stringify(message));
        const target = Buffer.alloc(6);
        target[0] = 1 /* op code 1 - text */ | 0x80;
        target[1] = data.length | 0x80;

        stream.write(target);
        stream.write(data);
      });
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
  });

  return send;
}
