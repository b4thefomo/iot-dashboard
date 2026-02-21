import {
  BleManager,
  Device,
  Characteristic,
  BleError,
  State,
  Subscription,
} from 'react-native-ble-plx';
import { parseHeartRate, parseBatteryLevel } from './hr-parser';
import { HRMeasurement } from './types';

const HR_SERVICE_UUID = '180D';
const HR_MEASUREMENT_UUID = '2A37';
const BATTERY_SERVICE_UUID = '180F';
const BATTERY_LEVEL_UUID = '2A19';

const RESTORE_ID = 'chest-strap-ble-restore';

type OnMeasurement = (m: HRMeasurement) => void;
type OnBattery = (level: number) => void;
type OnStateChange = (state: 'scanning' | 'connecting' | 'connected' | 'disconnected') => void;

let manager: BleManager | null = null;
let connectedDevice: Device | null = null;
let monitorSub: Subscription | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let shouldReconnect = false;

let _onMeasurement: OnMeasurement | null = null;
let _onBattery: OnBattery | null = null;
let _onStateChange: OnStateChange | null = null;

function getManager(): BleManager {
  if (!manager) {
    manager = new BleManager({
      restoreStateIdentifier: RESTORE_ID,
      restoreStateFunction: (restoredState) => {
        if (restoredState?.connectedPeripherals?.length) {
          const device = restoredState.connectedPeripherals[0];
          connectedDevice = device;
          _onStateChange?.('connected');
          subscribeToHR(device);
        }
      },
    });
  }
  return manager;
}

export function setCallbacks(
  onMeasurement: OnMeasurement,
  onBattery: OnBattery,
  onStateChange: OnStateChange
) {
  _onMeasurement = onMeasurement;
  _onBattery = onBattery;
  _onStateChange = onStateChange;
}

export async function startScan(): Promise<void> {
  const mgr = getManager();
  shouldReconnect = true;

  const state = await mgr.state();
  if (state !== State.PoweredOn) {
    await new Promise<void>((resolve) => {
      const sub = mgr.onStateChange((s) => {
        if (s === State.PoweredOn) {
          sub.remove();
          resolve();
        }
      }, true);
    });
  }

  _onStateChange?.('scanning');

  mgr.startDeviceScan(
    [HR_SERVICE_UUID],
    { allowDuplicates: false },
    (error: BleError | null, device: Device | null) => {
      if (error || !device) return;
      mgr.stopDeviceScan();
      connectToDevice(device);
    }
  );
}

async function connectToDevice(device: Device): Promise<void> {
  _onStateChange?.('connecting');
  try {
    const connected = await device.connect({ autoConnect: true });
    await connected.discoverAllServicesAndCharacteristics();
    connectedDevice = connected;
    _onStateChange?.('connected');

    readBattery(connected);
    subscribeToHR(connected);

    connected.onDisconnected((_error, dev) => {
      monitorSub?.remove();
      monitorSub = null;
      connectedDevice = null;
      _onStateChange?.('disconnected');
      if (shouldReconnect && dev) {
        scheduleReconnect(dev);
      }
    });
  } catch {
    _onStateChange?.('disconnected');
    if (shouldReconnect) {
      scheduleReconnect(device);
    }
  }
}

function subscribeToHR(device: Device): void {
  monitorSub?.remove();
  monitorSub = device.monitorCharacteristicForService(
    HR_SERVICE_UUID,
    HR_MEASUREMENT_UUID,
    (error: BleError | null, char: Characteristic | null) => {
      if (error || !char?.value) return;
      const measurement = parseHeartRate(char.value);
      _onMeasurement?.(measurement);
    }
  );
}

async function readBattery(device: Device): Promise<void> {
  try {
    const char = await device.readCharacteristicForService(
      BATTERY_SERVICE_UUID,
      BATTERY_LEVEL_UUID
    );
    if (char?.value) {
      _onBattery?.(parseBatteryLevel(char.value));
    }
  } catch {
    // Battery service not available on all devices
  }
}

function scheduleReconnect(device: Device): void {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    connectToDevice(device);
  }, 3000);
}

export async function disconnect(): Promise<void> {
  shouldReconnect = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  monitorSub?.remove();
  monitorSub = null;
  if (connectedDevice) {
    try {
      await connectedDevice.cancelConnection();
    } catch {
      // Already disconnected
    }
    connectedDevice = null;
  }
  _onStateChange?.('disconnected');
}

export function destroyManager(): void {
  disconnect();
  manager?.destroy();
  manager = null;
}
