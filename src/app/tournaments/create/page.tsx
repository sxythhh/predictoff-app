"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/waliet/Toast";
import { GamePicker } from "@/components/waliet/tournaments/GamePicker";
import type { TournamentGame } from "@/types/tournament";

type Step = "format" | "details" | "scope" | "entry" | "review";
const STEPS: Step[] = ["format", "details", "scope", "entry", "review"];

export default function CreateTournamentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, signIn } = useAuth();

  // All hooks must be called before any early return
  const [step, setStep] = useState<Step>("format");
  const [submitting, setSubmitting] = useState(false);
  const [format, setFormat] = useState<"profit" | "pickem">("profit");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scoringMethod, setScoringMethod] = useState("profit");
  const [scope, setScope] = useState<"open" | "curated">("open");
  const [entryType, setEntryType] = useState<"free" | "paid">("free");
  const [entryFee, setEntryFee] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [prizeStructure, setPrizeStructure] = useState("50,30,20");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [curatedGames, setCuratedGames] = useState<TournamentGame[]>([]);
  const now = Math.floor(Date.now() / 1000);
  const [registrationStart] = useState(now);
  const [startsIn, setStartsIn] = useState("24"); // hours from now
  const [duration, setDuration] = useState("48"); // hours

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-text-secondary text-[15px]">Sign in to create a tournament</p>
        <button onClick={signIn} className="h-10 px-6 rounded-lg bg-accent text-btn-primary-text text-[14px] font-semibold hover:bg-accent-hover transition-colors">
          Sign In
        </button>
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(step);

  const next = () => {
    const nextStep = STEPS[stepIndex + 1];
    if (nextStep) setStep(nextStep);
  };
  const prev = () => {
    const prevStep = STEPS[stepIndex - 1];
    if (prevStep) setStep(prevStep);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const startsAt = now + parseInt(startsIn) * 3600;
    const endsAt = startsAt + parseInt(duration) * 3600;
    const registrationEnd = startsAt;

    // Parse prize structure
    const pcts = prizeStructure.split(",").map((s) => parseInt(s.trim())).filter(Boolean);
    const prizeObj: Record<string, number> = {};
    pcts.forEach((pct, i) => { prizeObj[String(i + 1)] = pct; });

    const body = {
      title: title.trim(),
      description: description.trim() || null,
      format,
      entryType,
      entryFee: entryType === "paid" ? parseFloat(entryFee) : null,
      currency: "USDT",
      prizeStructure: pcts.length > 0 ? prizeObj : null,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
      minParticipants: 2,
      scoringMethod: format === "pickem" ? "points" : scoringMethod,
      scope,
      registrationStart,
      registrationEnd,
      startsAt,
      endsAt,
      visibility,
      games: scope === "curated" ? curatedGames.map((g) => ({
        gameId: g.gameId,
        gameTitle: g.gameTitle,
        sportName: g.sportName,
        leagueName: g.leagueName,
        startsAt: g.startsAt,
      })) : undefined,
    };

    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (res.ok) {
      // Publish immediately
      await fetch(`/api/tournaments/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "open" }),
      });
      toast("Tournament created!", "success");
      router.push(`/tournaments/${data.id}`);
    } else {
      toast(data.error ?? "Failed to create", "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="text-text-primary" style={{ letterSpacing: "-0.02em" }}>

      <div className="max-w-[500px] mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[18px] font-semibold">Create Tournament</h1>
          <Link href="/tournaments" className="text-[13px] text-text-muted hover:text-text-primary transition-colors">Cancel</Link>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-accent" : "bg-border-subtle"}`} />
          ))}
        </div>

        {/* Step: Format */}
        {step === "format" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] font-semibold">Choose Format</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setFormat("profit"); setScoringMethod("profit"); }}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  format === "profit" ? "border-accent bg-accent/5" : "border-border-subtle bg-bg-card hover:bg-bg-hover"
                }`}
              >
                <div className="text-[15px] font-semibold">Profit Leaderboard</div>
                <p className="text-[12px] text-text-muted mt-1">Players bet normally. Ranked by profit from real on-chain bets during the tournament window.</p>
              </button>
              <button
                onClick={() => { setFormat("pickem"); setScoringMethod("points"); }}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  format === "pickem" ? "border-accent bg-accent/5" : "border-border-subtle bg-bg-card hover:bg-bg-hover"
                }`}
              >
                <div className="text-[15px] font-semibold">Pick'em Predictions</div>
                <p className="text-[12px] text-text-muted mt-1">Select specific games. Players predict outcomes. Scored by correct picks — no real money on individual picks.</p>
              </button>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === "details" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] font-semibold">Tournament Details</h2>
            <div>
              <label className="text-[12px] text-text-muted mb-1 block">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekend Warriors"
                maxLength={100}
                className="w-full h-10 px-3 rounded-lg bg-bg-input border border-border-input text-[14px] text-text-primary outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-[12px] text-text-muted mb-1 block">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your tournament..."
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-input text-[13px] text-text-primary outline-none focus:border-accent transition-colors resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-text-muted mb-1 block">Starts in (hours)</label>
                <input
                  type="number"
                  value={startsIn}
                  onChange={(e) => setStartsIn(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-bg-input border border-border-input text-[14px] text-text-primary outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="text-[12px] text-text-muted mb-1 block">Duration (hours)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-bg-input border border-border-input text-[14px] text-text-primary outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>
            {format === "profit" && (
              <div>
                <label className="text-[12px] text-text-muted mb-1 block">Scoring</label>
                <div className="flex gap-2">
                  {["profit", "roi"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setScoringMethod(m)}
                      className={`flex-1 h-9 rounded-lg text-[13px] font-medium capitalize transition-colors ${
                        scoringMethod === m ? "bg-accent-muted text-accent ring-1 ring-accent" : "bg-bg-input text-text-secondary hover:bg-bg-hover"
                      }`}
                    >
                      {m === "roi" ? "ROI %" : "Profit"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Scope */}
        {step === "scope" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] font-semibold">Tournament Scope</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setScope("open")}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  scope === "open" ? "border-accent bg-accent/5" : "border-border-subtle bg-bg-card hover:bg-bg-hover"
                }`}
              >
                <div className="text-[14px] font-semibold">Open — Any Market</div>
                <p className="text-[12px] text-text-muted mt-1">
                  {format === "profit"
                    ? "All bets placed during the tournament window count toward scoring."
                    : "Players can make picks on any available game."}
                </p>
              </button>
              <button
                onClick={() => setScope("curated")}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  scope === "curated" ? "border-accent bg-accent/5" : "border-border-subtle bg-bg-card hover:bg-bg-hover"
                }`}
              >
                <div className="text-[14px] font-semibold">Curated — Selected Games</div>
                <p className="text-[12px] text-text-muted mt-1">Only bets/picks on specific games you choose will count.</p>
              </button>
            </div>

            {/* Game picker for curated scope */}
            {scope === "curated" && (
              <GamePicker
                existingGames={curatedGames}
                onGamesChange={setCuratedGames}
              />
            )}

            <div>
              <label className="text-[12px] text-text-muted mb-1 block">Max Players (optional)</label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="Unlimited"
                className="w-full h-10 px-3 rounded-lg bg-bg-input border border-border-input text-[14px] text-text-primary outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="text-[12px] text-text-muted mb-1 block">Visibility</label>
              <div className="flex gap-2">
                {(["public", "private"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={`flex-1 h-9 rounded-lg text-[13px] font-medium capitalize transition-colors ${
                      visibility === v ? "bg-accent-muted text-accent ring-1 ring-accent" : "bg-bg-input text-text-secondary hover:bg-bg-hover"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Entry */}
        {step === "entry" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] font-semibold">Entry & Prizes</h2>
            <div className="flex gap-2">
              {(["free", "paid"] as const).map((et) => (
                <button
                  key={et}
                  onClick={() => setEntryType(et)}
                  className={`flex-1 h-10 rounded-lg text-[14px] font-medium capitalize transition-colors ${
                    entryType === et ? "bg-accent-muted text-accent ring-1 ring-accent" : "bg-bg-input text-text-secondary hover:bg-bg-hover"
                  }`}
                >
                  {et}
                </button>
              ))}
            </div>
            {entryType === "paid" && (
              <div>
                <label className="text-[12px] text-text-muted mb-1 block">Entry Fee (USDT)</label>
                <input
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full h-10 px-3 rounded-lg bg-bg-input border border-border-input text-[14px] text-text-primary outline-none focus:border-accent transition-colors"
                />
              </div>
            )}
            <div>
              <label className="text-[12px] text-text-muted mb-1 block">Prize Split (comma-separated %)</label>
              <input
                type="text"
                value={prizeStructure}
                onChange={(e) => setPrizeStructure(e.target.value)}
                placeholder="50, 30, 20"
                className="w-full h-10 px-3 rounded-lg bg-bg-input border border-border-input text-[14px] text-text-primary outline-none focus:border-accent transition-colors"
              />
              <p className="text-[11px] text-text-muted mt-1">e.g. "50, 30, 20" means 1st gets 50%, 2nd gets 30%, 3rd gets 20%</p>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-[18px] font-semibold">Review & Publish</h2>
            <div className="bg-bg-card rounded-xl border border-border-subtle p-4 flex flex-col gap-2 text-[13px]">
              <div className="flex justify-between"><span className="text-text-muted">Title</span><span className="font-medium">{title || "—"}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Format</span><span className="font-medium capitalize">{format}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Scoring</span><span className="font-medium capitalize">{format === "pickem" ? "Points" : scoringMethod}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Scope</span><span className="font-medium capitalize">{scope}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Entry</span><span className="font-medium">{entryType === "free" ? "Free" : `${entryFee} USDT`}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Max Players</span><span className="font-medium">{maxParticipants || "Unlimited"}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Starts in</span><span className="font-medium">{startsIn} hours</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Duration</span><span className="font-medium">{duration} hours</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Visibility</span><span className="font-medium capitalize">{visibility}</span></div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {stepIndex > 0 ? (
            <button onClick={prev} className="h-10 px-5 rounded-lg text-[14px] font-medium text-text-secondary hover:text-text-primary transition-colors">
              Back
            </button>
          ) : <div />}

          {step === "review" ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim()}
              className="h-10 px-6 rounded-lg bg-accent text-btn-primary-text text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Publish Tournament"}
            </button>
          ) : (
            <button
              onClick={next}
              disabled={step === "details" && !title.trim()}
              className="h-10 px-6 rounded-lg bg-accent text-btn-primary-text text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
