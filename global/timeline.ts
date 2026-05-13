/**
 * Seed data for the horizontally-scrolling about-page timeline.
 *
 * Order is NOW → past so the array can be iterated left-to-right by the
 * timeline component without sorting. Each entry is a single beat on the
 * timeline; media falls back to a roughjs-rendered sketch when no real
 * photo is wired up yet.
 */

export type SketchKey =
  | "star"
  | "cat"
  | "arrow"
  | "asterisk"
  | "frame"
  | "sparkle"
  | "heart"
  | "squiggle"
  | "diamond"
  | "spiral";

export type TimelineAccent =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "pink";

export interface TimelineMedia {
  kind: "img" | "sketch";
  /** Public path for `kind: "img"`. */
  src?: string;
  /** Sketch key for `kind: "sketch"` — drawn via roughjs at runtime. */
  sketch?: SketchKey;
  alt: string;
  width?: number;
  height?: number;
}

export interface TimelineEvent {
  id: string;
  /** Anchor year on the rail. */
  year: number;
  /** Optional month, 1-12. Used to sort within a year. */
  month?: number;
  /** Big stamp label (e.g. "NOW", "START"). Falls back to year. */
  stamp?: string;
  title: string;
  /** One-paragraph body. Crimson Pro at runtime. */
  body: string;
  media: TimelineMedia;
  accent?: TimelineAccent;
  /** Small drawn-on doodles tucked around the card. */
  decorations?: SketchKey[];
}

export const timeline: TimelineEvent[] = [
  {
    id: "now-climbing",
    year: 2026,
    stamp: "NOW",
    title: "Bouldering most weekends",
    body:
      "Climbing has become my reset button — three sessions a week at the local gym, mostly V3-V5 problems. Same draw as parkour: read the wall, commit, fall, try again. The plushies on the desk are unrelated. Or maybe they aren't.",
    media: { kind: "img", src: "/img/photos/parkour.png", alt: "Bouldering wall" },
    accent: "pink",
    decorations: ["heart", "star"],
  },
  {
    id: "2025-pc",
    year: 2025,
    title: "Built the desk rig",
    body:
      "Custom water loop, vertical-mount GPU, distro plate behind a panoramic glass case. First time soldering my own fan controller. The point was to have a project I could touch.",
    media: { kind: "sketch", sketch: "diamond", alt: "PC build sketch" },
    accent: "blue",
    decorations: ["sparkle"],
  },
  {
    id: "2024-boardgames",
    year: 2024,
    title: "Heavy euros + the Arcs evangelism arc",
    body:
      "Started running a weekly board game night. Arcs, Spirit Island, Brass Birmingham. Turns out hosting is the hobby; the games are just the structure.",
    media: { kind: "sketch", sketch: "frame", alt: "Stack of board game boxes" },
    accent: "orange",
  },
  {
    id: "2022-extend",
    year: 2022,
    month: 8,
    title: "Joined Extend",
    body:
      "Picked up senior full-stack work on the merchant-facing app — claims flows, embedded checkout, internal tooling. Where most of my React miles have come from since.",
    media: { kind: "sketch", sketch: "arrow", alt: "Extend wordmark" },
    accent: "green",
  },
  {
    id: "2022-cwi",
    year: 2022,
    month: 4,
    title: "Candywebkin Invitational",
    body:
      "Ran a niche, costume-mandatory tournament for the rhythm game I still play. Built the bracket app, the branding, the trophies. Hosted 32 people who all dressed up. Worth it.",
    media: { kind: "sketch", sketch: "sparkle", alt: "Candywebkin event mark" },
    accent: "red",
    decorations: ["star", "asterisk"],
  },
  {
    id: "2021-firepoi",
    year: 2021,
    title: "Fire poi",
    body:
      "Picked up flow arts during lockdown. Started with socks, graduated to LEDs, eventually got over the fear and lit the wicks. Spinning fire on a dark field rewires what 'tired' means.",
    media: { kind: "sketch", sketch: "spiral", alt: "Fire poi performer" },
    accent: "orange",
    decorations: ["sparkle"],
  },
  {
    id: "2020-origami",
    year: 2020,
    title: "Modular origami spiral",
    body:
      "Lockdown hobby that stuck. Cranes are the gateway — the real obsession is modular kusudama. I keep an emergency fold-pack in my bag for boring meetings.",
    media: { kind: "img", src: "/img/photos/origami.jpg", alt: "Folded paper cranes" },
    accent: "purple",
  },
  {
    id: "2019-tea",
    year: 2019,
    title: "A lot of different teas",
    body:
      "Coffee never landed. Tea did — hard. House at one point held 38 loose-leaf varieties on a labeled shelf. Friends got the gaiwan-and-fairness-cup intro tour. Still my preferred way to slow down a morning.",
    media: { kind: "sketch", sketch: "squiggle", alt: "Tea brands collection" },
    accent: "yellow",
  },
  {
    id: "2018-parkour",
    year: 2018,
    title: "Waterloo Parkour",
    body:
      "Started coaching Saturday mornings at the campus gym. Same hobby I'd been doing in parking lots since high school, only now with mats and a class of beginners. Best teaching reps I've ever had.",
    media: { kind: "img", src: "/img/photos/parkour.png", alt: "Parkour gym" },
    accent: "blue",
    decorations: ["arrow"],
  },
  {
    id: "2018-breaking",
    year: 2018,
    month: 9,
    title: "First breaking class",
    body:
      "Joined the campus crew because I owed myself one hobby that scared me. Six-step, baby freezes, a windmill that mostly worked. Still can't flare.",
    media: { kind: "sketch", sketch: "asterisk", alt: "Breakdance freeze pose" },
    accent: "purple",
  },
  {
    id: "2017-dj",
    year: 2017,
    title: "DJing house parties",
    body:
      "Bought a controller off Kijiji, learned to beatmatch on YouTube, played one Levi's pop-up that I still think about. Mixing is parkour for music — read the room, commit, recover when it doesn't land.",
    media: { kind: "sketch", sketch: "squiggle", alt: "DJ controller" },
    accent: "blue",
    decorations: ["star"],
  },
  {
    id: "2016-firstdev",
    year: 2016,
    title: "First dev job",
    body:
      "Tim Hortons co-op, writing React Native for the mobile app the year it shipped. Picked the entire stack up in the first three weeks and never went back to wanting to be anything else.",
    media: { kind: "sketch", sketch: "diamond", alt: "Tim Hortons + React" },
    accent: "red",
  },
  {
    id: "2014-minecraft",
    year: 2014,
    title: "Solo Survival #52",
    body:
      "Ran a 52-week solo survival series on YouTube. Nobody watched. Edited every episode myself in Sony Vegas. First time I learned a creative project is its own reward.",
    media: { kind: "sketch", sketch: "frame", alt: "Minecraft survival series" },
    accent: "green",
    decorations: ["asterisk"],
  },
  {
    id: "2013-ib",
    year: 2013,
    title: "IB + a Gurren Lagann phase",
    body:
      "International Baccalaureate ate two years of my life. Survived on shōnen anime and rhythm games. The ambition-to-spreadsheet ratio I learned in that program still shapes how I plan work.",
    media: { kind: "sketch", sketch: "star", alt: "IB diploma + anime" },
    accent: "yellow",
  },
  {
    id: "2012-shakespearience",
    year: 2012,
    title: "Shakespearience",
    body:
      "Toured high schools performing condensed Shakespeare in modern dress. Played a very enthusiastic Mercutio. Learned that 'commit harder' is the answer to every acting problem and most other ones too.",
    media: { kind: "img", src: "/img/photos/acting.png", alt: "Shakespearience cast photo" },
    accent: "green",
  },
  {
    id: "2010-rhythm",
    year: 2010,
    title: "Rhythm games",
    body:
      "Stepmania at 3am on a foam pad. osu! through math class. The first hobby I ever got actually good at — top 1% on a song I still can't talk about in public.",
    media: { kind: "sketch", sketch: "sparkle", alt: "Rhythm game playfield" },
    accent: "pink",
    decorations: ["star", "star"],
  },
  {
    id: "2008-runescape",
    year: 2008,
    title: "RuneScape",
    body:
      "First MMO. First economy. First time I lost a week of school holidays to a grindy skill. Also the first time I built a spreadsheet for fun — to optimize fishing XP per hour.",
    media: { kind: "sketch", sketch: "asterisk", alt: "RuneScape" },
    accent: "yellow",
  },
  {
    id: "2006-start",
    year: 2006,
    stamp: "START",
    title: "Dad's broken laptops",
    body:
      "First 'builds'. Dad would bring home broken laptops from work and I'd pull parts out of one to put into another. None of them booted at first. A few eventually did. That was the loop that hooked me.",
    media: { kind: "sketch", sketch: "frame", alt: "Laptop being parted out" },
    accent: "red",
    decorations: ["arrow", "sparkle"],
  },
];
