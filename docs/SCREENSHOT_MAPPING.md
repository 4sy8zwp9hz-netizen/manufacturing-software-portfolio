# Screenshot Mapping

Application screenshots must come from runnable public synthetic applications.
Scientific illustrations may explain verified engineering concepts when their data
and geometry are fictional, their source is reproducible, and they are labeled
inside the image and in surrounding text. Illustrations are not application
screenshots. Private screenshots and reconstructed private interfaces are excluded.

The linked investigations preview shows only the already-public report landing page.
Those external studies identify their data as anonymized observations rather than synthetic
examples. The preview does not reproduce the reports' underlying evidence tables or charts.

| Asset | Source | Data | Purpose | Status |
|---|---|---|---|---|
| `assets/yield-summary.png` | Public `manufacturing-analytics-platform` landing/yield overview | Reproducible synthetic semiconductor dataset | Shows the visual quality and investigation entry point of the runnable flagship | Verified |
| `assets/investigations-preview.png` | Public `webpage_presentation_example` landing page | Public study descriptions; linked reports use anonymized observed data | Provides a visual entry point to the two investigations | Browser-captured, visually reviewed |
| `assets/linked-wafer-maps.png` / `.svg` | `tools/render_quality_visuals.cjs` | Fictional grid, values, and selected chips | Explains shared physical-chip context and alignment validation | Illustrative, visually reviewed |
| `assets/wafer-comparison.png` / `.svg` | `tools/render_quality_visuals.cjs` | Deterministic fictional wafer rates | Explains means, wafer populations, and date context | Illustrative, visually reviewed |
| `assets/qualification-investigation.png` / `.svg` | `tools/render_qualification_visual.cjs` | Independently invented cohort counts and within-run position summaries | Explains completion context, endpoint choice, and shared-run comparison without reconstructing a private interface | Illustrative, visually reviewed |
| `assets/qualification-studio-demo.png` | Runnable public `demos/qualification-studio/dist` application | Deterministic fictional wafers, process intervals, device readings, and outcomes | Shows the working demo visitors can open from the portfolio | Browser-verified, visually reviewed |

## Reproduce the illustrations

Use Node.js with the `sharp` package available in its module search path, then run
`node tools/render_quality_visuals.cjs`. The script writes SVG and 1600-by-900 PNG
assets. It reads no external data and makes no inferential statistical claims.
For the qualification illustration, run `node tools/render_qualification_visual.cjs` with the same dependency.
`sharp` is optional tooling for these figures; portfolio validation needs only Python.

## Intentionally diagram-only stories

Grating Process Analytics, Lean Digital Operations, and the Manufacturing
Application Platform currently use Mermaid diagrams rather than screenshots. This
keeps the evidence boundary clear: the diagrams explain architecture and workflow
without implying that a public clone duplicates a private interface.

If a future public synthetic analogue is implemented, its screenshot can be added
only after the app is run locally and the image is checked for fictional data,
generic labels, and correspondence with the documented public code.

## Reproduce the application screenshot

Serve `demos/qualification-studio/dist` with a static HTTP server and capture the initial Conclusions view after it loads. The demo has no build dependencies or production connections. Enable reduced motion when capturing a switched view so the image does not freeze partway through a transition.
