# Engineering Workspace Demo

[Try Stat Tools](https://engineering-workspace-demo.holykungfu.chatgpt.site/#stats) · [Explore wafer maps](https://engineering-workspace-demo.holykungfu.chatgpt.site/#maps) · [Explore process response](https://engineering-workspace-demo.holykungfu.chatgpt.site/#process)

Three small, runnable examples behind the Manufacturing Application Platform previews:

- **Stat Tools:** choose a process step, equipment, and dates; compare wafer measurements and their date context. Measured and missing counts remain explicit.
- **Linked wafer maps:** select a chip in either inspection or electrical evidence and follow that same fictional position in both views.
- **Process response:** explore paired upstream/downstream observations, trace a wafer-cycle, and temporarily exclude or restore observations in a descriptive fit.

These workflows illustrate verified engineering capabilities using a new public interface
and independently invented data. They do not reproduce a private interface or source code.
This is a browser-only demonstration, not the production Python applications, database
query layer, or hosted platform. Its code has no database access, accounts, uploads,
telemetry, external assets, or backend requests. Filters select from bundled fictional
records; selections and exclusions stay in the current browser tab and are not sent to a server.

The hosted demo serves the same four static files in `dist/`. Hosting is deployed
separately; a GitHub push alone does not update the live demo.

## Run and test

No dependencies or build step are needed. From this directory:

```sh
python -m http.server 8769 --bind 127.0.0.1 --directory dist
node --test tests/*.test.mjs
```

Open `http://127.0.0.1:8769/#stats`. Navigation also exposes `#maps` and `#process`.
Reload the page to restore defaults; selections and exclusions are held in memory only.

`dist/model.mjs` defines the deterministic fixtures and calculations. `dist/app.mjs`
renders the three workflows with native controls and SVG charts. The tests cover
population filters, missing values, sample standard deviation, coordinate identity,
repeated cycles, descriptive regression, immutable fixtures, and publication boundaries.
The page's Content Security Policy blocks backend connections and form submissions.

## Interpret the examples

The fixture contains 72 fictional wafer outcomes, 149 fictional chip positions, and
60 process cycles across 48 fictional wafers. These counts describe only this demo.
Measurements use arbitrary relative units, not production limits or recipes.
Missing readings are not passing results. Equipment differences and descriptive fits
are prompts for investigation, not causal findings or approved process changes.

## Reproduce the portfolio previews

Open each route in a fresh page with its default selections and capture the complete
page, keeping the fictional-data label and footer visible:

| Route | Asset | Default selection |
|---|---|---|
| `#stats` | [Stat Tools](../../assets/platform-stat-tools.jpg) | Process A, all equipment, January 1–February 28, 2026 |
| `#maps` | [Wafer maps](../../assets/platform-wafer-maps.jpg) | Chip x=3, y=1 in both maps |
| `#process` | [Process response](../../assets/platform-process-response.jpg) | Tool A, first cycle selected, no exclusions |

The images are browser captures of these runnable views—not illustrations presented
as production screenshots. See the [platform case study](../../case-studies/MANUFACTURING_APPLICATION_PLATFORM.md#engineering-tools-in-practice).
