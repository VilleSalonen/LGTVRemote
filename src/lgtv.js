import WebSocket from 'ws';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_PATH = join(homedir(), '.lgtv-remote.json');

// Handshake payload for initial pairing (from lgtv2 library)
const HANDSHAKE_PAYLOAD = {
  forcePairing: false,
  pairingType: 'PROMPT',
  manifest: {
    manifestVersion: 1,
    appVersion: '1.1',
    signed: {
      created: '20140509',
      appId: 'com.lge.test',
      vendorId: 'com.lge',
      localizedAppNames: {
        '': 'LG Remote App',
        'ko-KR': '리모컨 앱',
        'zxx-XX': 'ЛГ Rэмotэ AПП'
      },
      localizedVendorNames: {
        '': 'LG Electronics'
      },
      permissions: [
        'TEST_SECURE',
        'CONTROL_INPUT_TEXT',
        'CONTROL_MOUSE_AND_KEYBOARD',
        'READ_INSTALLED_APPS',
        'READ_LGE_SDX',
        'READ_NOTIFICATIONS',
        'SEARCH',
        'WRITE_SETTINGS',
        'WRITE_NOTIFICATION_ALERT',
        'CONTROL_POWER',
        'READ_CURRENT_CHANNEL',
        'READ_RUNNING_APPS',
        'READ_UPDATE_INFO',
        'UPDATE_FROM_REMOTE_APP',
        'READ_LGE_TV_INPUT_EVENTS',
        'READ_TV_CURRENT_TIME'
      ],
      serial: '2f930e2d2cfe083771f68e4fe7bb07'
    },
    permissions: [
      'LAUNCH',
      'LAUNCH_WEBAPP',
      'APP_TO_APP',
      'CLOSE',
      'TEST_OPEN',
      'TEST_PROTECTED',
      'CONTROL_AUDIO',
      'CONTROL_DISPLAY',
      'CONTROL_INPUT_JOYSTICK',
      'CONTROL_INPUT_MEDIA_RECORDING',
      'CONTROL_INPUT_MEDIA_PLAYBACK',
      'CONTROL_INPUT_TV',
      'CONTROL_POWER',
      'READ_APP_STATUS',
      'READ_CURRENT_CHANNEL',
      'READ_INPUT_DEVICE_LIST',
      'READ_NETWORK_STATE',
      'READ_RUNNING_APPS',
      'READ_TV_CHANNEL_LIST',
      'WRITE_NOTIFICATION_TOAST',
      'READ_POWER_STATE',
      'READ_COUNTRY_INFO',
      'READ_SETTINGS',
      'CONTROL_TV_SCREEN',
      'CONTROL_TV_STANBY',
      'CONTROL_FAVORITE_GROUP',
      'CONTROL_USER_INFO',
      'CHECK_BLUETOOTH_DEVICE',
      'CONTROL_BLUETOOTH',
      'CONTROL_TIMER_INFO',
      'STB_INTERNAL_CONNECTION',
      'CONTROL_RECORDING',
      'READ_RECORDING_STATE',
      'WRITE_RECORDING_LIST',
      'READ_RECORDING_LIST',
      'READ_RECORDING_SCHEDULE',
      'WRITE_RECORDING_SCHEDULE',
      'READ_STORAGE_DEVICE_LIST',
      'READ_TV_PROGRAM_INFO',
      'CONTROL_BOX_CHANNEL',
      'READ_TV_ACR_AUTH_TOKEN',
      'READ_TV_CONTENT_STATE',
      'READ_TV_CURRENT_TIME',
      'ADD_LAUNCHER_CHANNEL',
      'SET_CHANNEL_SKIP',
      'RELEASE_CHANNEL_SKIP',
      'CONTROL_CHANNEL_BLOCK',
      'DELETE_SELECT_CHANNEL',
      'CONTROL_CHANNEL_GROUP',
      'SCAN_TV_CHANNELS',
      'CONTROL_TV_POWER',
      'CONTROL_WOL'
    ],
    signatures: [
      {
        signatureVersion: 1,
        signature: 'eyJhbGdvcml0aG0iOiJSU0EtU0hBMjU2Iiwia2V5SWQiOiJ0ZXN0LXNpZ25pbmctY2VydCIsInNpZ25hdHVyZVZlcnNpb24iOjF9.hrVRgjCwXVvE2OOSpDZ58hR+59aFNwYDyjQgKk3auukd7pcegmE2CzPCa0bJ0ZsRAcKkCTJrWo5iDzNhMBWRyaMOv5zWSrthlf7G128qvIlpMT0YNY+n/FaOHE73uLrS/g7swl3/qH/BGFG2Hu4RlL48eb3lLKqTt2xKHdCs6Cd4RMfJPYnzgvI4BNrFUKsjkcu+WD4OO2A27Pq1n50cMchmcaXadJhGrOqH5YmHdOCj5NSHzJYrsW0HPlpuAx/ECMeIZYDh6RMqaFM2DXzdKX9NmmyqzJ3o/0lkk/N97gfVRLW5hA29yeAwaCViZNCP8iC9aO0q9fQojoa7NQnAtw=='
      }
    ]
  }
};

// SSAP Protocol URIs
export const SSAP = {
  // System
  GET_SYSTEM_INFO: 'ssap://system/getSystemInfo',
  TURN_OFF: 'ssap://system/turnOff',

  // Audio
  GET_VOLUME: 'ssap://audio/getVolume',
  SET_VOLUME: 'ssap://audio/setVolume',
  VOLUME_UP: 'ssap://audio/volumeUp',
  VOLUME_DOWN: 'ssap://audio/volumeDown',
  GET_MUTE: 'ssap://audio/getStatus',
  SET_MUTE: 'ssap://audio/setMute',

  // TV Input
  GET_INPUT_LIST: 'ssap://tv/getExternalInputList',
  SWITCH_INPUT: 'ssap://tv/switchInput',

  // Apps
  GET_APPS: 'ssap://com.webos.applicationManager/listApps',
  LAUNCH_APP: 'ssap://system.launcher/launch',
  GET_FOREGROUND_APP: 'ssap://com.webos.applicationManager/getForegroundAppInfo',
  CLOSE_APP: 'ssap://system.launcher/close',

  // Media
  PLAY: 'ssap://media.controls/play',
  PAUSE: 'ssap://media.controls/pause',
  STOP: 'ssap://media.controls/stop',
  REWIND: 'ssap://media.controls/rewind',
  FAST_FORWARD: 'ssap://media.controls/fastForward',

  // Channels
  CHANNEL_UP: 'ssap://tv/channelUp',
  CHANNEL_DOWN: 'ssap://tv/channelDown',
  GET_CHANNEL_LIST: 'ssap://tv/getChannelList',
  GET_CURRENT_CHANNEL: 'ssap://tv/getCurrentChannel',

  // Pointer/Input
  GET_POINTER_SOCKET: 'ssap://com.webos.service.networkinput/getPointerInputSocket',

  // Text Input (IME)
  INSERT_TEXT: 'ssap://com.webos.service.ime/insertText',
  DELETE_CHARACTERS: 'ssap://com.webos.service.ime/deleteCharacters',

  // Notifications
  CREATE_TOAST: 'ssap://system.notifications/createToast'
};

// Remote control key codes
export const Keys = {
  // Navigation
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  ENTER: 'ENTER',
  BACK: 'BACK',
  HOME: 'HOME',
  EXIT: 'EXIT',

  // Media
  PLAY: 'PLAY',
  PAUSE: 'PAUSE',
  STOP: 'STOP',
  REWIND: 'REWIND',
  FASTFORWARD: 'FASTFORWARD',

  // Volume
  VOLUMEUP: 'VOLUMEUP',
  VOLUMEDOWN: 'VOLUMEDOWN',
  MUTE: 'MUTE',

  // Channels
  CHANNELUP: 'CHANNELUP',
  CHANNELDOWN: 'CHANNELDOWN',

  // Numbers
  NUM_0: '0',
  NUM_1: '1',
  NUM_2: '2',
  NUM_3: '3',
  NUM_4: '4',
  NUM_5: '5',
  NUM_6: '6',
  NUM_7: '7',
  NUM_8: '8',
  NUM_9: '9',

  // Colors
  RED: 'RED',
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  BLUE: 'BLUE',

  // Other
  MENU: 'MENU',
  INFO: 'INFO',
  QMENU: 'QMENU',
  POWER: 'POWER',
  CC: 'CC',
  DASH: 'DASH',
  ASTERISK: 'ASTERISK'
};

export class LGTV {
  constructor(ip, options = {}) {
    this.ip = ip;
    this.port = options.port || 3001;
    this.secure = options.secure !== false; // Default to secure (wss)
    this.connectionTimeout = options.connectionTimeout || 10000; // 10 second default
    this.ws = null;
    this.pointerSocket = null;
    this.clientKey = null;
    this.commandId = 0;
    this.callbacks = new Map();
    this.connected = false;
    this.handshakeComplete = false;

    this.loadConfig();
  }

  loadConfig() {
    try {
      if (existsSync(CONFIG_PATH)) {
        const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
        this.clientKey = config.clientKey;
      }
    } catch (err) {
      // Log errors other than missing/invalid JSON (which are expected on first run)
      if (err.code !== 'ENOENT') {
        console.error('Warning: Failed to load config:', err.message);
      }
    }
  }

  saveConfig() {
    try {
      writeFileSync(CONFIG_PATH, JSON.stringify({ clientKey: this.clientKey }, null, 2));
    } catch (err) {
      console.error('Failed to save config:', err.message);
    }
  }

  connect() {
    return new Promise((resolve, reject) => {
      const protocol = this.secure ? 'wss' : 'ws';
      const url = `${protocol}://${this.ip}:${this.port}`;

      let timeoutId = null;
      let settled = false;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const resolveOnce = () => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve();
        }
      };

      const rejectOnce = (err) => {
        if (!settled) {
          settled = true;
          cleanup();
          reject(err);
        }
      };

      // Set connection timeout
      timeoutId = setTimeout(() => {
        if (!settled) {
          if (this.ws) {
            this.ws.close();
          }
          rejectOnce(new Error(`Connection timeout after ${this.connectionTimeout}ms`));
        }
      }, this.connectionTimeout);

      // LG TVs use self-signed certificates, so we must disable certificate validation.
      // This is expected and safe for local network communication with the TV.
      this.ws = new WebSocket(url, {
        rejectUnauthorized: false
      });

      this.ws.on('open', () => {
        this.connected = true;
        this.sendHandshake();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data.toString(), resolveOnce, rejectOnce);
      });

      this.ws.on('error', (err) => {
        rejectOnce(new Error(`WebSocket error: ${err.message}`));
      });

      this.ws.on('close', () => {
        this.connected = false;
        this.handshakeComplete = false;
      });
    });
  }

  sendHandshake() {
    const payload = { ...HANDSHAKE_PAYLOAD };
    if (this.clientKey) {
      payload['client-key'] = this.clientKey;
    }

    const message = {
      type: 'register',
      id: 'register_0',
      payload
    };

    this.ws.send(JSON.stringify(message));
  }

  handleMessage(data, connectResolve, connectReject) {
    let message;
    try {
      message = JSON.parse(data);
    } catch (err) {
      console.error('Failed to parse message:', data);
      return;
    }

    // Handle registration response
    if (message.id === 'register_0') {
      if (message.type === 'registered') {
        if (message.payload && message.payload['client-key']) {
          this.clientKey = message.payload['client-key'];
          this.saveConfig();
        }
        this.handshakeComplete = true;
        if (connectResolve) connectResolve();
      } else if (message.type === 'error') {
        if (connectReject) connectReject(new Error(message.error || 'Registration failed'));
      }
      return;
    }

    // Handle command responses
    const callback = this.callbacks.get(message.id);
    if (callback) {
      this.callbacks.delete(message.id);
      if (message.type === 'error') {
        callback.reject(new Error(message.error || 'Command failed'));
      } else {
        callback.resolve(message.payload);
      }
    }
  }

  sendCommand(uri, payload = {}) {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.handshakeComplete) {
        reject(new Error('Not connected to TV'));
        return;
      }

      const id = `command_${++this.commandId}`;

      const message = {
        id,
        type: 'request',
        uri,
        payload
      };

      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(message));
    });
  }

  disconnect() {
    if (this.pointerSocket) {
      this.pointerSocket.close();
      this.pointerSocket = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.handshakeComplete = false;
  }

  async getPointerSocket() {
    const result = await this.sendCommand(SSAP.GET_POINTER_SOCKET);
    if (!result || !result.socketPath) {
      throw new Error('Failed to get pointer socket path from TV');
    }
    return result.socketPath;
  }

  async connectPointer() {
    if (this.pointerSocket) return;

    const socketPath = await this.getPointerSocket();

    return new Promise((resolve, reject) => {
      this.pointerSocket = new WebSocket(socketPath, {
        rejectUnauthorized: false
      });

      this.pointerSocket.on('open', () => resolve());
      this.pointerSocket.on('error', (err) => reject(err));
    });
  }

  async sendKey(key) {
    if (!this.pointerSocket) {
      await this.connectPointer();
    }

    const message = `type:button\nname:${key}\n\n`;
    this.pointerSocket.send(message);
  }

  async sendClick() {
    if (!this.pointerSocket) {
      await this.connectPointer();
    }

    this.pointerSocket.send('type:click\n\n');
  }

  async moveMouse(dx, dy, drag = false) {
    if (!this.pointerSocket) {
      await this.connectPointer();
    }

    const message = `type:move\ndx:${dx}\ndy:${dy}\ndown:${drag ? 1 : 0}\n\n`;
    this.pointerSocket.send(message);
  }

  async scroll(dx, dy) {
    if (!this.pointerSocket) {
      await this.connectPointer();
    }

    const message = `type:scroll\ndx:${dx}\ndy:${dy}\n\n`;
    this.pointerSocket.send(message);
  }

  // Input Management
  async getInputList() {
    return this.sendCommand(SSAP.GET_INPUT_LIST);
  }

  async switchInput(inputId) {
    return this.sendCommand(SSAP.SWITCH_INPUT, { inputId });
  }

  // System
  async getSystemInfo() {
    return this.sendCommand(SSAP.GET_SYSTEM_INFO);
  }

  async turnOff() {
    return this.sendCommand(SSAP.TURN_OFF);
  }

  // Audio
  async getVolume() {
    return this.sendCommand(SSAP.GET_VOLUME);
  }

  async setVolume(volume) {
    return this.sendCommand(SSAP.SET_VOLUME, { volume });
  }

  async volumeUp() {
    return this.sendCommand(SSAP.VOLUME_UP);
  }

  async volumeDown() {
    return this.sendCommand(SSAP.VOLUME_DOWN);
  }

  async setMute(mute) {
    return this.sendCommand(SSAP.SET_MUTE, { mute });
  }

  // Apps
  async getApps() {
    return this.sendCommand(SSAP.GET_APPS);
  }

  async launchApp(id, params = {}) {
    return this.sendCommand(SSAP.LAUNCH_APP, { id, ...params });
  }

  async getForegroundApp() {
    return this.sendCommand(SSAP.GET_FOREGROUND_APP);
  }

  async closeApp(id) {
    return this.sendCommand(SSAP.CLOSE_APP, { id });
  }

  // Media Controls
  async play() {
    return this.sendCommand(SSAP.PLAY);
  }

  async pause() {
    return this.sendCommand(SSAP.PAUSE);
  }

  async stop() {
    return this.sendCommand(SSAP.STOP);
  }

  // Text Input (IME)
  async insertText(text, replace = false) {
    return this.sendCommand(SSAP.INSERT_TEXT, { text, replace });
  }

  async deleteCharacters(count) {
    return this.sendCommand(SSAP.DELETE_CHARACTERS, { count });
  }

  // Notifications
  async showToast(message) {
    return this.sendCommand(SSAP.CREATE_TOAST, { message });
  }
}

export default LGTV;
