"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Upload,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  CameraOff,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import {
  fileToDataUrl,
  loadImage,
  resizeFromImageElement,
  resizeFromVideo,
  type ResizedImage,
} from "@/lib/image-client";

const SYMPTOMS = [
  "redness",
  "itching",
  "dryness",
  "oily",
  "pimples",
  "blackheads",
  "flaking",
  "patches",
  "burning",
  "swelling",
  "bleeding",
  "discoloration",
];

const BODY_PARTS = ["face", "scalp", "neck", "chest", "back", "arms", "legs", "hands", "feet"];

type CameraState = "idle" | "requesting" | "active" | "denied" | "no-device" | "error";
type Step = 1 | 2 | 3;

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [camState, setCamState] = useState<CameraState>("idle");
  const [camMessage, setCamMessage] = useState<string | null>(null);

  const [image, setImage] = useState<ResizedImage | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [quota, setQuota] = useState<{ used: number; limit: number; premium: boolean } | null>(null);

  const [form, setForm] = useState({
    age: 25,
    gender: "other",
    bodyPart: "face",
    duration: 7,
    symptoms: [] as string[],
    extraNotes: "",
  });

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          // Use premium flag from /me; quota fetched lazily — use defaults for display
          setQuota({ used: 0, limit: d.user.premium ? Infinity : 3, premium: d.user.premium });
        }
      });
  }, []);

  function stopStream(s: MediaStream | null) {
    s?.getTracks().forEach((t) => t.stop());
  }

  async function startCamera(facingMode: "user" | "environment" = facing) {
    setCamState("requesting");
    setCamMessage(null);
    try {
      stopStream(stream);
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      setCamState("active");
      setFacing(facingMode);
    } catch (err: any) {
      const name = err?.name ?? "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setCamState("denied");
        setCamMessage(
          "Camera access blocked. Enable camera permission in your browser settings, or upload an image instead.",
        );
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setCamState("no-device");
        setCamMessage("No camera detected. You can upload a photo instead.");
      } else {
        setCamState("error");
        setCamMessage(err?.message ?? "Could not start camera.");
      }
    }
  }

  function stopCamera() {
    stopStream(stream);
    setStream(null);
    setCamState("idle");
  }

  async function switchCamera() {
    const next = facing === "environment" ? "user" : "environment";
    await startCamera(next);
  }

  useEffect(() => () => stopStream(stream), [stream]);

  async function capture() {
    if (!videoRef.current) return;
    try {
      const resized = await resizeFromVideo(videoRef.current);
      setImage(resized);
      setUploadedUrl(null);
      stopCamera();
    } catch (err: any) {
      setError(err?.message ?? "Capture failed");
    }
  }

  async function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError("File too large (max 10MB).");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Only JPEG, PNG, or WebP images are allowed.");
      return;
    }
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(f);
      const img = await loadImage(dataUrl);
      const resized = await resizeFromImageElement(img);
      setImage(resized);
      setUploadedUrl(null);
    } catch (err: any) {
      setError(err?.message ?? "Could not read image");
    }
  }

  function reset() {
    setImage(null);
    setUploadedUrl(null);
  }

  async function uploadIfNeeded(): Promise<string | null> {
    if (!image) return null;
    if (uploadedUrl) return uploadedUrl;
    setUploading(true);
    try {
      const r = await fetch("/api/upload/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: image.dataUrl,
          width: image.width,
          height: image.height,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Upload failed");
        return null;
      }
      setUploadedUrl(data.url);
      return data.url;
    } finally {
      setUploading(false);
    }
  }

  function toggleSymptom(s: string) {
    setForm((p) =>
      p.symptoms.includes(s)
        ? { ...p, symptoms: p.symptoms.filter((x) => x !== s) }
        : { ...p, symptoms: [...p.symptoms, s] },
    );
  }

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const url = await uploadIfNeeded();
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl: url ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setResult(data);
      setStep(3);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto space-y-5">
      <div className="md:hidden">
        <h1 className="text-xl font-bold text-slate-800">AI Skin Scan</h1>
        <p className="text-sm text-slate-500">Upload or take a photo to get started</p>
      </div>
      <div className="hidden md:block">
        <p className="text-sm text-slate-500">Upload or take a photo to get started</p>
      </div>

      {/* Quota banner */}
      {quota && !quota.premium && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-2 text-sm">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          <span className="text-slate-700">
            <strong>0/3 free scans</strong> used this month.
          </span>
          <Link href="/subscription" className="ml-auto text-amber-700 font-semibold hover:underline">
            Upgrade for unlimited.
          </Link>
        </div>
      )}

      <Stepper step={step} />

      {step === 1 && (
        <PhotoStep
          image={image}
          camState={camState}
          camMessage={camMessage}
          stream={stream}
          videoRef={videoRef}
          fileRef={fileRef}
          startCamera={() => startCamera()}
          switchCamera={switchCamera}
          stopCamera={stopCamera}
          capture={capture}
          onFileChosen={onFileChosen}
          reset={reset}
        />
      )}

      {step === 2 && <DetailsStep form={form} setForm={setForm} toggleSymptom={toggleSymptom} />}

      {step === 3 && result && <ResultStep result={result} />}

      {error && <div className="text-xs text-coral-600 bg-coral-100 rounded-xl p-3">{error}</div>}

      {/* Action row */}
      {step === 1 && (
        <button onClick={() => setStep(2)} className="btn-primary w-full text-base py-3">
          Continue <ChevronRight size={16} />
        </button>
      )}
      {step === 2 && (
        <div className="flex gap-2">
          <button onClick={() => setStep(1)} className="btn-ghost">
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={submit}
            className="btn-primary flex-1 text-base py-3"
            disabled={loading || uploading}
          >
            {uploading ? "Uploading…" : loading ? "Analyzing…" : (
              <>
                <Sparkles size={16} /> Get my result
              </>
            )}
          </button>
        </div>
      )}
      {step === 3 && (
        <div className="grid md:grid-cols-3 gap-2">
          <Link href="/history" className="btn-ghost">View history</Link>
          <Link href="/chat" className="btn-ghost">Ask Derma</Link>
          <button
            onClick={() => {
              setResult(null);
              setStep(1);
              setImage(null);
              setUploadedUrl(null);
              router.refresh();
            }}
            className="btn-primary"
          >
            New scan
          </button>
        </div>
      )}

      {step !== 3 && (
        <div className="text-[10px] text-slate-400 text-center">
          AI-assisted suggestion only, not a medical diagnosis.
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: "Photo" },
    { n: 2, label: "Details" },
    { n: 3, label: "Result" },
  ];
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 py-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2 md:gap-3">
          <div
            className={`w-7 h-7 rounded-full grid place-items-center text-xs font-semibold ${
              step >= s.n ? "bg-brand text-white" : "bg-slate-200 text-slate-500"
            }`}
          >
            {s.n}
          </div>
          <div
            className={`text-sm ${step >= s.n ? "text-slate-800 font-semibold" : "text-slate-400"}`}
          >
            {s.label}
          </div>
          {i < steps.length - 1 && <div className="w-6 md:w-12 h-px bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}

function PhotoStep(props: any) {
  const {
    image,
    camState,
    camMessage,
    stream,
    videoRef,
    fileRef,
    startCamera,
    switchCamera,
    stopCamera,
    capture,
    onFileChosen,
    reset,
  } = props;

  if (image) {
    return (
      <div className="card p-5 space-y-3">
        <img src={image.dataUrl} className="rounded-xl max-h-80 mx-auto" alt="captured" />
        <div className="text-xs text-slate-400 text-center">
          {image.width}×{image.height} · {(image.bytes / 1024).toFixed(0)} KB
        </div>
        <button onClick={reset} className="btn-ghost mx-auto block">
          <RotateCcw size={14} /> Retake
        </button>
      </div>
    );
  }

  if (camState === "active" && stream) {
    return (
      <div className="card p-5 space-y-3">
        <div className="relative">
          <video ref={videoRef} className="w-full rounded-xl bg-black" playsInline muted />
          <button
            onClick={switchCamera}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2"
            aria-label="Switch camera"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={capture} className="btn-primary flex-1">
            <Camera size={16} /> Capture
          </button>
          <button onClick={stopCamera} className="btn-ghost">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-50 grid place-items-center mb-3">
          <Camera size={28} className="text-brand-700" />
        </div>
        <div className="font-semibold text-slate-800">Add a photo of your skin</div>
        <div className="text-xs text-slate-400 mt-1">Clear, well-lit photo works best</div>
      </div>

      {(camState === "denied" || camState === "no-device" || camState === "error") && (
        <div className="rounded-xl bg-coral-100 text-coral-600 p-3 text-xs flex items-start gap-2">
          <CameraOff size={14} className="mt-0.5 flex-shrink-0" />
          <span>{camMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={startCamera} className="btn-ghost py-3" disabled={camState === "requesting"}>
          <Camera size={16} /> {camState === "requesting" ? "Asking…" : "Take Photo"}
        </button>
        <button onClick={() => fileRef.current?.click()} className="btn-ghost py-3">
          <Upload size={16} /> Upload Photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={onFileChosen}
        />
      </div>
    </div>
  );
}

function DetailsStep({ form, setForm, toggleSymptom }: any) {
  return (
    <div className="card p-5 space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="label">Age</label>
          <input
            type="number"
            className="input"
            value={form.age}
            min={1}
            max={120}
            onChange={(e: any) => setForm({ ...form, age: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Gender</label>
          <select
            className="input"
            value={form.gender}
            onChange={(e: any) => setForm({ ...form, gender: e.target.value })}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Body part</label>
          <select
            className="input"
            value={form.bodyPart}
            onChange={(e: any) => setForm({ ...form, bodyPart: e.target.value })}
          >
            {BODY_PARTS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label">How long (days)?</label>
        <input
          type="number"
          className="input"
          value={form.duration}
          min={0}
          max={3650}
          onChange={(e: any) => setForm({ ...form, duration: Number(e.target.value) })}
        />
      </div>
      <div>
        <label className="label">Symptoms</label>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSymptom(s)}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${
                form.symptoms.includes(s)
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Anything else? (optional)</label>
        <textarea
          className="input"
          rows={3}
          value={form.extraNotes}
          onChange={(e: any) => setForm({ ...form, extraNotes: e.target.value })}
          placeholder="e.g. it's spreading, painful, or appeared after a new product"
        />
      </div>
    </div>
  );
}

function ResultStep({ result }: { result: any }) {
  return (
    <div className="space-y-4">
      <div className={`card p-6 ${result.safety_flag ? "border-coral-100 bg-coral-100/40" : ""}`}>
        <div className="flex items-center gap-2 mb-2">
          {result.safety_flag ? (
            <AlertTriangle className="text-coral-600" size={20} />
          ) : (
            <CheckCircle className="text-brand-700" size={20} />
          )}
          <span className="text-xs uppercase tracking-wide text-slate-500">Suggested condition</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{result.predicted_condition}</h2>
        <div className="text-sm text-slate-500 mt-1">
          Confidence: {Math.round(result.confidence * 100)}%
        </div>
        <p className="mt-4 text-sm text-slate-700 leading-relaxed">{result.description}</p>
      </div>
      <Section title="Possible effects" items={result.possible_effects} />
      <Section title="Prevention" items={result.prevention} />
      <Section title="What might help" items={result.solutions} />
      <div className="card p-4 text-xs text-slate-500">{result.disclaimer}</div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="card p-5">
      <div className="font-semibold text-slate-800 mb-2">{title}</div>
      <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
