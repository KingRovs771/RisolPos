'use client'

import { useState, useCallback } from 'react'
import {
  BluetoothPrinter,
  connectBluetoothPrinter,
  printReceipt,
  printViaRawBT,
  isBluetoothSupported,
} from '@/lib/printer'
import { ReceiptData } from '@/types'

export type PrinterStatus = 'disconnected' | 'connecting' | 'connected'

export function usePrinter() {
  const [printer, setPrinter] = useState<BluetoothPrinter | null>(null)
  const [status, setStatus] = useState<PrinterStatus>('disconnected')
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [supported] = useState<boolean>(() => isBluetoothSupported())

  const connect = useCallback(async (): Promise<boolean> => {
    if (!isBluetoothSupported()) {
      setStatus('disconnected')
      return false
    }

    setStatus('connecting')
    try {
      const activePrinter = await connectBluetoothPrinter()
      if (activePrinter) {
        setPrinter(activePrinter)
        setDeviceName(activePrinter.device.name || 'Printer Bluetooth')
        setStatus('connected')

        // Listen for disconnection event
        activePrinter.device.addEventListener('gattserverdisconnected', () => {
          setPrinter(null)
          setDeviceName(null)
          setStatus('disconnected')
        })

        return true
      } else {
        setStatus('disconnected')
        return false
      }
    } catch {
      setStatus('disconnected')
      return false
    }
  }, [])

  const disconnect = useCallback(() => {
    if (printer?.device?.gatt?.connected) {
      printer.device.gatt.disconnect()
    }
    setPrinter(null)
    setDeviceName(null)
    setStatus('disconnected')
  }, [printer])

  const print = useCallback(
    async (data: ReceiptData): Promise<boolean> => {
      if (!printer) {
        return false
      }
      return await printReceipt(printer, data)
    },
    [printer]
  )

  const printFallbackRawBT = useCallback((data: ReceiptData) => {
    printViaRawBT(data)
  }, [])

  return {
    printer,
    status,
    deviceName,
    isSupported: supported,
    connect,
    disconnect,
    print,
    printRawBT: printFallbackRawBT,
  }
}
