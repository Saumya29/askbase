import { getDeviceId } from "./device";

export function deviceHeaders(extra?: Record<string, string>): Record<string, string> {
  return { "x-device-id": getDeviceId(), ...extra };
}
