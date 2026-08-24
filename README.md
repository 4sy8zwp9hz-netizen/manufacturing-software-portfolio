# Matthew Chung

## Manufacturing Software & Forward-Deployed Engineering Portfolio

Manufacturing, process, and quality engineer turned software builder, focused on
turning ambiguous factory problems into production applications, analytical
systems, and reliable engineering workflows. I did not begin with a platform
blueprint: each practical tool exposed the next constraint in data, usability,
performance, distribution, or support.

This portfolio is a clean-room account of four engineering stories. It describes
problems, architecture, tradeoffs, and evolution using generic terminology and
fictional examples. It contains no employer source code, database objects,
credentials, network details, production data, or confidential operating rules.

## 60-second overview

| Story | Engineering question | What it demonstrates |
|---|---|---|
| [Manufacturing Yield Platform](case-studies/YIELD.md) | How can engineers investigate yield from factory-level trends down to an individual wafer without repeatedly querying high-volume history? | Deep software, data, performance, and reliability engineering in a runnable synthetic application |
| [Grating Process Analytics](case-studies/GRATING_PROCESS_ANALYTICS.md) | How can fragmented process measurements become a defensible recommendation while preserving engineering judgment? | Physical-process expertise translated into data requirements and decision support |
| [Lean Digital Operations](case-studies/LEAN_DIGITAL_OPERATIONS.md) | How can live work queues and shift handoffs reduce information motion and waiting? | Workflow redesign, visual management, and safer standard work |
| [Manufacturing Application Platform](case-studies/MANUFACTURING_APPLICATION_PLATFORM.md) | How can useful local tools evolve into a supportable multi-application service? | Enterprise delivery, application integration, hosting, health, and recovery |

The [Manufacturing Yield Platform](https://github.com/4sy8zwp9hz-netizen/manufacturing-analytics-platform)
is the technical flagship. It is a runnable Dash/Plotly application backed by
reproducible synthetic semiconductor data and includes its own tests and
architecture documentation.

![Synthetic Yield Overview](assets/yield-summary.png)

*A verified screenshot from the public synthetic Yield application. No production
data or private interface is shown.*

## Project cards

### 1. Manufacturing Yield Platform

Multi-source manufacturing data is transformed with SQL-compatible access,
Python, and pandas into an interactive Yield investigation workflow. The important
story is its evolution under adoption and data volume—not simply its charts.

`SQL/pandas analysis → Dash application → shared use → performance optimization → server hosting → scheduled prepared data`

[View repository](https://github.com/4sy8zwp9hz-netizen/manufacturing-analytics-platform) ·
[Read engineering evolution](https://github.com/4sy8zwp9hz-netizen/manufacturing-analytics-platform/blob/main/docs/ENGINEERING_EVOLUTION.md) ·
[View architecture](https://github.com/4sy8zwp9hz-netizen/manufacturing-analytics-platform/blob/main/ARCHITECTURE.md)

### 2. Grating Process Analytics

A process-engineering project that began with a focused manufacturing question,
exposed the need for structured process history, and evolved into configurable
analysis and constrained recommendation support.

`Process question → focused ashing analysis → data gap → structured history requirements → broader analytics → reviewed recommendations`

[Read the case study](case-studies/GRATING_PROCESS_ANALYTICS.md)

### 3. Lean Digital Operations

Software applied as a Lean mechanism: Fab TV supports visual management and
production visibility; Passdown standardizes information across shift boundaries.

`Information waste → visible standard work → digital handoff → multi-user safety → sustained workflow`

[Read the case study](case-studies/LEAN_DIGITAL_OPERATIONS.md)

### 4. Manufacturing Application Platform

The delivery layer that became necessary as local engineering tools gained users:
versioned application bundles, a central portal, mounted WSGI applications,
production-style Windows hosting, health checks, and recovery tooling.

`Local engineering apps → repeatable delivery → shared portal → central server → health and recovery`

[Read the case study](case-studies/MANUFACTURING_APPLICATION_PLATFORM.md)

### Supporting engineering tools

Clean Room Request, SPC/process-step monitoring, WIP views, process-run history,
and equipment status show how small targeted tools can remove specific sources of
manufacturing friction without becoming artificial standalone flagships.

[Review supporting tools](case-studies/SUPPORTING_ENGINEERING_TOOLS.md)

## A connected engineering narrative

These projects are not four unrelated dashboards. They show an expanding scope of
ownership:

```mermaid
flowchart LR
    A[Answer one process question] --> B[Build reusable analysis]
    B --> C[Support operational decisions]
    C --> D[Deliver shared applications]
    D --> E[Engineer refresh, recovery, and support]
```

The recurring pattern is to begin with the manufacturing decision, identify the
minimum trustworthy data grain, make assumptions visible, and then evolve the
delivery mechanism when usage exposes the next bottleneck.

## Technical review path

1. Start with [Yield](case-studies/YIELD.md) for the deepest implementation story.
2. Read [Grating Process Analytics](case-studies/GRATING_PROCESS_ANALYTICS.md) for
   process modeling, repeated-event reconstruction, recommendations, and model
   diagnostics.
3. Read [Lean Digital Operations](case-studies/LEAN_DIGITAL_OPERATIONS.md) for
   work visibility, shift boundaries, duplicate-submit protection, and shared state.
4. Read [Manufacturing Application Platform](case-studies/MANUFACTURING_APPLICATION_PLATFORM.md)
   for WSGI composition, health checks, restart behavior, and deployment evolution.
5. Use the [portfolio inventory](docs/PORTFOLIO_INVENTORY.md) to see why each project
   received its public depth and what evidence was deliberately excluded.

## Engineering themes

- Python and pandas transformation around manufacturing data
- SQL Server-compatible access through a `pyodbc` boundary
- Dash/Plotly analytics and shared browser-based workflows
- configuration-driven process definitions and decision rules
- bounded caching, preload, background refresh, and last-known-good behavior
- Parquet snapshots where a verified workload benefits from precomputation
- targeted retrieval for high-volume detail
- process traceability across work orders, wafers, operations, tools, and results
- model diagnostics and human review before recommendations become decisions
- WSGI application composition, Waitress hosting, health checks, logging, and restart tooling
- tests around transformations, state transitions, data contracts, and integration seams

## Evidence and privacy

The private applications were inspected only to verify system boundaries,
chronology, and engineering decisions. Public material was then written from
scratch. Diagrams are conceptual reconstructions; identifiers are generic; any
example records are fictional. The screenshot policy and provenance are documented
in [SCREENSHOT_MAPPING.md](docs/SCREENSHOT_MAPPING.md).

## Repository map

```text
case-studies/   Four primary engineering narratives and supporting tools
docs/           Inventory, evidence boundaries, and screenshot provenance
assets/         Verified public synthetic visuals only
tools/          Dependency-free portfolio validation
.github/        Continuous validation on supported Python versions
```

## Local validation

The portfolio has no runtime dependency. Validate links, required case-study
sections, and public-safety rules with:

```bash
python tools/validate_portfolio.py
```

## License

Documentation and original diagrams are released under the [MIT License](LICENSE).
The linked Yield application has its own license and repository history.
