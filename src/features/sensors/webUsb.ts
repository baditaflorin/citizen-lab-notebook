import { createId, type SensorReading } from "../../types";

export interface WebUsbCaptureResult {
  deviceLabel: string;
  readings: SensorReading[];
}

export function isWebUsbSupported(): boolean {
  return Boolean(navigator.usb);
}

export async function captureWebUsbReadings(): Promise<WebUsbCaptureResult> {
  if (!navigator.usb) {
    throw new Error("WebUSB is not available in this browser. Try Chromium over HTTPS.");
  }

  const device = await navigator.usb.requestDevice({ filters: [] });

  if (!device.opened) {
    await device.open();
  }

  if (!device.configuration) {
    await device.selectConfiguration(1);
  }

  const iface = device.configuration?.interfaces.find((item) =>
    item.alternate.endpoints.some((endpoint) => endpoint.direction === "in"),
  );

  if (!iface) {
    throw new Error("The selected USB device does not expose an input endpoint.");
  }

  await device.claimInterface(iface.interfaceNumber);
  const endpoint = iface.alternate.endpoints.find((item) => item.direction === "in");

  if (!endpoint) {
    throw new Error("The selected USB interface does not expose an input endpoint.");
  }

  const decoder = new TextDecoder();
  const chunks: string[] = [];

  for (let index = 0; index < 8; index += 1) {
    const result = await device.transferIn(endpoint.endpointNumber, endpoint.packetSize || 64);

    if (result.status === "ok" && result.data) {
      chunks.push(decoder.decode(result.data));
    }
  }

  const readings = parseUsbText(chunks.join("\n"));

  return {
    deviceLabel:
      [device.manufacturerName, device.productName].filter(Boolean).join(" ") || "USB device",
    readings,
  };
}

export function parseUsbText(contents: string): SensorReading[] {
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line, index) => {
      const match = line.match(
        /(-?\d+(?:\.\d+)?)\s*[,;\t ]\s*(-?\d+(?:\.\d+)?)(?:\s*([a-zA-Z%/]+))?/,
      );

      if (!match) {
        return [];
      }

      return [
        {
          id: createId("reading"),
          time: Number(match[1]),
          value: Number(match[2]),
          unit: match[3] ?? "",
          label: `usb-${index + 1}`,
        },
      ];
    });
}
