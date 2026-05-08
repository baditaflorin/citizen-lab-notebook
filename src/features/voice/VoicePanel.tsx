import { Mic, MicOff, Plus, Sparkles, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Section } from "../../components/Section";
import { createId, type VoiceNote } from "../../types";
import { transcribeWithWhisper } from "./aiClient";

interface VoicePanelProps {
  notes: VoiceNote[];
  onAddNote: (note: VoiceNote) => void;
  onDeleteNote: (id: string) => void;
}

export function VoicePanel({ notes, onAddNote, onDeleteNote }: VoicePanelProps) {
  const [manualNote, setManualNote] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [listening, setListening] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState("Ready");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function addNote(source: VoiceNote["source"], text: string) {
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }

    onAddNote({
      id: createId("voice"),
      createdAt: new Date().toISOString(),
      source,
      text: trimmed,
    });
  }

  function startSpeechRecognition() {
    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!Constructor) {
      setStatus("Speech recognition is not available in this browser.");
      return;
    }

    const recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let transcript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }

      setLiveTranscript((current) => `${current} ${transcript}`.trim());
    };
    recognition.onerror = (event) => setStatus(`Speech recognition error: ${event.error}`);
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
    setStatus("Listening locally through the browser speech API");
  }

  function stopSpeechRecognition() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
    addNote("speech-recognition", liveTranscript);
    setLiveTranscript("");
    setStatus("Speech note saved");
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("Microphone recording is not available in this browser.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      setAudioBlob(blob);
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStatus("Recording captured. Whisper can transcribe it locally.");
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
    setStatus("Recording audio");
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  async function runWhisper() {
    if (!audioBlob) {
      setStatus("Record audio before starting Whisper.");
      return;
    }

    try {
      const text = await transcribeWithWhisper(audioBlob, setStatus);
      addNote("whisper", text);
      setStatus("Whisper transcript saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Whisper transcription failed");
    }
  }

  return (
    <Section title="Voice Narration" eyebrow="Observation capture">
      <div className="button-row">
        <button type="button" onClick={listening ? stopSpeechRecognition : startSpeechRecognition}>
          {listening ? <MicOff size={16} /> : <Mic size={16} />}
          {listening ? "Stop dictation" : "Dictate"}
        </button>
        <button type="button" onClick={recording ? stopRecording : startRecording}>
          {recording ? <MicOff size={16} /> : <Mic size={16} />}
          {recording ? "Stop recording" : "Record audio"}
        </button>
        <button className="ghost-button" type="button" onClick={runWhisper} disabled={!audioBlob}>
          <Sparkles size={16} />
          Whisper
        </button>
      </div>

      <p className="status-line">{status}</p>

      {liveTranscript ? <p className="live-transcript">{liveTranscript}</p> : null}

      <label className="field">
        <span>Manual observation</span>
        <textarea
          value={manualNote}
          onChange={(event) => setManualNote(event.target.value)}
          rows={3}
        />
      </label>
      <button
        className="ghost-button"
        type="button"
        onClick={() => {
          addNote("manual", manualNote);
          setManualNote("");
        }}
      >
        <Plus size={16} />
        Add note
      </button>

      <div className="note-list">
        {notes.length === 0 ? <p className="empty-state">No observations yet.</p> : null}
        {notes.map((note) => (
          <article className="note" key={note.id}>
            <div>
              <strong>{note.source}</strong>
              <time>{new Date(note.createdAt).toLocaleString()}</time>
              <p>{note.text}</p>
            </div>
            <button
              className="icon-only"
              type="button"
              onClick={() => onDeleteNote(note.id)}
              aria-label="Delete note"
            >
              <Trash2 size={16} />
            </button>
          </article>
        ))}
      </div>
    </Section>
  );
}
