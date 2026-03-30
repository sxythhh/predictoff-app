"use client";

import { useState, useCallback, memo } from "react";

// ── Types ──────────────────────────────────────────────────────

interface Post {
  id: string;
  author: {
    name: string;
    handle: string;
    avatarColor: string;
  };
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked?: boolean;
}

// ── Mock Data ──────────────────────────────────────────────────

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    author: { name: "CryptoWhale", handle: "@whale_bets", avatarColor: "#6366f1" },
    content: "Just hit a 5-leg parlay on the EPL weekend matches. Man City, Arsenal, Liverpool all came through. The on-chain transparency of PredictOff makes it so much better — you can actually verify the odds are fair.",
    timestamp: "2 hours ago",
    likes: 24,
    comments: 8,
    liked: true,
  },
  {
    id: "2",
    author: { name: "Degen Dave", handle: "@degen_dave", avatarColor: "#f59e0b" },
    content: "the number one rule is to SURVIVE\n\ndont chase losses after a bad beat\ndont go broke\ndont bet your whole bankroll on one game\ndont let emotions drive your bets\n\nyour job is to STAY IN THE GAME, u cant win if you arent abl...",
    timestamp: "5 hours ago",
    likes: 47,
    comments: 12,
  },
  {
    id: "3",
    author: { name: "Stats Sarah", handle: "@stats_sarah", avatarColor: "#ec4899" },
    content: "Hot take: live betting is where the real edge is. Pre-match odds are too efficient now. But in-play? That's where you can spot value if you're watching the game and reading momentum shifts.",
    timestamp: "8 hours ago",
    likes: 31,
    comments: 5,
  },
  {
    id: "4",
    author: { name: "OnChain Oscar", handle: "@onchain_oscar", avatarColor: "#10b981" },
    content: "The fact that PredictOff runs on Azuro protocol means every bet is transparent on-chain. No more wondering if the house is adjusting odds against you. This is what sports betting should have always been.",
    timestamp: "12 hours ago",
    likes: 56,
    comments: 15,
    liked: true,
  },
  {
    id: "5",
    author: { name: "BetKing", handle: "@bet_king", avatarColor: "#8b5cf6" },
    content: "NBA playoffs model update: my regression model is showing a 62% hit rate this season on spreads. Key factors: pace-adjusted efficiency, rest days, and travel distance. Will share picks in my next post.",
    timestamp: "1 day ago",
    likes: 89,
    comments: 23,
  },
  {
    id: "6",
    author: { name: "Alice", handle: "@alice_crypto", avatarColor: "#f97316" },
    content: "If you're worried by what people think of you\n(which you shouldn't be)\n\nyou can always change their mind with a heroic restoration of value applied to their daily lives\n\nThey slowly forget you even f...",
    timestamp: "1 day ago",
    likes: 12,
    comments: 3,
  },
  {
    id: "7",
    author: { name: "SharpShooter", handle: "@sharp_shooter", avatarColor: "#06b6d4" },
    content: "Tennis tip: always check the surface stats before betting. A clay court specialist playing on hard court is basically free money for the opponent. Do your homework.",
    timestamp: "2 days ago",
    likes: 34,
    comments: 7,
  },
];

// ── SVG Icons (matching Figma: star-four, chatbubbles, share) ──

function StarIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className={className}>
      <path d="M7.5 0.5C7.5 0.5 8.5 4.5 9.5 5.5C10.5 6.5 14.5 7.5 14.5 7.5C14.5 7.5 10.5 8.5 9.5 9.5C8.5 10.5 7.5 14.5 7.5 14.5C7.5 14.5 6.5 10.5 5.5 9.5C4.5 8.5 0.5 7.5 0.5 7.5C0.5 7.5 4.5 6.5 5.5 5.5C6.5 4.5 7.5 0.5 7.5 0.5Z" fill="currentColor"/>
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M14 7.5C14.0034 8.48 13.7622 9.44479 13.3 10.3C12.7592 11.3136 11.9547 12.1618 10.9713 12.756C9.98789 13.3503 8.86248 13.6688 7.71428 13.6786C6.67 13.6786 5.648 13.3929 4.75714 12.8571L1.5 14L2.64286 10.7429C2.10714 9.852 1.82143 8.83 1.82143 7.78571C1.83124 6.63752 2.14975 5.51211 2.744 4.52873C3.33826 3.54535 4.18639 2.74078 5.2 2.2C6.05521 1.73785 7.01999 1.49655 8 1.5H8.35714C9.88406 1.58405 11.328 2.23053 12.4012 3.30312C13.4745 4.37571 14.1219 5.81918 14.2071 7.34615V7.5H14Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ShareRedoIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M14 5.33333L9.33333 1.33333V3.83333C5.33333 4.5 2.66667 7.16667 2 11.1667C3.83333 8.83333 6 7.83333 9.33333 7.83333V10.3333L14 5.33333Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Action Pill ────────────────────────────────────────────────

function ActionPill({
  likes,
  comments,
  liked,
  onLike,
}: {
  likes: number;
  comments: number;
  liked: boolean;
  onLike: () => void;
}) {
  return (
    <div className="flex h-[29px] rounded-full bg-bg-card border border-border-subtle overflow-hidden">
      {/* Like segment */}
      <button
        onClick={onLike}
        className="flex items-center gap-[3px] px-[12px] rounded-l-full hover:bg-bg-hover transition-colors"
      >
        <StarIcon className={`size-[15px] ${liked ? "text-accent" : "text-text-muted"}`} />
        <span className="text-[12px] font-semibold tracking-[-0.5px] text-text-muted tabular-nums">{likes}</span>
      </button>

      {/* Divider */}
      <div className="w-px bg-border-subtle" />

      {/* Comment segment */}
      <button className="flex items-center gap-[3px] px-[12px] hover:bg-bg-hover transition-colors">
        <ChatIcon className="size-[16px] text-text-muted" />
        <span className="text-[12px] font-semibold tracking-[-0.5px] text-text-muted tabular-nums">{comments}</span>
      </button>

      {/* Divider */}
      <div className="w-px bg-border-subtle" />

      {/* Share segment */}
      <button className="flex items-center gap-[3px] px-[12px] rounded-r-full hover:bg-bg-hover transition-colors">
        <ShareRedoIcon className="size-[16px] text-text-muted" />
        <span className="text-[12px] font-semibold tracking-[-0.5px] text-text-muted">Share</span>
      </button>
    </div>
  );
}

// ── Post Card ──────────────────────────────────────────────────

const PostCard = memo(function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked ?? false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [expanded, setExpanded] = useState(false);

  const handleLike = useCallback(() => {
    setLiked((prev) => {
      setLikeCount((c) => prev ? c - 1 : c + 1);
      return !prev;
    });
  }, []);

  const isLong = post.content.length > 200;
  const displayContent = isLong && !expanded ? post.content.slice(0, 200) + "..." : post.content;

  return (
    <div className="border-t border-border-subtle bg-bg-card/80">
      <div className="px-4 py-[10px]">
        {/* Author row */}
        <div className="flex items-center gap-[5px] mb-[5px]">
          <div
            className="w-[30px] h-[28px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white overflow-hidden"
            style={{ background: post.author.avatarColor }}
          >
            {post.author.name.slice(0, 1)}
          </div>
          <div className="flex items-baseline gap-[5px] min-w-0 flex-1">
            <span className="text-[14px] font-semibold text-text-primary leading-[18px] truncate">{post.author.name}</span>
            <span className="text-[13px] text-text-muted leading-[18px] truncate">{post.author.handle}</span>
          </div>
          <span className="text-[12px] text-text-muted shrink-0">{post.timestamp}</span>
        </div>

        {/* Content */}
        <div className="text-[14px] text-text-primary leading-[20px] whitespace-pre-line tracking-[-0.01em]">
          {displayContent}
        </div>
        {isLong && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-[13px] text-accent font-semibold mt-1 hover:underline"
          >
            Read more
          </button>
        )}

        {/* Image */}
        {post.image && (
          <div className="mt-3 rounded-lg overflow-hidden border border-border-subtle">
            <img src={post.image} alt="" className="w-full" />
          </div>
        )}

        {/* Actions — pill bar */}
        <div className="mt-3">
          <ActionPill
            likes={likeCount}
            comments={post.comments}
            liked={liked}
            onLike={handleLike}
          />
        </div>
      </div>
    </div>
  );
});

// ── Referral Banner ────────────────────────────────────────────

function ReferralBanner() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText("predictoff.xyz/invite/");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="border-t border-border-subtle bg-bg-card/80 px-4 py-4">
      <div className="flex items-baseline gap-[5px] mb-2">
        <span className="text-[15px] font-semibold text-text-primary">Invite Your Network and</span>
        <span className="text-[15px] font-semibold text-accent">get paid!</span>
      </div>
      <p className="text-[13px] text-text-secondary leading-[18px] mb-3">
        Earn $1 for every friend you invite, plus $1 when they verify their profile. Spread it in the PredictOff Discord.
      </p>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[13px] text-text-muted">predictoff.xyz/invite/</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="text-[13px] font-semibold text-accent hover:underline">
          Invites Dashboard ➜
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 h-[29px] px-4 rounded-full bg-bg-card border border-border-subtle text-[13px] font-semibold text-text-primary hover:bg-bg-hover transition-colors"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}

// ── Main Feed ──────────────────────────────────────────────────

export function SocialFeed() {
  const [postText, setPostText] = useState("");

  return (
    <main className="flex-1 min-w-0 overflow-y-auto">
      {/* Composer */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-[32px] h-[32px] rounded-full bg-text-muted/30 shrink-0 overflow-hidden mt-0.5" />
          {/* Input area */}
          <div className="flex-1 min-w-0">
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What are you working on?"
              className="w-full bg-transparent text-[14px] text-text-primary placeholder:text-text-muted resize-none outline-none min-h-[28px] leading-[20px] tracking-[-0.01em]"
              rows={1}
            />
          </div>
          {/* Post button */}
          <button
            className={`shrink-0 h-[28px] px-[14px] rounded-full text-[14px] font-semibold tracking-[-0.5px] transition-colors shadow-[0_7px_30px_-10px_var(--accent-muted)] ${
              postText.trim()
                ? "bg-accent text-btn-primary-text cursor-pointer hover:bg-accent-hover"
                : "bg-accent/40 text-btn-primary-text/50 cursor-not-allowed"
            }`}
            disabled={!postText.trim()}
          >
            Post
          </button>
        </div>
      </div>

      {/* Referral */}
      <ReferralBanner />

      {/* Feed */}
      {MOCK_POSTS.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </main>
  );
}
