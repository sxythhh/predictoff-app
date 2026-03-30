"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

interface CommentUser {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatar: string | null;
}

interface Comment {
  id: string;
  gameId: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  likeCount: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function GameComments({ gameId }: { gameId: string }) {
  const { user, isAuthenticated, signIn } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?gameId=${gameId}`);
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePost = async () => {
    if (!content.trim() || isPosting) return;
    setIsPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, content: content.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [comment, ...prev]);
        setContent("");
      }
    } catch {
      // ignore
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!isAuthenticated) return;
    try {
      await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
      // Optimistic update
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, likeCount: c.likeCount + 1 } : c
        )
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="border-t border-border-subtle">
      <div className="px-6 py-4">
        <h3 className="text-[14px] font-semibold text-text-primary mb-3">
          Comments {comments.length > 0 && <span className="text-text-muted font-normal">({comments.length})</span>}
        </h3>

        {/* Composer */}
        {isAuthenticated ? (
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-bg-surface flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-text-muted">
                {(user?.displayName ?? user?.walletAddress ?? "?").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-bg-input rounded-lg px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted resize-none border border-border-input focus:border-accent focus:outline-none"
                rows={2}
                maxLength={1000}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-text-muted">{content.length}/1000</span>
                <button
                  onClick={handlePost}
                  disabled={!content.trim() || isPosting}
                  className="h-8 px-4 rounded-lg bg-accent text-btn-primary-text text-[13px] font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {isPosting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={signIn}
            className="w-full h-10 rounded-lg bg-bg-surface hover:bg-bg-hover text-[13px] font-medium text-text-secondary transition-colors mb-4"
          >
            Sign in with wallet to comment
          </button>
        )}

        {/* Comments list */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-border-subtle animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-[13px] text-text-muted text-center py-6">No comments yet. Be the first!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-bg-surface flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-text-muted">
                    {(comment.user.displayName ?? comment.user.walletAddress).slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-semibold text-text-primary">
                      {comment.user.displayName ?? formatAddress(comment.user.walletAddress)}
                    </span>
                    <span className="text-[11px] text-text-muted">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-[13px] text-text-secondary leading-relaxed">{comment.content}</p>
                  <button
                    onClick={() => handleLike(comment.id)}
                    className="flex items-center gap-1 mt-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M8 14.25C8 14.25 1.5 10 1.5 5.5C1.5 3.567 3.067 2 5 2C6.342 2 7.5 2.783 8 3.905C8.5 2.783 9.658 2 11 2C12.933 2 14.5 3.567 14.5 5.5C14.5 10 8 14.25 8 14.25Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
