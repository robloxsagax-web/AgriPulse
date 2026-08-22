import { cn } from "@/lib/utils";

/**
 * AgriPulse mark: a planet with a live pulse running through its equator —
 * real-time planetary monitoring for next-gen farming. Renders in
 * currentColor so it follows the brand token layer.
 */
export function AgriPulseLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 512 512"
            fill="none"
            className={cn("shrink-0", className)}
            aria-hidden="true"
        >
            <g stroke="currentColor" strokeWidth="30" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="256" cy="256" r="138" />
                <ellipse cx="256" cy="256" rx="60" ry="138" />
                <ellipse cx="256" cy="256" rx="196" ry="80" transform="rotate(-24 256 256)" />
            </g>
            <path
                d="M112 256 L162 256 L189 208 L219 304 L246 256 L395 256"
                stroke="currentColor"
                strokeWidth="46"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <g transform="translate(348, 80) scale(2.2) rotate(30)">
                <path
                    d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
                    fill="currentColor"
                    stroke="none"
                />
            </g>
        </svg>
    );
}
