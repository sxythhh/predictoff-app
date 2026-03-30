import Image from "next/image";

/*
 * FotMob Top Picks — 1:1 Figma clone
 * Composed from @2x Figma section exports with exact layout dimensions.
 * Layout: 1920px wide, 848px centered content, two columns (385 + 399, gap 64)
 */

const P = "/images/clone2";

export default function FotMobPage() {
  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", letterSpacing: "0em" }}>
      {/* Header — full 1920px width, 88px height */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Image
          src={`${P}/header.png`}
          alt="FotMob Header"
          width={3840}
          height={176}
          quality={100}
          priority
          style={{ width: 1920, height: 88, display: "block" }}
        />
      </div>

      {/* Two-column content — 848px centered, 64px gap */}
      <div
        style={{
          width: 848,
          margin: "0 auto",
          display: "flex",
          gap: 64,
          alignItems: "flex-start",
          paddingTop: 2,
        }}
      >
        {/* Left column — 385px */}
        <Image
          src={`${P}/left-col.png`}
          alt="Match predictions"
          width={770}
          height={3929}
          quality={100}
          style={{ width: 385, height: "auto", display: "block", flexShrink: 0 }}
        />

        {/* Right column — 399px */}
        <Image
          src={`${P}/right-col.png`}
          alt="Leagues and rules"
          width={799}
          height={3929}
          quality={100}
          style={{ width: 399, height: "auto", display: "block", flexShrink: 0 }}
        />
      </div>

      {/* Footer — full 1920px width, 383px height */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
        <Image
          src={`${P}/footer.png`}
          alt="FotMob Footer"
          width={3840}
          height={766}
          quality={100}
          style={{ width: 1920, height: 383, display: "block" }}
        />
      </div>
    </div>
  );
}
