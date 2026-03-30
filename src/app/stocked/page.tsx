export default function StockedPage() {
  return (
    <div
      style={{
        width: 720,
        height: 963,
        background: "#0a0a0a",
        margin: "0 auto",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Orange ellipse glow */}
      <div
        style={{
          position: "absolute",
          width: 117,
          height: 44,
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          background: "#ff5000",
          opacity: 0.06,
          borderRadius: "50%",
          filter: "blur(40px)",
        }}
      />

      {/* Phone Frame */}
      <div
        style={{
          width: 375,
          height: 812,
          borderRadius: 8,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a",
        }}
      >
        {/* === Top Area: Dots + Chart + Balance (~208px for dots/chart, 152px balance) === */}
        <div style={{ position: "relative", height: 208, flexShrink: 0 }}>
          {/* Dot grid pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.15) 0.5px, transparent 0.5px)",
              backgroundSize: "14px 14px",
              backgroundPosition: "7px 7px",
            }}
          />
          {/* Gradient fading dots toward bottom */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, transparent 0%, #161616 100%)",
            }}
          />
        </div>

        {/* Balance Section (375x152) */}
        <div style={{ position: "relative", height: 152, flexShrink: 0 }}>
          {/* Chart container with gradient overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, #161616 0%, transparent 100%)",
            }}
          />
          {/* Chart stroke lines */}
          <svg
            style={{ position: "absolute", bottom: 0, left: 0 }}
            width="375"
            height="152"
            viewBox="0 0 375 152"
            fill="none"
          >
            <path
              d="M0 120 C20 115, 40 100, 70 105 C100 110, 110 85, 140 80 C170 75, 180 90, 210 70 C240 50, 260 65, 290 55 C320 45, 340 35, 375 40"
              stroke="#ff5000"
              strokeWidth="1.5"
              fill="none"
              opacity="0.60"
            />
            <path
              d="M0 130 C25 125, 50 115, 80 118 C110 121, 120 100, 150 95 C180 90, 195 105, 220 85 C245 65, 270 78, 300 68 C330 58, 350 48, 375 52"
              stroke="#ff5000"
              strokeWidth="1.5"
              fill="none"
              opacity="0.40"
            />
          </svg>

          {/* Balance text overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 20,
              right: 20,
              zIndex: 10,
            }}
          >
            <p
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: "rgba(255,255,255,0.60)",
                letterSpacing: "-0.32px",
                margin: 0,
                marginBottom: 4,
              }}
            >
              Assets
            </p>
            <p
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: "rgba(255,255,255,0.90)",
                letterSpacing: "-0.64px",
                margin: 0,
                marginBottom: 6,
                lineHeight: 1.1,
              }}
            >
              $54,847.30
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 400,
                letterSpacing: "-0.24px",
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M5 8L2 3h6L5 8Z"
                  fill="#ff5000"
                />
              </svg>
              <span style={{ color: "#ff5000" }}>3.24%</span>
              <span style={{ color: "rgba(255,255,255,0.40)" }}>&middot;</span>
              <span style={{ color: "#ff5000" }}>-$1,023.95</span>
              <span style={{ color: "rgba(255,255,255,0.40)" }}>Today</span>
            </div>
          </div>
        </div>

        {/* === Modal Section (375x604, bg #121212, border 1px #060606 outside) === */}
        <div
          style={{
            flex: 1,
            background: "#121212",
            border: "1px solid #060606",
            borderTop: "none",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Top line */}
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.03)",
              flexShrink: 0,
            }}
          />

          {/* Handlebar container: 20px height, padding 8px 14px */}
          <div
            style={{
              height: 20,
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxSizing: "content-box",
            }}
          >
            <div
              style={{
                width: 32,
                height: 4,
                borderRadius: 10,
                background: "#333333",
              }}
            />
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {/* === Watchlists Header === */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 16px",
                height: 56,
                boxSizing: "border-box",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.80)",
                    letterSpacing: "-0.32px",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  Watchlists
                </p>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.40)",
                    letterSpacing: "-0.24px",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  You have 5 Stocks
                </p>
              </div>
              <button
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 1000,
                  padding: "8px 16px",
                  boxShadow: "0px 4px 32px rgba(0,0,0,0.50)",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.80)",
                  letterSpacing: "-0.24px",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                Add Stock
              </button>
            </div>

            {/* === Stock Rows === */}
            {/* Row 1 - GOOG */}
            <StockRow
              icon={
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#171717",
                    boxShadow: "0px 8px 10px rgba(0,0,0,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                    <path
                      d="M2 14C4 10 7 4 10 3C13 2 16 8 18 6"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </div>
              }
              ticker="GOOG"
              name="Alphabet.A"
              chartColor="#18cccc"
              chartPath="M0 24 C8 22, 16 18, 24 20 C32 22, 40 14, 48 16 C56 18, 64 8, 72 10 C80 12, 84 4, 88 2"
              price="$1230.19"
              changePercent="3.4%"
              up={true}
            />

            {/* Row 2 - SPOT */}
            <StockRow
              icon={
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8333,
                    background: "#1ed760",
                    boxShadow: "0px 7px 8px rgba(0,0,0,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M3 6.5C7 5 11 5 15 6.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M4.5 10C7.5 9 10.5 9 13.5 10"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M6 13.5C8 12.8 10 12.8 12 13.5"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              }
              ticker="SPOT"
              name="Spotify Inc"
              chartColor="#18cccc"
              chartPath="M0 28 C10 26, 20 22, 30 20 C40 18, 50 24, 60 16 C70 8, 78 12, 88 4"
              price="$2342.89"
              changePercent="3.4%"
              up={true}
            />

            {/* Row 3 - AMZN */}
            <StockRow
              icon={
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#ff9900",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                    <path
                      d="M2 8C5 10 9 11 14 9"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 6L15 9L12 11"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              }
              ticker="AMZN"
              name="Amazon Inc"
              chartColor="#ff5000"
              chartPath="M0 4 C10 6, 20 10, 30 12 C40 14, 50 8, 60 16 C70 24, 78 20, 88 28"
              price="$340.23"
              changePercent="3.4%"
              up={false}
            />

            {/* Row 4 - SNAP */}
            <StockRow
              icon={
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "#fffc00",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M9 2C6 2 4 4 4 6C4 8 3 8.5 2 9C3 9.5 3.5 10 4 11C3 11.5 2.5 12 2 12.5C4 13 5 13 6 12.5C7 14 8 16 9 16C10 16 11 14 12 12.5C13 13 14 13 16 12.5C15.5 12 15 11.5 14 11C14.5 10 15 9.5 16 9C15 8.5 14 8 14 6C14 4 12 2 9 2Z"
                      fill="white"
                    />
                  </svg>
                </div>
              }
              ticker="SNAP"
              name="Snapchat Inc"
              chartColor="#ff5000"
              chartPath="M0 6 C10 8, 20 4, 30 10 C40 16, 50 12, 60 20 C70 28, 78 22, 88 26"
              price="$340.23"
              changePercent="3.4%"
              up={false}
              lastRow
            />

            {/* === Automations Section === */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 16px",
                height: 56,
                boxSizing: "border-box",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.80)",
                    letterSpacing: "-0.32px",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  Automations
                </p>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.40)",
                    letterSpacing: "-0.24px",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  You have 3 active
                </p>
              </div>
              {/* Plus circle button */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0px 4px 32px rgba(0,0,0,0.50)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 1v12M1 7h12"
                    stroke="rgba(255,255,255,0.60)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Automation Row 1 */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 16,
                padding: 16,
                alignItems: "center",
                borderBottom: "1px solid #060606",
                height: 72,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(0,194,255,0.13)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M10 2L6 10h4l-2 6 6-8h-4l2-6z"
                    fill="#00c2ff"
                  />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.80)",
                    letterSpacing: "-0.28px",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  Notify TSLA Sentiment
                </p>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.40)",
                    letterSpacing: "-0.24px",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  5 Action &middot; Public
                </p>
              </div>
              <span
                style={{
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.40)",
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 1000,
                  padding: "8px 12px",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                Active
              </span>
            </div>

            {/* Automation Row 2 */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 16,
                padding: 16,
                alignItems: "center",
                borderBottom: "1px solid #060606",
                height: 72,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(100,79,193,0.13)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M10 2L6 10h4l-2 6 6-8h-4l2-6z"
                    fill="#644fc1"
                  />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.80)",
                    letterSpacing: "-0.28px",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  Buy MSFT at Best
                </p>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.40)",
                    letterSpacing: "-0.24px",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  5 Action &middot; Public
                </p>
              </div>
              <span
                style={{
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.40)",
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 1000,
                  padding: "8px 12px",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                Active
              </span>
            </div>
          </div>

          {/* === Bottom Nav Bar (375x72) === */}
          <div
            style={{
              height: 72,
              padding: "8px 24px 24px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              boxSizing: "border-box",
              borderTop: "1px solid rgba(255,255,255,0.03)",
            }}
          >
            {/* Stocked pill */}
            <div
              style={{
                width: 116,
                height: 40,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 1000,
                boxShadow: "0px 4px 32px rgba(0,0,0,0.50)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxSizing: "border-box",
              }}
            >
              {/* Command icon */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 1C2.34 1 1 2.34 1 4s1.34 3 3 3h1V4c0-1.66-1.34-3-3-3zM12 1c1.66 0 3 1.34 3 3s-1.34 3-3 3h-1V4c0-1.66 1.34-3 3-3zM4 15c-1.66 0-3-1.34-3-3s1.34-3 3-3h1v3c0 1.66-1.34 3-3 3zM12 15c1.66 0 3-1.34 3-3s-1.34-3-3-3h-1v3c0 1.66 1.34 3 3 3z"
                  stroke="rgba(255,255,255,0.90)"
                  strokeWidth="1.2"
                  fill="none"
                />
                <rect x="5" y="5" width="6" height="6" rx="0.5" stroke="rgba(255,255,255,0.90)" strokeWidth="1.2" fill="none" />
              </svg>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: "rgba(255,255,255,0.90)",
                  letterSpacing: "-0.28px",
                  lineHeight: 1,
                }}
              >
                Stocked
              </span>
            </div>

            {/* Nav icons */}
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {/* Chart bars */}
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="3" y="10" width="3.5" height="9" rx="1" fill="rgba(255,255,255,0.40)" />
                <rect x="9.25" y="6" width="3.5" height="13" rx="1" fill="rgba(255,255,255,0.40)" />
                <rect x="15.5" y="3" width="3.5" height="16" rx="1" fill="rgba(255,255,255,0.40)" />
              </svg>
              {/* Circle with dot */}
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="8" stroke="rgba(255,255,255,0.40)" strokeWidth="1.5" />
                <circle cx="11" cy="11" r="3" fill="rgba(255,255,255,0.40)" />
              </svg>
              {/* Transfer arrows */}
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M5 8h12M14 5l3 3-3 3" stroke="rgba(255,255,255,0.60)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 14H5M8 11l-3 3 3 3" stroke="rgba(255,255,255,0.60)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {/* Profile/user */}
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="8" r="3.5" stroke="rgba(255,255,255,0.80)" strokeWidth="1.5" />
                <path d="M4 19c0-3 3.5-5.5 7-5.5s7 2.5 7 5.5" stroke="rgba(255,255,255,0.80)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Stock Row Component */
function StockRow({
  icon,
  ticker,
  name,
  chartColor,
  chartPath,
  price,
  changePercent,
  up,
  lastRow,
}: {
  icon: React.ReactNode;
  ticker: string;
  name: string;
  chartColor: string;
  chartPath: string;
  price: string;
  changePercent: string;
  up: boolean;
  lastRow?: boolean;
}) {
  const badgeBg = up ? "rgba(24,204,204,0.10)" : "rgba(255,80,0,0.10)";
  const accentColor = up ? "#18cccc" : "#ff5000";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 16,
        padding: 16,
        alignItems: "center",
        borderBottom: lastRow ? "none" : "1px solid #060606",
        height: 72,
        boxSizing: "border-box",
      }}
    >
      {/* Icon */}
      {icon}

      {/* Ticker + Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "rgba(255,255,255,0.80)",
            letterSpacing: "-0.28px",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {ticker}
        </p>
        <p
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: "rgba(255,255,255,0.40)",
            letterSpacing: "-0.24px",
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {name}
        </p>
      </div>

      {/* Mini chart (88x32) */}
      <svg
        width="88"
        height="32"
        viewBox="0 0 88 32"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        <path d={chartPath} stroke={chartColor} strokeWidth="1.5" fill="none" />
      </svg>

      {/* Price + Badge */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: "rgba(255,255,255,0.60)",
            letterSpacing: "-0.28px",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {price}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            marginTop: 2,
          }}
        >
          {/* Arrow icon */}
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: badgeBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              {up ? (
                <path d="M4 1L7 6H1L4 1Z" fill={accentColor} />
              ) : (
                <path d="M4 7L1 2h6L4 7Z" fill={accentColor} />
              )}
            </svg>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: accentColor,
              letterSpacing: "-0.24px",
            }}
          >
            {changePercent}
          </span>
        </div>
      </div>
    </div>
  );
}
