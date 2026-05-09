---
# =============================================================================
# Design tokens — Donovan Yohan portfolio
# Editorial, monochrome canvas with a single "highlighter marker" accent.
# Two themes (light + dark) that swap palette but keep structure identical.
# =============================================================================

meta:
  name: "Donovan Yohan Portfolio"
  voice: "Editorial, hand-crafted, motion-forward"
  default_theme: light
  theme_switch:
    trigger: prefers-color-scheme + manual toggle (Lottie sun/moon icon)
    transition: full-viewport wipe (1s ease-in-out fade through theme color)

color:
  # ---------------------------------------------------------------------------
  # Light theme — paper-white canvas, ink-black text, neon-yellow highlighter.
  # The whole palette is intentionally tiny: background, ink, accent, two grays.
  # ---------------------------------------------------------------------------
  light:
    background:           "#FFFFFF"   # page + nav surface
    ink:                  "#000000"   # primary text, logo, hovered links
    accent:               "#FFEF00"   # neon "highlighter" marker yellow
    muted:                "#757575"   # nav links, captions, secondary text
    border:               "#757575"   # 0.5px hairline borders on cards
    disabled:             "#EDEDED"   # disabled card "Contact me to learn more" pill
    overlay_inverse:      "#000000"   # dark transition wipe color when entering dark
    muted_alpha:          0.54        # opacity applied to muted UI (theme toggle)

  # ---------------------------------------------------------------------------
  # Dark theme — true-black canvas, paper-white ink, indigo "highlighter".
  # Yellow turns into a saturated violet so the marker reads as glowing UV.
  # ---------------------------------------------------------------------------
  dark:
    background:           "#000000"
    ink:                  "#FFFFFF"
    accent:               "#5A3EC8"   # indigo/violet highlighter
    muted:                "#BCBCBC"
    border:               "#505050"
    disabled:             "#505050"
    overlay_inverse:      "#FFFFFF"
    muted_alpha:          0.7

  # Project-card backdrop tints (each project card may declare its own hue;
  # the card image sits in grayscale by default and saturates on hover).
  project_tints:
    typeline:             "#1967FF"   # vivid web blue
    manulife:             "#00AB5B"   # corporate green
    flowr:                "#63C3AC"   # mint
    acting:               "#A6CE39"   # lime stage-light green
    paper:                "#FFFFFF"   # neutral / white-on-white photo plates

typography:
  fonts:
    display:
      family: "Open Sans"
      weights: [300, 400]  # loaded; 700-style uses browser-synthesized bold unless the font URL adds 700
      source: Google Fonts
      role: hero copy, body prose, headings, page titles
    ui:
      family: "Roboto"
      weights: [400, 700]
      source: Google Fonts
      role: navigation, breadcrumbs, button pills, ALL-CAPS micro-labels
    icon:
      family: "icomoon"
      source: self-hosted (eot/ttf/woff/svg)
      role: nav glyphs, social icons, arrow indicators

  scale:
    hero:
      size: 47px           # "Hi, I'm Donovan Yohan…" headline
      weight: 300
      line_height: 1.3em
      letter_spacing: -0.01em
      mobile_size: 8.3vw   # fluid below 450px
      tablet_size: 4.1717vw
    page_title:           # h1 used for "Nice to meet you!", "Work I've done."
      size: 47px
      line_height: 1.5
      mobile_size: 32px
      mobile_line_height: 1.5
    section_title:        # in-article h2
      size: 28px
      line_height: 1.8
      mobile_size: 24px
    article_subhead:      # h3 inside two-column blurb/list blocks
      size: 20px
    body:
      size: 16px
      line_height: 2
    article_body:
      size: 18px
      line_height: 2
      mobile_size: 18px
    card_title:
      size: 22px
      weight: 700
      line_height: 1.2
      mobile_size: 16px
    card_caption:
      size: 16px
      line_height: 24px
      mobile_size: 14px
      color: muted
    nav_link:
      size: 16px
      weight: 700
      letter_spacing: 0.1em
      transform: uppercase
      line_height: 19px
    breadcrumb_logo:
      size: 22px
      mobile_size: 14px
      transform: none
      letter_spacing: 0
    button_pill:
      size: 14px
      weight: 700
      letter_spacing: 0.1em
      transform: uppercase
      line_height: 1
    bottom_nav_label:
      size: 12px
      weight: 700
      letter_spacing: 0.1em
      transform: uppercase

spacing:
  unit: 8px                # everything snaps to 8s and its half (4)
  scale:
    xxs: 4px
    xs:  8px
    sm:  12px
    md:  16px
    lg:  24px
    xl:  32px
    xxl: 48px
    xxxl: 64px
    section_gap: 250px     # vertical offset that staggers project-card grid
  page:
    max_content_width: 1024px
    horizontal_padding_desktop: 40px
    horizontal_padding_mobile: 16px
    nav_inset_right: 16px
  article:
    image_top_margin_desktop: 48px
    image_top_margin_mobile: 24px
  card:
    padding: "8px 16px"
    pill_padding: "4px 12px 4px 16px"
    bottom_margin: 32px

layout:
  grid:
    type: flex
    columns: 2             # project + hobby cards on desktop
    column_width: 48%
    tablet_column_width: 49%
    mobile_columns: 1
    stagger: "every odd card translates -250px upward (desktop)"
  cards_aspect_ratio: "16 / 9 cropped to 50vw width on desktop, 100vw on mobile"
  navigation:
    top_nav_height: 62px
    top_nav_height_mobile: 56px
    bottom_nav_height_mobile: 56px
    sticky: true
    backdrop: solid background color (no blur, no shadow)
  breakpoints:
    desktop_min: 1025px
    hero_fluid_max: 1130px # hero text/logo scale fluidly before the mobile breakpoint
    mobile_max:  1024px    # bottom nav appears, breadcrumbs underline
    small_max:   767px     # h2/headerText shrink, article columns stack
    phone_max:   450px     # hero stacks vertically
    micro_max:   425px     # cards become full width

radius:
  none:    0px
  pill_button: 0px         # button pills are sharp rectangles (no rounding)
  card_desktop: 20px
  card_mobile:  8px
  avatar_circle: 50%       # about-page hero photo

border:
  hairline:
    width: 0.5px
    style: solid
    color: var(--border)   # maps to color.light.border / color.dark.border
    color_mobile: muted    # mobile cards use the brighter gray border
    hover_color: ink       # desktop card border darkens on hover

elevation:
  flat_default: true       # the base aesthetic is shadowless & paper-flat
  card_lift_3d:
    perspective: 1300px
    hover_scale: 1.022
    layered_parallax:
      offset_base: 10
      depth_multiplier: 1.66
      translation_factor: 0.225
      spring_factor: 0.075
    z_index_layers:
      base: 1
      hovered_card: 2
      mobile_pill: 5
      nav: 1000
      transition_overlay: 99999

motion:
  durations:
    micro:    100ms        # bottom-nav active state
    fast:     200ms        # icon hover, pill border
    base:     350ms        # default for hover, color, layout
    slow:     800ms        # theme toggle gradient/filter transition
    overlay:  1000ms       # full-screen theme-change wipe
  easings:
    standard: "cubic-bezier(0.51, 0.07, 0.09, 0.95)"   # signature "snap-then-settle"
    ease:     "ease"
    ease_in_out: "ease-in-out"
    ease_out: "ease-out"
    linear:   "linear"
  springs:
    card_tilt:
      mass: 9
      tension: 775
      friction: 65
      precision: 0.00001
      damper: 75
  keyframes:
    fade:
      from: { opacity: 0 }
      mid:  { opacity: 1, at: "35%-65%" }
      to:   { opacity: 0 }
      duration: 1s
      easing: ease-in-out
    fade_in:
      duration: 100ms
      delay: 100ms
      easing: linear
    highlighter_on:
      property: width
      from: 0%
      to: 100%

interaction:
  highlight_marker:
    description: |
      Bold links wear a highlighter pen. A 60% tall accent block grows from
      0% → 100% width behind the text on hover.
    height: 60%
    bottom_offset: 2px
    transition: "350ms cubic-bezier(0.51, 0.07, 0.09, 0.95)"
    static_variant: |
      For headings, the marker is permanent (no animation) — rendered as a
      linear-gradient with the highlight band between 10% and 60% of the
      vertical axis, framed by background color above and below.
    mobile_variant: |
      Below 1024px the marker is always-on (no hover required); the
      animation is replaced by a static gradient because there is no hover.

  card_hover:
    grayscale_to_color: "filter: grayscale(100%) -> 0% over 350ms"
    border_color_change: "muted -> ink"
    title_marker: appears under card title on hover
    learn_more_pill: slides up from below into bottom of image
    parallax: spring-driven 3D tilt with multi-layer image stack
    mobile_behavior: no parallax, pill always visible, color always on

  theme_toggle:
    icon: Lottie sun/moon (30x30) anchored to nav right edge
    behavior: |
      Hover plays the Lottie forward; un-hover reverses it.
      Click triggers full-viewport color wipe (background = target theme bg)
      that fades over 1s; data-theme swaps at 320ms during fade-in, matching
      the implementation timeout before the wipe reaches its opaque hold.

  link_text_link:
    description: |
      Inline body links keep a persistent non-color cue at rest: bold weight
      plus a native underline or always-on low-opacity marker underline. Hover
      enhances that cue with the shorter "marker block" overlay (200ms ease),
      never replacing the resting affordance.

components:
  nav_top:
    height: 62px
    background: background
    typography: Roboto bold uppercase
    items: [Logo, Breadcrumbs(/), Resume, Work, About, Contact, ThemeToggle]
    fixed: top
  nav_bottom_mobile:
    height: 56px
    fixed: bottom
    items_alignment: space-around
    icon_above_label: true
    label_size: 12px
  hero:
    layout: side-by-side (image | display copy)
    image_width: 420px (38–47% fluid on tablet, 66% centered on phone)
    text_offset: -24px logo top
  card_project:
    structure: [LayeredImageStack, LearnMorePill, Title, Caption(muted), Body]
    image_state_default: grayscale + filter, pill hidden below
    image_state_hover: full color, pill visible, 3D tilt
    disabled_variant:
      pill_background: disabled
      pill_label: "Contact me to learn more"
  article_hero:
    image_max_height: 400px (50vw on mobile)
    title_offset_top: 32px
    intro_grid: 2 columns (prose | metadata list; metadata ul flex-basis 75%)
    metadata_list_color: muted, weight bold, no bullets
  footer:
    title_style: large headline with static highlight
    layout: 2 columns (message | contact + social)
    social_icons: row of icomoon glyphs at "large" (36px) size
  page_transition_overlay:
    z_index: 99999
    coverage: 100vw x 100vh
    color: incoming theme background
    animation: fade keyframe 1s ease-in-out
  fouc_guard:
    description: solid theme-color div sits over the page until hydration

iconography:
  font: icomoon (self-hosted)
  sizes:
    small:  28px
    medium: 32px
    large:  36px
  treatment:
    default_color: ink
    muted_color: muted
    hover_color: accent (desktop only)
    transition: "350ms cubic-bezier(0.51, 0.07, 0.09, 0.95)"

imagery:
  treatment:
    project_card_default: 100% grayscale
    project_card_hover: full color
    photo_avatar: circular crop (about page)
    parallax_layers: |
      Each card image is a stack of PNG layers. On mouse-move the layers
      translate independently in 3D, with the topmost layer drifting the
      farthest, producing depth.
  formats: [png, jpg, webm (animated logos), lottie/json (animations)]

assets:
  fonts_loaded_via:
    - "https://fonts.googleapis.com/css?family=Open+Sans:300,400|Roboto:400,700&display=swap"
  custom_font_face:
    - family: icomoon
      formats: [eot, ttf, woff, svg]
      display: block
  resume_pdf: served from /DonovanYohanResume.pdf (opens new tab)

accessibility:
  prefers_color_scheme: respected on first paint
  link_underline: retained or replaced only by an equivalent persistent cue for inline body links; highlighter marker is hover/touch enhancement
  hover_only_affordances_disabled_below: 1024px (cards expose their pill always)
  mobile_secondary_nav: persistent bottom bar so primary actions remain reachable

---

# Donovan Yohan Portfolio — Look & Feel

## Identity in one sentence

A **black-and-white editorial canvas** stamped with a single bright
**highlighter marker** — yellow in daylight, electric indigo at night —
that turns every interactive thing on the page into a sentence the reader
just felt like underlining.

## The big idea: a paper notebook that reacts

The whole product behaves like a designer's working notebook. Pages are
either pure paper (white) or pure ink (black). Type is set in
**Open Sans Light** for poster-sized hero copy and prose, and in
**Roboto Bold ALL-CAPS** with wide tracking for navigation, breadcrumbs and
button pills — the way a designer labels a layer or a callout in a
deliverable. There are no panels, no cards-on-cards, no shadows, no
gradients-as-decoration. Everything sits flat on the paper until the cursor
arrives, and then exactly one thing animates: the highlighter.

## The highlighter mark

This is the entire personality of the brand. Chrome links can stay visually
quiet until hovered, but inline body links must carry a persistent affordance
at rest (bold weight plus underline or subtle marker). On hover, a 60%-tall
block of accent color then sweeps across the word from 0% to 100% width over
350ms on the signature easing curve
`cubic-bezier(0.51, 0.07, 0.09, 0.95)` — quick at first, settling into the
final position with the slightest decelerated overshoot, like a marker
landing on paper. Section headings (`Nice to meet you!`, `Work I've done.`,
`Contact or connect with me!`) are pre-marked: the mark is baked into the
heading as a static linear-gradient between 10% and 60% of vertical height,
so the page already looks "annotated" before the user does anything.

On screens narrower than the desktop breakpoint, the animated marker is
replaced by an always-on static one. There is no hover on touch, so the
brand asset stays visible — the brand is never gated behind an interaction
the device can't do.

## The two themes

Light and dark are not "color modes" so much as **the same notebook seen at
two times of day**. Light mode is paper white (`#FFFFFF`) with ink black
(`#000000`) text and a fluorescent-yellow highlighter (`#FFEF00`) — a
fresh, optimistic, almost giddy palette. Dark mode flips both surfaces and
swaps the marker for a deep saturated violet (`#5A3EC8`), which reads as a
**UV pen on black paper**. The grays shift accordingly: a softer
`#BCBCBC` for muted text in dark, the firmer `#757575` in light.

The theme transition itself is a piece of choreography: clicking the small
sun/moon Lottie in the top-right paints a full-viewport plane in the
*incoming* theme's background color, fades it from 0% → 100% → 0% over a
full second, and swaps the `data-theme` attribute at 320ms during the fade-in,
just before the wipe reaches its opaque hold. The new palette is therefore
hidden under the curtain before it lifts. A no-flash-of-unstyled-content
cover sits over the page on first paint, in the matching theme color, until
React hydrates.

## The card grid is the centerpiece

Project and hobby cards are 16:9 image plates, **0.5px hairline-bordered**,
**20px-rounded** on desktop and **8px-rounded** on mobile. By default the
plate is desaturated to **100% grayscale**; on hover it returns to full
color over 350ms while the border darkens from gray to ink and a yellow
"Learn More" pill slides up from below to fill the bottom of the plate.

Cards also tilt. Each card image is composed of **stacked PNG layers** —
foreground subject, mid, background — and on mousemove a `react-spring`
controller translates each layer independently in 3D, scaled by its index,
producing parallax depth. The card itself rotates and scales to **1.022×**
inside a `perspective(1300px)` viewport, with spring physics
(`mass 9, tension 775, friction 65`) that make the motion feel weighted but
crisp. Touch devices skip all of this; the pill is always present and the
plate is always in color.

The grid uses a **vertical stagger**: every odd card is translated upward
by 250px on desktop, producing a dynamic ragged-edge layout that breaks the
visual monotony of equal rows. On mobile this stagger collapses into a
single column.

## Typography hierarchy

There are essentially four sizes on the page:

1. **The 47-pixel display** — Open Sans Light, slightly negative-tracked,
   used for the homepage hero ("Hi, I'm Donovan Yohan…") and for every
   page-level h1. This is the voice of the site: friendly, calm, a little
   journalistic.
2. **The 28-pixel section** — used inside long-form work case studies for
   `<h2>` block headings.
3. **The 22-pixel card title** — Open Sans bold-styled, tightly leaded.
4. **The 16-pixel body** — Open Sans, line-height 2.0, deliberately airy.

The supporting **Roboto Bold uppercase** at 16px (nav), 14px (button pills),
and 12px (mobile bottom-nav) is the only place letters track wide
(`letter-spacing: 0.1em`). The juxtaposition of **light, generous Open Sans
prose** with **tight, technical, all-caps Roboto chrome** is the second-most
recognizable thing about the brand after the highlighter.

## Layout & rhythm

Everything is centered in a **1024-pixel max content column**, padded
**40px** on desktop and **16px** on mobile. Vertical rhythm snaps to an
**8-pixel base unit**, with frequent stops at 16, 24, 32, 48 and 64. The
nav is a fixed **62-pixel** bar on desktop, **56px** on mobile, and on
mobile a matching **56-pixel bottom navigation** appears so primary
destinations stay reachable with one thumb.

Article pages add a wide horizontal banner image at the top
(`max-height: 400px`, height fluid at 33vw), then drop straight into the
1024-column. The article hero intro keeps prose beside a metadata list whose
`ul` uses a 75% flex-basis; later two-column blurb-and-outcomes blocks use a
separate `55% / 45%` flex split, followed by full-bleed inline images.

## Motion language

Every interactive change uses one of three cadences:

- **350ms** for hover and color transitions, with the signature
  `cubic-bezier(0.51, 0.07, 0.09, 0.95)` curve. This easing is the
  invisible glue holding the brand together — it appears on the
  highlighter mark, the icon hover, the theme-toggle filter, and the card
  reveal.
- **800ms** for the theme toggle's color/filter morphs, so the change in
  palette feels like a setting rather than a click.
- **1000ms** for the full-viewport theme wipe, with a fade in/hold/fade-out
  envelope (0% → 35% → 65% → 100%).

There is also a **single Lottie animation** for the theme toggle — a small
sun that morphs into a moon, played forward on hover-in and reversed on
hover-out — and a **second Lottie** rendering the animated `dy` monogram on
the homepage hero.

## Iconography

All icons are drawn from a **custom self-hosted icomoon font**. They render
at 28 / 32 / 36 px (small / medium / large), inherit color from the current
text color, and on desktop pick up the highlighter accent color on hover.
There are no SVG illustrations in the chrome — only inside hero/lottie
artwork.

## Imagery

Photos are presented in two ways. **Project plates** are screenshots of
shipped work, shown as layered PNG stacks for the parallax effect. **Photo
content** (the about-page portrait, hobby cards) is full-color, treated
neutrally, sometimes circle-cropped (the avatar). The card grayscale-to-
color hover is the only filter the site applies to imagery.

## Voice

The copy is **first-person, conversational, slightly self-deprecating**:
"Hi, I'm Donovan Yohan", "Nice to meet you!", "Work I've done.",
"Contact or connect with me!", and even the placeholder README quip
"Please hire me." The visual system mirrors that voice: confident enough
to leave the page mostly empty, friendly enough to highlight what matters
in fluorescent yellow.

## What to keep sacred

If a future designer extends this system, the non-negotiables are:

1. **One accent color per theme.** Never introduce a second highlight hue.
2. **The highlighter marker is the only persistent decoration.** No
   shadows, no glassmorphism, no gradients used as background fills.
3. **Open Sans for words you read, Roboto Bold ALL-CAPS for things you
   click.** Don't mix the roles.
4. **350ms on the signature easing curve** for any hover affordance. Other
   durations are reserved for the theme machinery.
5. **Cards live on a 1024-px column, 0.5-px border, 16:9 plate, grayscale
   until invited.** This is the product's silhouette.
6. **Touch parity.** Whatever the desktop hover reveals must be visible by
   default on mobile — the brand cannot hide behind a cursor.
