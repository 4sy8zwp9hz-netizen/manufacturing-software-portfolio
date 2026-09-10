# Matthew Chung

## Manufacturing Software & Forward-Deployed Engineering

I build software for manufacturing environments where the problem is rarely just "make a dashboard." My work starts with an operational or engineering need, then moves across data modeling, Python/SQL development, workflow design, deployment, performance, and support until the result is something other engineers can reliably use.

My background spans semiconductor manufacturing, process engineering, quality, and technical program leadership. That domain experience shapes how I build software: define the physical or operational problem first, make the data grain and assumptions explicit, and design the application around the decision the user needs to make.

This portfolio highlights several systems I designed and implemented, with confidential production details replaced by generic terminology, synthetic data, and clean-room examples.

## Selected work

| Project | What I built | What it demonstrates |
|---|---|---|
| [Manufacturing Yield Platform](case-studies/YIELD.md) | A multi-level yield investigation system that moves from factory trends to wafer-level and defect-level evidence while controlling data volume and refresh cost | Python/SQL architecture, analytical data modeling, performance optimization, caching, drill-down design, reliability, and production delivery |
| [Grating Process Analytics](case-studies/GRATING_PROCESS_ANALYTICS.md) | A process analytics and recommendation workflow that reconstructs wafer process history, connects upstream inputs to downstream responses, and presents model diagnostics for engineering review | Process engineering, event reconstruction, data requirements, statistical modeling, human-in-the-loop decision support, and manufacturing systems integration |
| [Lean Digital Operations](case-studies/LEAN_DIGITAL_OPERATIONS.md) | Shared production-visibility and shift-handoff tools that replace repeated manual status reconstruction with prepared operational state and controlled workflow transitions | Lean workflow redesign, configuration-driven applications, background refresh, session state, transactional actions, and operational reliability |
| [Manufacturing Application Platform](case-studies/MANUFACTURING_APPLICATION_PLATFORM.md) | The internal hosting and delivery layer that moved engineering tools from local scripts and desktop packages to centrally hosted browser applications | Forward-deployed engineering, WSGI integration, Windows hosting, server deployment, network/database coordination, health checks, logging, restart behavior, and supportability |

## Flagship project: Manufacturing Yield Platform

The [Manufacturing Yield Platform](https://github.com/4sy8zwp9hz-netizen/manufacturing-analytics-platform) is the deepest public implementation in this portfolio. It is a runnable Dash/Plotly application backed by reproducible synthetic semiconductor data, with tests and architecture documentation included.

The system is designed around a common manufacturing problem: engineers need fast high-level yield visibility, but root-cause work eventually requires detailed wafer, inspection, and test records. Loading everything all the time is slow; aggregating everything in advance removes the detail needed for investigation. The architecture separates prepared shared facts from targeted drill-down data so the common path stays responsive while detailed evidence remains available when needed.

![Synthetic Yield Overview](assets/yield-summary.png)

*Screenshot from the public synthetic Yield application. No production data or private interface is shown.*

[View the application repository](https://github.com/4sy8zwp9hz-netizen/manufacturing-analytics-platform) · [Read the Yield case study](case-studies/YIELD.md) · [View architecture](https://github.com/4sy8zwp9hz-netizen/manufacturing-analytics-platform/blob/main/ARCHITECTURE.md)

## How the projects connect

These projects show a progression from solving individual engineering problems to owning the infrastructure required to support shared manufacturing software.

```mermaid
flowchart LR
    A[Ambiguous manufacturing problem] --> B[Engineering analysis]
    B --> C[Reusable application]
    C --> D[Shared operational workflow]
    D --> E[Central hosting and support]
```

A typical project starts with a process or operations question, then expands as real usage exposes the next constraint: missing data relationships, slow queries, repeated manual work, multi-user state, deployment friction, or recovery after failure. I have worked across each of those layers rather than treating them as separate problems.

## Project highlights

### Manufacturing Yield Platform

I built a Python and SQL-based investigation workflow that combines multiple manufacturing grains into explicit yield populations, then supports trend, Pareto, wafer-level, and parameter-level drill-down. The user workflow remained intentionally recognizable while the backend progressed through scoped queries, shared snapshots, workload-specific preloads, scheduled and incremental ETL, version-aware cache rebuilding, targeted detail retrieval, and last-known-good publication.

Two connected tracks drove that growth:

- `Yield backend: SQL/pandas analysis → scoped retrieval → shared cache/preload → prepared Parquet facts → incremental and version-aware refresh → fault-tolerant service`
- `Application delivery: local tool → versioned releases → shared access → mounted application portal → central hosting, health, logs, and recovery`

[Read the case study](case-studies/YIELD.md)

### Grating Process Analytics

This project began with a physical process question rather than a request for software. Building the first analysis exposed missing structure in how process measurements and repeated wafer events were connected. I defined the required historical relationships, then built a configurable analytics and recommendation workflow that reconstructs process cycles, evaluates model quality, and keeps final process decisions with the engineer.

`Process question → focused analysis → data requirements → structured history → configurable analytics → reviewed recommendation`

[Read the case study](case-studies/GRATING_PROCESS_ANALYTICS.md)

### Lean Digital Operations

I built production-visibility and shift-handoff tools to reduce repeated information gathering. The systems prepare shared operational state in the background, make priority and shift-window rules explicit, preserve useful last-known-good views during refresh failures, and protect external actions such as passdown submission from duplicate or partial writes.

`Manual status reconstruction → digital standard work → prepared shared state → safer multi-user workflow`

[Read the case study](case-studies/LEAN_DIGITAL_OPERATIONS.md)

### Manufacturing Application Platform

As engineering applications gained users, the delivery problem became as important as the code. I moved tools through local Python execution, packaged desktop releases, a common application portal, and ultimately centralized server-hosted browser applications. That work required application refactoring, WSGI composition, Windows hosting, SQL Server connectivity, network and domain coordination with IT, health checks, logging, restart tooling, and failure isolation.

`Local engineering tools → repeatable releases → shared portal → central server → health, logging, and recovery`

[Read the case study](case-studies/MANUFACTURING_APPLICATION_PLATFORM.md)

### Supporting engineering tools

I have also built a mobile-friendly Maintenance Operations Portal that connects quick work logging, scheduled-task completion, recurring process-patrol assignments, issue intake, attachments, authorization, and submission auditing. Additional tools cover request/fulfillment workflows, SPC and process-step monitoring, WIP visibility, process-run history, and equipment status. Together, these projects show how focused applications can remove specific sources of manufacturing friction without needing to become separate flagship platforms.

[View supporting tools](case-studies/SUPPORTING_ENGINEERING_TOOLS.md)

## Technical range

- Python, pandas, Dash, Plotly, Tkinter, and application packaging
- SQL Server-compatible access through `pyodbc`
- Manufacturing data modeling across work orders, wafers, operations, tools, measurements, inspection, and test results
- Query scoping, temporary/prepared data, caching, preload, background refresh, and targeted retrieval
- Parquet-backed analytical snapshots and last-known-good publication behavior
- Configuration-driven process definitions and workflow rules
- Statistical analysis, model diagnostics, and human review boundaries
- WSGI application composition and mounted Dash applications
- Waitress-based Windows hosting, health endpoints, logging, launcher/restart/watchdog tooling
- Multi-user state, idempotency protection, transactions, and external workflow integration
- Mobile-responsive workflows, safe file handling, role-checked administration, and privacy-conscious audit logging
- Testing around transformations, data contracts, state transitions, refresh behavior, and integration seams

## What I own in these projects

My work includes problem definition, application architecture, Python development, SQL/data access, transformations, analytical logic, visualization and workflow design, performance optimization, application integration, deployment design, troubleshooting, documentation, and support. I also work directly with process owners, manufacturing-system owners, database teams, and IT when the solution crosses those boundaries.

I do not present enterprise infrastructure, source manufacturing systems, equipment operation, or process approvals owned by other teams as my work. The case studies call out those boundaries where they matter.

## Confidentiality

This is a public engineering portfolio, not a copy of an employer environment. Production source code, credentials, network details, database object names, confidential process rules, and production data are excluded. Public examples use generic terminology, conceptual diagrams, and synthetic data while preserving the engineering problems, architecture, tradeoffs, and decisions I personally worked through.

## Repository map

```text
case-studies/   Detailed engineering case studies
assets/         Public synthetic visuals
docs/           Supporting portfolio documentation
tools/          Repository validation utilities
.github/        Continuous validation
```

## Contact

This portfolio is intended for engineering leaders, hiring managers, and technical reviewers interested in manufacturing software, forward-deployed engineering, process analytics, and production systems work.

## License

Documentation and original diagrams are released under the [MIT License](LICENSE). The linked Yield application has its own license and repository history.
