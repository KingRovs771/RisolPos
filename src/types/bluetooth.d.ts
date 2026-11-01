// Ambient type definitions for Web Bluetooth API

type BluetoothServiceUUID = number | string

interface BluetoothCharacteristicProperties {
  write?: boolean
  writeWithoutResponse?: boolean
}

interface BluetoothRemoteGATTCharacteristic {
  properties: BluetoothCharacteristicProperties
  writeValue(value: BufferSource): Promise<void>
  writeValueWithResponse?(value: BufferSource): Promise<void>
  writeValueWithoutResponse?(value: BufferSource): Promise<void>
}

interface BluetoothRemoteGATTService {
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>
}

interface BluetoothRemoteGATTServer {
  connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>
}

interface BluetoothDevice extends EventTarget {
  id: string
  name?: string
  gatt?: BluetoothRemoteGATTServer
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void
}

interface RequestDeviceOptions {
  filters?: Array<{ services?: BluetoothServiceUUID[] }>
  optionalServices?: BluetoothServiceUUID[]
  acceptAllDevices?: boolean
}

interface Bluetooth extends EventTarget {
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>
}

interface Navigator {
  bluetooth?: Bluetooth
}
