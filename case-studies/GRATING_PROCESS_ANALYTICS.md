# Grating Process Analytics

**What I built:** A process investigation and recommendation workflow that reconstructs repeated wafer-processing cycles, compares upstream conditions with downstream response, and presents proposed settings with diagnostics for engineering review.

**What it demonstrates:** Semiconductor process engineering, data requirements, event reconstruction, configurable analytics, statistical modeling, human-in-the-loop decision support, and manufacturing-system integration.

## Problem

A process recommendation can depend on measurements collected at several operations, tool context, wafer attributes, repeated processing, and the currently approved setting matrix. The source history arrives as events, not as the one-row-per-observation analytical frame needed for comparison or modeling.

The application must establish which measurements belong to the same physical process cycle, preserve traceability, expose data quality, and keep proposed settings subject to engineering approval.

## How the project started

The initial ashing investigation needed upstream measurements, process inputs, downstream responses, equipment context, and wafer identity connected in the order they occurred.

That analysis exposed gaps in how the history represented repeated processing. I defined the measurements, event relationships, identities, and process-cycle history needed for repeatable analysis, then worked with manufacturing-system and data owners to establish those requirements.

Once that structured history was available, the software evolved from a focused analysis into a reusable, configuration-driven analytics and recommendation workflow.

## Evolution

```mermaid
flowchart LR
    V0[Focused process question] -->|manual event assembly| V1[Initial analysis tool]
    V1 -->|missing reusable history| V2[Define measurement and linkage requirements]
    V2 -->|structured capture available| V3[Configurable process analytics]
    V3 -->|visibility is not a decision| V4[Diagnostics and constrained recommendation]
```

## Architecture

```mermaid
flowchart TB
    C[Process configuration] --> E[Event acquisition]
    R[Route and operation definitions] --> E
    E --> N[Normalize units timestamps and identities]
    N --> Y[Assign repeated events to process cycles]
    Y --> W[One row per wafer-cycle]
    T[Tool and wafer context] --> W
    W --> A[Interactive analysis]
    W --> M[Recommendation models]
    M --> G[Coverage and diagnostic checks]
    G --> P[Proposed setting matrix]
    B[Current approved matrix] --> P
    P --> H[Human engineering review and export]
```

This shares a data-definition principle with the [Manufacturing Yield Platform](YIELD.md): establish the physical population before analysis. Here, source history is normalized into wafer-cycle records. Browser sessions filter, exclude, compare, and export from a stable snapshot without changing shared data.

## Selected engineering challenges

### Reconstructing the correct process cycle

A wafer can enter the same operation more than once because of re-entry, rework, or repeated measurement. That means several upstream and downstream events may be plausible matches for one wafer.

Collapsing everything to one row per wafer can pair a later response with an earlier process input. Treating every event as independent can create the opposite problem: false cycles that never represented one physical processing sequence.

I normalized event order and assigned repeated entries to explicit process cycles. The analytical row became one wafer-cycle, with measurements, settings, responses, and tool context joined to that cycle rather than to wafer identity alone.

### Turning a one-time manual relationship into a data requirement

The focused analysis depended on historical relationships that could be assembled manually but were not consistently available as reusable application inputs.

I defined the required measurements, process events, identities, and linkages with manufacturing-system and data owners. The application treats those relationships as explicit inputs and validates its configuration before constructing the wafer-cycle dataset.

### Keeping recommendations interpretable and bounded

A model can produce a numerical answer even when the supporting sample is small, the target is outside observed coverage, residual behavior is poor, or different process families behave differently.

I separated analysis by the relevant process grouping, exposed sample and fit diagnostics, checked coverage and extrapolation, made wafer exclusions reversible and session-scoped, compared current and proposed settings, and kept final approval with the engineer.

The application therefore presents a reviewable proposal together with the reasons to trust or distrust it. It does not convert a fitted relationship into an uncontrolled equipment change.

### Separating shared data acquisition from interactive analysis

Repeated source queries made every browser interaction pay for the same data acquisition work. At the same time, different engineers needed to explore different subsets and exclusions without changing one another's view.

I separated the shared refresh lifecycle from session-level analysis. A validated snapshot is refreshed independently, while each browser session can filter, exclude, compare, and export without mutating the common dataset. If refresh fails, the prior valid snapshot remains available with updated status.

## Example analytical grain

The public example below is generic and fictional, but it illustrates the important data-model decision.

| wafer_key | process_cycle | upstream_measurement | recipe_setting | downstream_response | tool_family |
|---|---:|---:|---:|---:|---|
| SYN-W001 | 1 | 1.04 | 42 | 0.97 | TOOL-A |
| SYN-W002 | 1 | 1.08 | 44 | 1.01 | TOOL-B |
| SYN-W001 | 2 | 1.01 | 41 | 0.96 | TOOL-A |

The composite key is wafer plus process cycle. Collapsing the table to wafer only would lose legitimate rework/re-entry history; treating each raw event as its own cycle would create false pairings.

## Result

Engineers can trace a proposed process setting through its supporting measurements, event pairings, and model diagnostics:

`configuration → source events → process-cycle reconstruction → wafer-level evidence → model diagnostics → proposed setting → human decision`

Evidence assembly and comparison become repeatable and reviewable. Engineers can inspect coverage, exclusions, and model fit before accepting or rejecting a proposal; approval remains with the process owner.

## My ownership

I designed and implemented the Python/pandas analytical engine, configurable measurement mapping, repeated-event reconstruction, interactive analysis workflow, recommendation and diagnostics layer, current-versus-proposed comparison, snapshot/session behavior, and portal-ready application delivery.

I also defined the measurement roles, historical relationships, data-quality expectations, and evidence the application required in coordination with manufacturing-system and data owners. Upstream manufacturing-system capture, database administration, approved process settings, equipment operation, and final process authorization remained with their respective owners.

## Tradeoffs

- **Configuration-driven measurement roles:** make the application reusable across related analyses, but require validation and clear errors when configuration is incomplete.
- **Interpretable models:** are easier to diagnose and defend in an engineering review, but may miss nonlinear effects or interactions.
- **Human approval boundary:** keeps recommendations controlled, but intentionally adds review rather than maximizing automation.
- **Shared snapshots plus session-local analysis:** reduce repeated source work and protect multi-user isolation, but require explicit refresh and cache lifecycle management.

## Confidentiality

Private process rules, source schema names, equipment identifiers, approved production settings, and employer data are not included. The public case study preserves the engineering architecture, reasoning, and ownership boundaries using generic terminology and fictional examples.
