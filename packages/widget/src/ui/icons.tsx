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

/**
 * The floating button's glyph: two speech marks pointing at each other, one
 * thing said and one answered. From the owner's Figma design, path for path.
 */
export const Feedback = ({ size = 24 }: P) =>
  svg(
    size,
    <path d="M12 6C12 5.45 11.55 5 11 5H5.815L6.48 1.825c.015-.075.025-.155.025-.235 0-.31-.125-.59-.33-.795L5.38 0 .44 4.94C.17 5.21 0 5.585 0 6v6.5c0 .83.67 1.5 1.5 1.5h6.75c.62 0 1.155-.375 1.38-.915l2.265-5.29c.065-.17.105-.35.105-.545V6zm10.5 4h-6.75c-.62 0-1.155.375-1.38.915l-2.265 5.29c-.065.17-.105.35-.105.545V18c0 .55.45 1 1 1h5.185l-.665 3.175c-.015.075-.025.155-.025.235 0 .31.125.59.33.795L18.62 24l4.94-4.94c.27-.27.44-.645.44-1.06v-6.5c0-.83-.67-1.5-1.5-1.5z" />,
    true,
  );

/**
 * The three kind glyphs, from the owner's Figma design (the "Feedback icons"
 * on the tiles), path for path: a mark of alarm, a sprout, a star. The paths
 * keep Figma's own coordinates, so each takes the box they sit in as viewBox.
 */
const glyph = (size: number, box: string, d: string) => (
  <svg width={size} height={size} viewBox={box} fill="currentColor" aria-hidden="true">
    <path d={d} />
  </svg>
);

// Drawn white on a coloured disc on the board (see `.badge__dot`), and on
// the painted tiles. At 10px in a badge, as in the design.
export const Bug = ({ size = 10 }: P) =>
  glyph(
    size,
    '32 24 28 28',
    'M46.5 24C47.9547 24 49.125 25.1703 49.125 26.625V38.875C49.125 40.3297 47.9547 41.5 46.5 41.5C45.0453 41.5 43.875 40.3297 43.875 38.875V26.625C43.875 25.1703 45.0453 24 46.5 24ZM43 48.5C43 47.5717 43.3687 46.6815 44.0251 46.0251C44.6815 45.3687 45.5717 45 46.5 45C47.4283 45 48.3185 45.3687 48.9749 46.0251C49.6313 46.6815 50 47.5717 50 48.5C50 49.4283 49.6313 50.3185 48.9749 50.9749C48.3185 51.6313 47.4283 52 46.5 52C45.5717 52 44.6815 51.6313 44.0251 50.9749C43.3687 50.3185 43 49.4283 43 48.5Z',
  );
export const Idea = ({ size = 10 }: P) =>
  glyph(
    size,
    '32 24 27.18 27.18',
    'M59.182 31.1652V34.6498C59.182 35.8396 58.9535 37.0177 58.5095 38.117C58.0656 39.2162 57.4149 40.2149 56.5947 41.0562C55.7744 41.8975 54.8006 42.5649 53.7289 43.0202C52.6572 43.4755 51.5085 43.7098 50.3485 43.7098H46.951V50.6791H44.233V40.9222L44.2588 39.5283C44.4299 37.2528 45.4321 35.1274 47.065 33.5769C48.6979 32.0264 50.8412 31.1651 53.0665 31.1652H59.182ZM37.438 25.5898C39.4348 25.59 41.3811 26.2343 43.0012 27.4315C44.6214 28.6287 45.8334 30.3181 46.4658 32.2608C45.4259 33.1646 44.5739 34.2738 43.9605 35.5224C43.3472 36.7709 42.9851 38.1333 42.8957 39.5283H41.515C38.9919 39.5283 36.5723 38.5003 34.7882 36.6706C33.0042 34.8408 32.002 32.3591 32.002 29.7714V25.5898H37.438Z',
  );
export const Review = ({ size = 10 }: P) =>
  glyph(
    size,
    '32 24 27.188 27.188',
    'M53.8936 40.0933C53.547 40.4266 53.387 40.9186 53.4683 41.3866L54.6536 47.9466C54.7483 48.5066 54.5216 49.0653 54.0536 49.3866C53.6003 49.7199 53.0003 49.7599 52.4936 49.4933L46.5883 46.4133C46.3736 46.3066 46.147 46.2386 45.9216 46.2386H45.5603C45.427 46.2519 45.3083 46.3066 45.2003 46.3586L39.2936 49.4533C39.0003 49.5999 38.667 49.6533 38.347 49.5999C37.547 49.4399 37.0283 48.6919 37.1603 47.9053L38.347 41.3453C38.427 40.8666 38.267 40.3866 37.9216 40.0399L33.107 35.3733C32.707 34.9733 32.5603 34.3986 32.7483 33.8666C32.9216 33.3453 33.3736 32.9586 33.9336 32.8666L40.5603 31.9053C41.067 31.8519 41.507 31.5466 41.7336 31.0933L44.6536 25.1066C44.7203 24.9733 44.8136 24.8519 44.9216 24.7466L45.0403 24.6533C45.0936 24.5853 45.1736 24.5333 45.255 24.4799L45.4003 24.4266L45.627 24.3333H46.1883C46.695 24.3866 47.135 24.6919 47.3616 25.1319L50.3203 31.0933C50.5336 31.5333 50.947 31.8266 51.427 31.9053L58.0536 32.8666C58.6136 32.9466 59.0816 33.3333 59.267 33.8666C59.4403 34.3986 59.2936 34.9866 58.8803 35.3733L53.8936 40.0933Z',
  );

/** A star you can fill: the review picker and the stars on a card. */
export const Star = ({ size = 16, filled = false }: P & { filled?: boolean }) =>
  svg(size, <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" />, filled);

/** A picture: adding a screenshot, and the owner's sign that one came along. */
export const Image = ({ size = 20 }: P) =>
  svg(size, <path d="M4 5.5h16v13H4zM4 15.5l4.5-4.5 4 4 2.5-2.5 5 5M15.5 9.5h.01" />);

/**
 * The three status glyphs, from the same design: a clock, a tick and a cross.
 * The tick and the cross are lines in a 12px box, the clock a shape in 10.
 */
const line = (size: number, box: string, d: string, width: number) => (
  <svg
    width={size}
    height={size}
    viewBox={box}
    fill="none"
    stroke="currentColor"
    stroke-width={width}
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

export const Planned = ({ size = 10 }: P) =>
  glyph(
    size,
    '0 0 10 10',
    'M5 0C4.01109 0 3.0444 0.293245 2.22215 0.842652C1.3999 1.39206 0.759043 2.17295 0.380605 3.08658C0.00216642 4.00021 -0.0968502 5.00555 0.0960758 5.97545C0.289002 6.94536 0.765206 7.83627 1.46447 8.53553C2.16373 9.23479 3.05465 9.711 4.02455 9.90392C4.99445 10.0969 5.99979 9.99783 6.91342 9.6194C7.82705 9.24096 8.60794 8.60009 9.15735 7.77785C9.70676 6.9556 10 5.98891 10 5C9.9986 3.67435 9.47137 2.40339 8.53399 1.46601C7.59661 0.528633 6.32565 0.00139991 5 0ZM7.69231 5.38461H5C4.89799 5.38461 4.80017 5.34409 4.72804 5.27196C4.65591 5.19983 4.61539 5.10201 4.61539 5V2.30769C4.61539 2.20569 4.65591 2.10786 4.72804 2.03573C4.80017 1.9636 4.89799 1.92308 5 1.92308C5.10201 1.92308 5.19984 1.9636 5.27197 2.03573C5.34409 2.10786 5.38462 2.20569 5.38462 2.30769V4.61538H7.69231C7.79431 4.61538 7.89214 4.65591 7.96427 4.72803C8.0364 4.80016 8.07692 4.89799 8.07692 5C8.07692 5.10201 8.0364 5.19983 7.96427 5.27196C7.89214 5.34409 7.79431 5.38461 7.69231 5.38461Z',
  );
/** Also the big tick on "Feedback sent!". */
export const Done = ({ size = 12 }: P) =>
  line(size, '-0.2 -1.8 12 12', 'M0.803574 4.3749L4.01786 7.58918L10.8036 0.803467', 1.607);
export const Declined = ({ size = 12 }: P) =>
  line(size, '-1.7125 -1.7125 12 12', 'M0.787506 0.787598L7.78751 7.7876M7.78751 0.787598L0.787506 7.7876', 1.575);
