import cdp from './index.js';

void async function () {
  const send = await cdp(process.argv[2] ? Number(process.argv[2]) : process.pid, console.log);

  let id = 0;
  setInterval(() => {
    id++;

    // https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-evaluate
    send({ id, method: 'Runtime.evaluate', params: { expression: 'new Date().toLocaleTimeString()' } });
  }, 1000);
}()
