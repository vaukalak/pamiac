---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/globals.css"]
---

# Home page (src/app/page.tsx)

Scope: the signed-out landing page only. Mode: Persuade. The rest of the app keeps its paper, ink, and teal world; the home page gets its own dark board world, scoped under one `.home` wrapper.

Audience: a person who keeps notes and UML diagrams and wants an agent to read and edit that library. Job: understand in one viewport what Pamiac is and open Sign in. Action: the header Sign in pill is the only control; the brief adds no buttons.

Proof: an authored preview of the workspace (sidebar, a small diagram of Notes, Diagrams, Shared context, AI agent, and a note card), three feature cards with the product's real capabilities, and no invented claims, customers, or numbers.

Constraints from the user: match the supplied reference image; do not add buttons; the circuit-board ground must be dimmer and calmer than the reference (a filter, a vignette, one accent); the neon board glow must be animated.

## Direction contract

THESIS: the product is a lit circuit board where notes, diagrams, and an agent share one trace network. The page refuses the neutral SaaS hero with two stacked buttons and a screenshot; the only action is the header Sign in, and the proof is the board itself, alive behind the copy.

OWN-WORLD: near-black green-tinted ground, dim olive traces with lime pads, one lime accent (#b9f542), off-white text, translucent dark panels with a 1px lime-tinted hairline and soft offset shadow. Geometric grotesk display at heavy weight and tight tracking (Outfit, already loaded). No gradient text, no glass decoration.

STORY: the visitor reads "a shared mind for you and your agents", sees the workspace preview with the agent wired into the same graph as notes and diagrams, reads three capabilities, and clicks Sign in.

FIRST VIEWPORT (1440): header with brand left and outlined Sign in right; two-column hero, copy left (eyebrow, four-line headline with "agents." in lime, one-sentence lede, no buttons), workspace preview window right, slightly rotated frame behind it; the circuit board fills the ground at reduced opacity with pulses running along traces; three feature cards sit at the fold. Footer line closes the page.

FORM: pinned by the user's reference image; no concept roll (precisely specified request). Seed: none (brief-pinned).

Signature interaction and motion grammar: lime pulses travel along the traces (normalized dash offset, linear, 7–14s, staggered negative delays), pads breathe on a slow ease-in-out; both stop under prefers-reduced-motion and leave a static lit board. Feature cards brighten their hairline on hover. No entrance animations.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
