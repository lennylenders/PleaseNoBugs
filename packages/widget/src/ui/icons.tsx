/**
 * Every glyph the widget draws, inline. Assets would mean a URL to resolve
 * from inside somebody else's app, which is one more thing to break; these
 * take `currentColor` and need nothing.
 */

type P = { size?: number };

const svg = (size: number, children: preact.ComponentChildren, fill = false) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill ? 'currentColor' : 'none'}
    stroke={fill ? 'none' : 'currentColor'}
    stroke-width="2.25"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const Back = ({ size = 22 }: P) => svg(size, <path d="M15 5l-7 7 7 7" />);
export const Close = ({ size = 22 }: P) => svg(size, <path d="M6 6l12 12M18 6L6 18" />);
export const Plus = ({ size = 20 }: P) => svg(size, <path d="M12 5v14M5 12h14" />);
export const Trash = ({ size = 18 }: P) =>
  svg(size, <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5" />);

/** The upvote caret: six points, and it takes the button's colour in both states. */
export const Caret = ({ size = 14 }: P) =>
  svg(size, <path d="M12 6.5l7.2 9a1 1 0 0 1-.78 1.6H5.58a1 1 0 0 1-.78-1.6L12 6.5z" />, true);

/** A speech bubble with a beetle's worth of meaning: the floating button. */
export const Bubble = ({ size = 20 }: P) =>
  svg(size, <path d="M4 5.5h16v10H9l-5 4v-14z" />);

// The five chip glyphs, drawn white on a coloured disc (see `.badge__dot`).
export const Bug = ({ size = 12 }: P) =>
  svg(size, <path d="M8 9h8v5a4 4 0 0 1-8 0V9zM9.5 9a2.5 2.5 0 0 1 5 0M4 12h4M16 12h4M5 7l3 2M19 7l-3 2M5 18l3-2M19 18l-3-2" />);
export const Idea = ({ size = 12 }: P) =>
  svg(size, <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z" />);
export const Planned = ({ size = 12 }: P) =>
  svg(size, <path d="M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />);
export const Done = ({ size = 12 }: P) => svg(size, <path d="M5 12.5l4.5 4.5L19 7.5" />);
export const Declined = ({ size = 12 }: P) => svg(size, <path d="M7 7l10 10M17 7L7 17" />);
