export default function Loading() {
  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      {/* Header skeleton */}
      <header className="w-full border-b border-border-primary bg-bg-page">
        <div className="w-full h-14 flex items-center px-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-border-subtle animate-pulse" />
            <div className="w-16 h-5 rounded bg-border-subtle animate-pulse" />
          </div>
          <div className="flex-1" />
          <div className="w-24 h-9 rounded-full bg-border-subtle animate-pulse" />
        </div>
      </header>

      <div className="flex flex-1">
        <main className="flex-1 min-w-0 overflow-y-auto">
          {/* Top events skeleton */}
          <div className="px-2 mt-4">
            <div className="w-32 h-6 rounded bg-border-subtle animate-pulse mb-3" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-[280px] h-[260px] shrink-0 rounded-xl animate-pulse"
                  style={{ background: "var(--border-subtle)" }}
                />
              ))}
            </div>
          </div>

          {/* Game cards skeleton */}
          <div className="px-2 mt-8">
            <div className="w-40 h-6 rounded bg-border-subtle animate-pulse mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-[140px] rounded-xl animate-pulse"
                  style={{ background: "var(--border-subtle)" }}
                />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile nav skeleton */}
      <div className="fixed bottom-0 left-0 right-0 h-[60px] bg-bg-card border-t border-border-primary lg:hidden flex items-center justify-around px-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-5 h-5 rounded bg-border-subtle animate-pulse" />
            <div className="w-8 h-2 rounded bg-border-subtle animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
