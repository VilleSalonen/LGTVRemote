import { LGTV, Keys } from './src/lgtv.js';

const ip = process.argv[2];
const command = process.argv[3];
const args = process.argv.slice(4);

if (!ip || !command) {
  console.log('Usage: node remote.js <IP> <command> [args...]');
  console.log('Commands: inputs, inputs-raw, switch <input>, info, volume, key <KEY>, keys, type <text>, delete [count], toast <msg>, play, pause, stop, off');
  process.exit(1);
}

// Validate IP address format (IPv4, IPv6, or hostname)
const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$|^\[([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\]$/;
const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip) && !hostnameRegex.test(ip)) {
  console.error(`Error: Invalid IP address or hostname: ${ip}`);
  process.exit(1);
}

const tv = new LGTV(ip);

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
        console.error('Usage: node remote.js <IP> switch <HDMI_1|HDMI_2|HDMI_3|HDMI_4>');
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
        console.error('Usage: node remote.js <IP> key <KEY> [KEY2] [PAUSE_500] [TEXT_hello] ...');
        console.log('Available keys:', Object.keys(Keys).join(', '));
        console.log('Special commands:');
        console.log('  KEY_N     - repeat key N times (e.g., DOWN_9, LEFT_3)');
        console.log('  PAUSE_X   - wait X milliseconds (e.g., PAUSE_500)');
        console.log('  TEXT_abc  - type text (e.g., TEXT_hello or TEXT_"hello world")');
        console.log('  DELETE_X  - delete X characters (e.g., DELETE_5)');
        console.log('  NOOP_...  - comment, ignored (e.g., NOOP_"open settings")');
        break;
      }
      for (const arg of args) {
        const pauseMatch = arg.match(/^PAUSE_(\d+)$/i);
        const textMatch = arg.match(/^TEXT_(.*)$/i);
        const deleteMatch = arg.match(/^DELETE_(\d+)$/i);
        const noopMatch = arg.match(/^NOOP_(.*)$/i);
        const repeatMatch = arg.match(/^([A-Z]+)_(\d+)$/i);

        // Helper to strip matching quotes from both ends
        const stripQuotes = (s) => {
          if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
            return s.slice(1, -1);
          }
          return s;
        };

        if (noopMatch) {
          // Comment - do nothing, just log
          const comment = stripQuotes(noopMatch[1]);
          console.log(`# ${comment}`);
        } else if (pauseMatch) {
          const ms = parseInt(pauseMatch[1], 10);
          const maxPause = 60000; // 1 minute max
          if (ms > maxPause) {
            console.error(`Error: PAUSE value ${ms}ms exceeds maximum of ${maxPause}ms`);
            continue;
          }
          console.log(`Pausing ${ms}ms...`);
          await new Promise(r => setTimeout(r, ms));
        } else if (textMatch) {
          const inputText = stripQuotes(textMatch[1]);
          if (inputText === '') {
            console.error('Error: TEXT_ requires text to type (e.g., TEXT_hello)');
            continue;
          }
          console.log(`Typing: ${inputText}`);
          await tv.insertText(inputText);
          await new Promise(r => setTimeout(r, 150));
        } else if (deleteMatch) {
          const delCount = parseInt(deleteMatch[1], 10);
          console.log(`Deleting ${delCount} character(s)`);
          await tv.deleteCharacters(delCount);
          await new Promise(r => setTimeout(r, 150));
        } else if (repeatMatch && Keys[repeatMatch[1].toUpperCase()]) {
          // Key with repeat count (e.g., DOWN_9)
          const keyName = repeatMatch[1].toUpperCase();
          const count = parseInt(repeatMatch[2], 10);
          const maxRepeat = 100;
          if (count > maxRepeat) {
            console.error(`Error: Repeat count ${count} exceeds maximum of ${maxRepeat}`);
            continue;
          }
          if (count < 1) {
            console.error('Error: Repeat count must be at least 1');
            continue;
          }
          console.log(`Sending key: ${keyName} x${count}`);
          for (let i = 0; i < count; i++) {
            await tv.sendKey(keyName);
            await new Promise(r => setTimeout(r, 150));
          }
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
        console.error('Usage: node remote.js <IP> type <text>');
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
        console.error('Usage: node remote.js <IP> toast <message>');
        break;
      }
      const msg = args.join(' ');
      console.log(`Showing toast: ${msg}`);
      await tv.showToast(msg);
      break;

    case 'play':
      console.log('Sending play command...');
      await tv.play();
      break;

    case 'pause':
      console.log('Sending pause command...');
      await tv.pause();
      break;

    case 'stop':
      console.log('Sending stop command...');
      await tv.stop();
      break;

    case 'off':
      console.log('Turning off TV...');
      await tv.turnOff();
      break;

    default:
      console.log('Usage: node remote.js <IP> <command> [args...]');
      console.log('Commands: inputs, inputs-raw, switch <input>, info, volume, key <KEY>, keys, type <text>, delete [count], toast <msg>, play, pause, stop, off');
  }

  tv.disconnect();
} catch (err) {
  console.error('Error:', err.message);
  tv.disconnect();
  process.exit(1);
}
