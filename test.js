import { LGTV, Keys } from './src/lgtv.js';

const tv = new LGTV('10.0.3.1');

const command = process.argv[2];
const args = process.argv.slice(3);

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
      if (!args[0]) {
        console.error('Usage: node test.js switch <HDMI_1|HDMI_2|HDMI_3|HDMI_4>');
        break;
      }
      console.log(`Switching to ${args[0]}...`);
      const result = await tv.switchInput(args[0]);
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
      if (args.length === 0) {
        console.error('Usage: node test.js key <KEY> [KEY2] [PAUSE_500] [TEXT_hello] ...');
        console.log('Available keys:', Object.keys(Keys).join(', '));
        console.log('Special commands:');
        console.log('  PAUSE_X   - wait X milliseconds (e.g., PAUSE_500)');
        console.log('  TEXT_abc  - type text (e.g., TEXT_hello or TEXT_"hello world")');
        console.log('  DELETE_X  - delete X characters (e.g., DELETE_5)');
        console.log('  NOOP_...  - comment, ignored (e.g., NOOP_"open settings")');
        break;
      }
      for (const arg of args) {
        const pauseMatch = arg.match(/^PAUSE_(\d+)$/i);
        const textMatch = arg.match(/^TEXT_(.+)$/i);
        const deleteMatch = arg.match(/^DELETE_(\d+)$/i);
        const noopMatch = arg.match(/^NOOP_(.*)$/i);

        if (noopMatch) {
          // Comment - do nothing, just log
          const comment = noopMatch[1].replace(/^["']|["']$/g, '');
          console.log(`# ${comment}`);
        } else if (pauseMatch) {
          const ms = parseInt(pauseMatch[1], 10);
          console.log(`Pausing ${ms}ms...`);
          await new Promise(r => setTimeout(r, ms));
        } else if (textMatch) {
          const inputText = textMatch[1].replace(/^["']|["']$/g, ''); // Strip quotes
          console.log(`Typing: ${inputText}`);
          await tv.insertText(inputText);
          await new Promise(r => setTimeout(r, 150));
        } else if (deleteMatch) {
          const delCount = parseInt(deleteMatch[1], 10);
          console.log(`Deleting ${delCount} character(s)`);
          await tv.deleteCharacters(delCount);
          await new Promise(r => setTimeout(r, 150));
        } else {
          console.log(`Sending key: ${arg}`);
          await tv.sendKey(arg.toUpperCase());
          await new Promise(r => setTimeout(r, 150));
        }
      }
      break;

    case 'keys':
      console.log('Available keys:', Object.keys(Keys).join(', '));
      break;

    case 'pointer-debug':
      const socketPath = await tv.getPointerSocket();
      console.log('Pointer socket path:', socketPath);
      break;

    case 'type':
      if (args.length === 0) {
        console.error('Usage: node test.js type <text>');
        break;
      }
      const text = args.join(' ');
      console.log(`Typing: ${text}`);
      await tv.insertText(text);
      break;

    case 'delete':
      const count = parseInt(args[0], 10) || 1;
      console.log(`Deleting ${count} character(s)`);
      await tv.deleteCharacters(count);
      break;

    case 'toast':
      if (args.length === 0) {
        console.error('Usage: node test.js toast <message>');
        break;
      }
      const msg = args.join(' ');
      console.log(`Showing toast: ${msg}`);
      await tv.showToast(msg);
      break;

    default:
      console.log('Commands: inputs, inputs-raw, switch <input>, info, volume, key <KEY>, keys, type <text>, delete [count], toast <msg>');
  }

  tv.disconnect();
} catch (err) {
  console.error('Error:', err.message);
  tv.disconnect();
  process.exit(1);
}
