/** The app's mark: a small bent path connecting three waypoints — the same
 * nodes-and-edges idea the roadmap canvas is built on, echoing the favicon
 * (src/app/icon.svg). Single-color/currentColor so it drops into any of the
 * existing icon badges the same way a lucide icon would. */
export function LinerLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 6v10h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="6" r="1.8" fill="currentColor" />
      <circle cx="7" cy="16" r="1.8" fill="currentColor" />
      <circle cx="17" cy="16" r="1.8" fill="currentColor" />
    </svg>
  );
}
