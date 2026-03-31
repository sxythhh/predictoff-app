"use client";

import { useState, useCallback } from "react";
import { useSearchGames, useActiveMarkets, useGame } from "@azuro-org/sdk";
import type { GameData, MarketOutcome } from "@azuro-org/toolkit";
import { useToast } from "../Toast";
import { useOddsFormat } from "../OddsFormatContext";

export function PickComposer({ onPickCreated }: { onPickCreated?: () => void }) {
  const { toast } = useToast();
  const { formatOdds } = useOddsFormat();
  const [step, setStep] = useState<"search" | "select" | "publish">("search");
  const [query, setQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<{ conditionId: string; outcomeId: string; marketName: string; selectionName: string; odds: number } | null>(null);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low" | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [visibility, setVisibility] = useState<"free" | "premium">("free");
  const [submitting, setSubmitting] = useState(false);

  const { data: searchResults } = useSearchGames({ input: query.length >= 2 ? query : "", perPage: 10 });
  const { data: markets } = useActiveMarkets({ gameId: selectedGame?.gameId ?? "" });

  const handleSelectGame = (game: GameData) => {
    setSelectedGame(game);
    setSelectedOutcome(null);
    setStep("select");
  };

  const handleSelectOutcome = (conditionId: string, outcome: MarketOutcome, marketName: string) => {
    setSelectedOutcome({
      conditionId,
      outcomeId: outcome.outcomeId,
      marketName,
      selectionName: outcome.selectionName,
      odds: outcome.odds,
    });
    setStep("publish");
  };

  const handlePublish = async () => {
    if (!selectedGame || !selectedOutcome) return;
    setSubmitting(true);

    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: selectedGame.gameId,
        gameTitle: selectedGame.title,
        sportSlug: selectedGame.sport?.slug,
        leagueName: selectedGame.league?.name,
        conditionId: selectedOutcome.conditionId,
        outcomeId: selectedOutcome.outcomeId,
        marketName: selectedOutcome.marketName,
        selectionName: selectedOutcome.selectionName,
        odds: selectedOutcome.odds,
        confidence,
        analysis: analysis.trim() || null,
        startsAt: parseInt(selectedGame.startsAt),
        visibility,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      toast("Pick published!", "success");
      setStep("search");
      setQuery("");
      setSelectedGame(null);
      setSelectedOutcome(null);
      setConfidence(null);
      setAnalysis("");
      onPickCreated?.();
    } else {
      toast(data.error ?? "Failed to publish", "error");
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border-subtle p-4">
      <h3 className="text-[14px] font-semibold text-text-primary mb-3">Share a Pick</h3>

      {/* Step 1: Search game */}
      {step === "search" && (
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a game..."
            className="w-full h-10 px-3 rounded-lg bg-bg-input border border-border-input text-[13px] text-text-primary outline-none focus:border-accent transition-colors mb-2"
          />
          {searchResults?.games && searchResults.games.length > 0 && (
            <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
              {searchResults.games.map((game: GameData) => (
                <button
                  key={game.gameId}
                  onClick={() => handleSelectGame(game)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-bg-surface hover:bg-bg-hover transition-colors text-left"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-text-primary truncate">{game.title}</div>
                    <div className="text-[11px] text-text-muted">{game.sport?.name} · {game.league?.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select outcome */}
      {step === "select" && selectedGame && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[13px] font-medium text-text-primary">{selectedGame.title}</div>
              <div className="text-[11px] text-text-muted">{selectedGame.sport?.name} · {selectedGame.league?.name}</div>
            </div>
            <button onClick={() => { setStep("search"); setSelectedGame(null); }} className="text-[12px] text-text-muted hover:text-text-primary">
              Change
            </button>
          </div>

          {markets?.length ? (
            <div className="flex flex-col gap-2">
              {markets.slice(0, 3).map((market) => (
                <div key={market.name}>
                  <div className="text-[11px] text-text-muted mb-1">{market.name}</div>
                  <div className="grid grid-cols-3 gap-1">
                    {market.conditions[0]?.outcomes.map((outcome) => (
                      <button
                        key={outcome.outcomeId}
                        onClick={() => handleSelectOutcome(market.conditions[0].conditionId, outcome, market.name)}
                        className="h-10 rounded-lg bg-bg-surface text-[13px] font-medium text-text-secondary hover:bg-bg-hover transition-colors"
                      >
                        {outcome.selectionName} <span className="text-accent ml-1">{formatOdds(outcome.odds)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-text-muted text-[12px]">Loading markets...</div>
          )}
        </div>
      )}

      {/* Step 3: Publish */}
      {step === "publish" && selectedGame && selectedOutcome && (
        <div className="flex flex-col gap-3">
          {/* Selection summary */}
          <div className="bg-bg-surface rounded-lg p-3">
            <div className="text-[11px] text-text-muted mb-1">{selectedGame.title}</div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-text-primary">{selectedOutcome.selectionName}</span>
              <span className="text-[14px] font-bold text-accent">{formatOdds(selectedOutcome.odds)}</span>
            </div>
            <div className="text-[11px] text-text-muted mt-1">{selectedOutcome.marketName}</div>
          </div>

          {/* Confidence */}
          <div>
            <label className="text-[12px] text-text-muted mb-1.5 block">Confidence</label>
            <div className="flex gap-2">
              {(["high", "medium", "low"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setConfidence(confidence === c ? null : c)}
                  className={`flex-1 h-9 rounded-lg text-[13px] font-medium capitalize transition-colors ${
                    confidence === c
                      ? c === "high" ? "bg-green-500/15 text-green-400 ring-1 ring-green-500/30"
                        : c === "medium" ? "bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30"
                        : "bg-red-500/15 text-red-400 ring-1 ring-red-500/30"
                      : "bg-bg-input text-text-secondary hover:bg-bg-hover"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis */}
          <div>
            <label className="text-[12px] text-text-muted mb-1.5 block">Analysis (optional)</label>
            <textarea
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              placeholder="Share your reasoning..."
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-bg-input border border-border-input text-[13px] text-text-primary outline-none focus:border-accent transition-colors resize-none"
            />
            <div className="text-[10px] text-text-muted text-right">{analysis.length}/500</div>
          </div>

          {/* Visibility */}
          <div className="flex gap-2">
            <button
              onClick={() => setVisibility("free")}
              className={`flex-1 h-9 rounded-lg text-[13px] font-medium transition-colors ${
                visibility === "free" ? "bg-accent-muted text-accent ring-1 ring-accent" : "bg-bg-input text-text-secondary hover:bg-bg-hover"
              }`}
            >
              Free
            </button>
            <button
              onClick={() => setVisibility("premium")}
              className={`flex-1 h-9 rounded-lg text-[13px] font-medium transition-colors ${
                visibility === "premium" ? "bg-accent-muted text-accent ring-1 ring-accent" : "bg-bg-input text-text-secondary hover:bg-bg-hover"
              }`}
            >
              Premium Only
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={() => setStep("select")} className="flex-1 h-10 rounded-lg text-[13px] font-medium text-text-secondary hover:bg-bg-hover transition-colors">
              Back
            </button>
            <button
              onClick={handlePublish}
              disabled={submitting}
              className="flex-1 h-10 rounded-lg bg-accent text-btn-primary-text text-[14px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {submitting ? "Publishing..." : "Publish Pick"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
