import { LGTV, Keys } from './src/lgtv.js';

const tv = new LGTV('10.0.3.1');

const command = process.argv[2];
const arg = process.argv[3];

console.log('Connecting to TV...');

try {
  await tv.connect();
  console.log('Connected!\n');

  switch (command) {
    case 'inputs':
      const inputs = await tv.getInputList();
      console.log('Available inputs:');
      for (const device of inputs.devices) {
        const status = device.connected ? '●' : '○';
        console.log(`  ${status} ${device.id}: ${device.label}`);
      }
      break;

    case 'inputs-raw':
      const inputsRaw = await tv.getInputList();
      console.log(JSON.stringify(inputsRaw, null, 2));
      break;

    case 'switch':
      if (!arg) {
        console.error('Usage: node test.js switch <HDMI_1|HDMI_2|HDMI_3|HDMI_4>');
        break;
      }
      console.log(`Switching to ${arg}...`);
      const result = await tv.switchInput(arg);
      console.log('Result:', result);
      break;

    case 'info':
      const info = await tv.getSystemInfo();
      console.log('System info:', JSON.stringify(info, null, 2));
      break;

    case 'volume':
      const vol = await tv.getVolume();
      console.log('Volume:', vol);
      break;

    case 'key':
      if (!arg) {
        console.error('Usage: node test.js key <KEY>');
        console.log('Available keys:', Object.keys(Keys).join(', '));
        break;
      }
      console.log(`Sending key: ${arg}`);
      await tv.sendKey(arg.toUpperCase());
      await new Promise(r => setTimeout(r, 100)); // Brief delay for key to register
      break;

    case 'keys':
      console.log('Available keys:', Object.keys(Keys).join(', '));
      break;

    case 'pointer-debug':
      const socketPath = await tv.getPointerSocket();
      console.log('Pointer socket path:', socketPath);
      break;

    default:
      console.log('Commands: inputs, inputs-raw, switch <input>, info, volume, key <KEY>, keys');
  }

  tv.disconnect();
} catch (err) {
  console.error('Error:', err.message);
  tv.disconnect();
  process.exit(1);
}
