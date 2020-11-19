import http from 'http';

void async function () {
  const options = {
    hostname: 'echo.websocket.org',
    post: 80,
    path: '/',
    headers: {
      Connection: 'Upgrade',
      Upgrade: 'websocket',
      Host: 'echo.websocket.org:80',
      Origin: 'http://echo.websocket.org:80',
    },
  };

  const response = http.request(options, async response => {
    const chunks = [];
    for await (const chunk of response) {
      chunks.push(chunk);
    }

    throw new Error(Buffer.concat(chunks).toString('utf-8'));
  });

  response.on('upgrade', async (response, stream, head) => {
    const chunks = [];
    for await (const chunk of response) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    if (buffer.length > 0) {
      throw new Error(buffer.toString('utf-8'));
    }

    if (response.statusCode !== 101) {
      throw new Error(response.statusCode + ' ' + response.statusMessage);
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
