import { BrainCircuit, Database, Mic, Usb, WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { isWebUsbSupported } from "../features/sensors/webUsb";

function status(label: string, available: boolean, detail: string, icon: ReactNode) {
  return (
    <li className={available ? "capability good" : "capability muted"}>
      {icon}
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
    </li>
  );
}

export function CapabilityGrid() {
  const speechAvailable = Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);
  const microphoneAvailable = Boolean(navigator.mediaDevices?.getUserMedia);
  const storageAvailable = "indexedDB" in window;

  return (
    <ul className="capability-grid" aria-label="Local capability status">
      {status(
        "WebUSB",
        isWebUsbSupported(),
        isWebUsbSupported() ? "sensor capture ready" : "Chromium HTTPS required",
        <Usb size={18} />,
      )}
      {status(
        "Voice",
        microphoneAvailable || speechAvailable,
        microphoneAvailable ? "recording available" : "manual notes available",
        <Mic size={18} />,
      )}
      {status(
        "Storage",
        storageAvailable,
        storageAvailable ? "IndexedDB ready" : "export only",
        <Database size={18} />,
      )}
      {status("Local AI", true, "Whisper and LLM load on demand", <BrainCircuit size={18} />)}
      {status("Offline shell", true, "PWA cache after first build", <WifiOff size={18} />)}
    </ul>
  );
}
