# Portfolio Inventory and Selection Rationale

This inventory is the output of a code-and-history audit of the manufacturing
application workspace. It records what could be verified before choosing how much
to rebuild publicly. It intentionally describes capabilities rather than private
implementation names.

## Selection criteria

Each candidate was assessed for problem significance, engineering depth,
distinctiveness, evidence quality, clean-room feasibility, and reviewer value.
Public depth is proportional to the story—not every useful tool needs a public
clone.

| Candidate | Real problem | Technical depth | Process value | Proposed public form |
|---|---|---:|---:|---|
| Manufacturing Yield Platform | investigate yield across mixed grains without repeatedly scanning high-volume history | High | High | Full runnable synthetic repository |
| Grating Process Analytics | reconstruct process response and support a constrained engineering recommendation from fragmented events | High | High | Deep architecture/evolution case study |
| Fab TV / work-queue visibility | replace repeated production-status reconstruction with common visual management | Medium–high | High | Lean Digital Operations case study |
| Shift passdown | make shift windows, notes, preview, and controlled delivery consistent | Medium–high | High | Lean Digital Operations case study |
| Multi-application portal and server | move useful local applications into one supportable hosting and recovery contract | High | High | Infrastructure/platform case study |
| Clean Room Request | connect request submission to a traceable fulfillment queue and correction path | Medium | Medium | Supporting tool summary |
| SPC / process-step monitoring | prioritize statistical signals and make review evidence repeatable | High | High | Supporting tool summary |
| Current WIP and process-flow views | make current flow and detail visible from reusable snapshots | Medium | High | Supporting tool summary |
| Process-run history | retrieve and reconcile investigation history without repeated broad queries | Medium | Medium | Supporting tool summary |
| Equipment status | provide a shared, responsive operational status surface | Medium | Medium | Supporting tool summary |

## Verified chronology

The repository history verifies a progression from a portal baseline, through
individual application integrations, toward shared snapshots, broader analytical
apps, operational workflows, cached history, and equipment status. Archived server
packages and launcher scripts verify repeated operational hardening: health checks,
logging, restart commands, and watchdog behavior.

Some earlier Grating/Ashing work predates the visible history of the audited
checkout. The current analytical engine and recommendation modules verify the
mature architecture, but this portfolio does not assign dates or detailed claims
to an earlier implementation that could not be independently reconstructed.

## Clean-room boundary

### Included

- generic component roles and data flow
- verified technology choices and operational patterns
- high-level manufacturing entities and decisions
- lessons, tradeoffs, failure modes, and evolution
- clearly fictional examples

### Excluded

- original source code or copied comments
- SQL text, database and table names, column names, hosts, ports, and paths
- proprietary product, part, route, process, step, tool, and user identifiers
- production values, thresholds, recipient lists, schedules, and access rules
- employer names, branding, screenshots, and network topology
- unverified claims about packaging or release mechanisms

## Depth decision

The result is deliberately asymmetric. Yield is a complete public analogue.
Grating is a deep technical case study. Lean Operations and the Application
Platform emphasize workflow and system evolution. Supporting tools demonstrate
breadth without creating a wall of shallow repositories.
