"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BoothOptions,
  CANVAS_H,
  CANVAS_W,
  FilterKind,
  TEMPLATES,
} from "@/lib/templates";

const FILTERS: { id: FilterKind; label: string }[] = [
  { id: "none", label: "Natural" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "vintage", label: "Vintage" },
  { id: "bw", label: "Black & White" },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function Photobooth() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);

  const [yourPhoto, setYourPhoto] = useState<HTMLImageElement | null>(null);
  const [partnerPhoto, setPartnerPhoto] = useState<HTMLImageElement | null>(null);

  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [filter, setFilter] = useState<FilterKind>("none");

  const [yourName, setYourName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [message, setMessage] = useState("");
  const [cityYou, setCityYou] = useState("");
  const [cityPartner, setCityPartner] = useState("");
  const [daysApart, setDaysApart] = useState("");

  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1350 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (err) {
      setCameraError(
        "Couldn't reach a camera. Check your browser permissions, or upload a photo instead."
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const snap = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    const cx = c.getContext("2d");
    if (!cx) return;
    // mirror for a natural selfie feel
    cx.translate(c.width, 0);
    cx.scale(-1, 1);
    cx.drawImage(video, 0, 0, c.width, c.height);
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
    loadImage(c.toDataURL("image/png")).then(setYourPhoto);
  }, []);

  const captureWithCountdown = useCallback(() => {
    let n = 3;
    setCountdown(n);
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        setCountdown(null);
        snap();
      } else {
        setCountdown(n);
      }
    }, 800);
  }, [snap]);

  const handlePartnerUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, which: "you" | "partner") => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        loadImage(reader.result as string).then((img) =>
          which === "partner" ? setPartnerPhoto(img) : setYourPhoto(img)
        );
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // render whenever anything relevant changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const opts: BoothOptions = {
      yourPhoto,
      partnerPhoto,
      yourName,
      partnerName,
      message,
      cityYou,
      cityPartner,
      daysApart,
      filter,
    };
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    template.draw(ctx, opts);
  }, [template, yourPhoto, partnerPhoto, yourName, partnerName, message, cityYou, cityPartner, daysApart, filter]);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `loveframe-${template.id}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
  }, [template.id]);

  return (
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10">
      {/* left: canvas preview */}
      <div className="flex flex-col gap-4">
        <div className="relative mx-auto w-full max-w-[440px] aspect-[4/5] rounded-2xl overflow-hidden ring-1 ring-white/10 bg-dusk shadow-2xl shadow-black/40">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
        </div>
        <div className="flex justify-center">
          <button
            onClick={download}
            className="focus-ring rounded-full bg-gold text-ink font-semibold px-8 py-3 hover:brightness-105 active:scale-[0.98] transition"
          >
            Download your frame
          </button>
        </div>
      </div>

      {/* right: controls */}
      <div className="flex flex-col gap-8">
        {/* step 1: templates */}
        <section>
          <StepLabel n={1} label="Pick a frame" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className={`focus-ring text-left rounded-xl p-3 ring-1 transition ${
                  t.id === templateId
                    ? "ring-gold bg-white/10"
                    : "ring-white/10 hover:ring-white/30 bg-white/5"
                }`}
              >
                <div
                  className="w-full h-16 rounded-lg mb-2"
                  style={{ background: t.swatch }}
                />
                <p className="font-display text-sm text-paper leading-tight">{t.name}</p>
              </button>
            ))}
          </div>
        </section>

        {/* step 2: your photo */}
        <section>
          <StepLabel n={2} label="Capture your side" />
          {cameraError && (
            <p className="text-rose text-sm mb-2">{cameraError}</p>
          )}
          <div className="rounded-xl overflow-hidden bg-dusk ring-1 ring-white/10 aspect-[4/3] relative">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover -scale-x-100 ${cameraOn ? "block" : "hidden"}`}
              muted
              playsInline
            />
            {!cameraOn && (
              <div className="w-full h-full flex items-center justify-center text-sm text-white/50">
                camera is off
              </div>
            )}
            {flash && <div className="absolute inset-0 bg-white animate-pulse" />}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-6xl font-display text-paper">{countdown}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {!cameraOn ? (
              <button onClick={startCamera} className="focus-ring rounded-full bg-teal text-ink text-sm font-semibold px-4 py-2">
                Turn on camera
              </button>
            ) : (
              <>
                <button onClick={captureWithCountdown} className="focus-ring rounded-full bg-gold text-ink text-sm font-semibold px-4 py-2">
                  Capture in 3...
                </button>
                <button onClick={stopCamera} className="focus-ring rounded-full ring-1 ring-white/20 text-paper text-sm px-4 py-2">
                  Turn off
                </button>
              </>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="focus-ring rounded-full ring-1 ring-white/20 text-paper text-sm px-4 py-2"
            >
              Upload instead
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePartnerUpload(e, "you")}
            />
          </div>
        </section>

        {/* step 3: partner photo */}
        <section>
          <StepLabel n={3} label="Add their photo" />
          <p className="text-sm text-white/60 mb-2">
            The photo your partner sent you — from their phone, their side of the world.
          </p>
          <label className="focus-ring cursor-pointer flex items-center justify-center rounded-xl border border-dashed border-white/25 h-28 text-sm text-white/60 hover:border-gold hover:text-paper transition">
            {partnerPhoto ? "Replace their photo" : "Upload their photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePartnerUpload(e, "partner")}
            />
          </label>
        </section>

        {/* step 4: details */}
        <section>
          <StepLabel n={4} label="Add the details" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Your name" value={yourName} onChange={setYourName} />
            <Field label="Their name" value={partnerName} onChange={setPartnerName} />
            <Field label="Your city" value={cityYou} onChange={setCityYou} />
            <Field label="Their city" value={cityPartner} onChange={setCityPartner} />
            <Field label="Days apart" value={daysApart} onChange={setDaysApart} />
            <div>
              <label className="text-xs uppercase tracking-wide text-white/50">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterKind)}
                className="focus-ring w-full mt-1 rounded-lg bg-white/5 ring-1 ring-white/15 px-3 py-2 text-sm text-paper"
              >
                {FILTERS.map((f) => (
                  <option key={f.id} value={f.id} className="bg-dusk">
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs uppercase tracking-wide text-white/50">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="a line for this frame"
              className="focus-ring w-full mt-1 rounded-lg bg-white/5 ring-1 ring-white/15 px-3 py-2 text-sm text-paper placeholder:text-white/30"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="font-mono text-xs text-ink bg-gold rounded-full w-6 h-6 flex items-center justify-center">
        {n}
      </span>
      <h3 className="font-display text-lg text-paper">{label}</h3>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-white/50">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring w-full mt-1 rounded-lg bg-white/5 ring-1 ring-white/15 px-3 py-2 text-sm text-paper placeholder:text-white/30"
      />
    </div>
  );
}
