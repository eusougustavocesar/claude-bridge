export function BrandLogo({
  size = 20,
  showWord = true,
}: {
  size?: number;
  showWord?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 font-bold tracking-tight">
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        fill="none"
        aria-hidden
      >
        <circle cx="6" cy="16" r="3" fill="currentColor" />
        <circle cx="26" cy="16" r="3" fill="currentColor" />
        <path
          d="M9 16 H23"
          stroke="var(--brand)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {showWord ? (
        <span>
          claude<span style={{ color: "var(--brand)" }}>-</span>bridge
        </span>
      ) : null}
    </span>
  );
}
