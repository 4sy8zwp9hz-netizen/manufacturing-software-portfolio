# Supporting Manufacturing Engineering Tools

These smaller applications show the breadth of manufacturing problems I have translated into working software. Each one targets a specific source of friction: maintenance execution, request fulfillment, process monitoring, work-in-process visibility, historical investigation, or equipment status.

## Maintenance Operations Portal

### Problem

Recording a short repair, check, calibration, or observation should be easy near the equipment, but the complete workflow is larger than a log-entry form. Technicians also need to see scheduled work, complete one-time or recurring tasks, record why work could not be completed, attach evidence, report new issues, and perform assigned daily checks. Supervisors need controlled scheduling and an audit trail without exposing sensitive work notes in operational logs.

### How the application evolved

```mermaid
flowchart LR
    A[Mobile quick log] --> B[Validated equipment and user selection]
    B --> C[Photos and document attachments]
    C --> D[Issue intake and scheduled-task completion]
    D --> E[Daily process-patrol assignments]
    E --> F[Role-checked schedule administration]
    F --> G[Submission and outcome auditing]
```

The first practical application reduced the effort required to record maintenance work from a phone or shared browser. Usage exposed the next problems: source selections could become stale, uploaded files needed safe storage, scheduled work needed a completion path, and recurring patrol work needed assignment and correction behavior rather than another static checklist.

### What I built

- a responsive Dash workflow optimized for phones as well as desktop browsers
- live equipment and authorized-user lookups, with selections checked again when a record is submitted
- parameterized SQL Server writes with commit/rollback behavior
- safe multi-file upload handling, sanitized paths, duplicate-name handling, and configurable limits
- scheduled and one-time task completion with explicit work notes and unable-to-complete outcomes
- recurring Process Patrol assignments by person, reusable group, or all users and by weekday
- role checks in both the interface and backend before schedule or group changes are accepted
- shared daily completion state so one completed team assignment is not presented as unfinished to every assignee
- history-preserving schedule, assignment, and group changes through retirement or deactivation instead of destructive deletion
- bounded browser payloads, progressive task lists, and cached task retrieval for a usable shared workflow
- rotating, fail-safe submission auditing that records outcome metadata while deliberately excluding work notes, attachment names, and file contents

Process Patrol is production-ready and scheduled for operational rollout. Its current outcome model records the daily checklist decision and preserves assignment history; it does not claim additional maintenance-record posting or attachment behavior that remains outside the approved workflow.

### Why it is a supporting project

This is a substantial application, but its strongest portfolio value is as another example of digital standard work and transactional workflow design. Keeping it here preserves the four primary stories while demonstrating that the same problem-first approach also applies to maintenance and reliability operations.

### Engineering lesson

A convenient input form creates value only when the receiving state, validation, attachments, permissions, completion rules, correction path, history, and support model are designed with it. In software terms, the portal combines transactional integrity, authorization, auditability, responsive interaction, and history-preserving state transitions around a real maintenance workflow.

## Clean Room Request and Fulfillment Queue

### Problem

Requests for controlled-area garments or consumables need a clear submission path, a visible fulfillment queue, and a record of completion or inability to complete.

### What I built

- separate requester and fulfiller browser views
- a durable backend store behind the workflow boundary
- periodic queue refresh and status filtering
- multi-select completion, cannot-complete, and reopen transitions
- fulfillment identity and comments captured with each transition
- configuration separated from the form and queue logic

```mermaid
stateDiagram-v2
    [*] --> Open: request submitted
    Open --> Completed: fulfilled with actor and note
    Open --> CannotComplete: disposition recorded
    CannotComplete --> Open: reopened
    Completed --> Open: reopened when correction is needed
```

The key engineering lesson was that a form is only half a workflow. The receiving queue, state transitions, correction path, and traceability determine whether the application is operationally complete.

## SPC and Process-Step Monitoring

I built tools that convert selected process-step measurements into health summaries, out-of-control/out-of-specification investigation, wafer cohort views, statistical charts, review records, and exports. Configuration defines which process steps and measurements are monitored, while query/preparation logic is separated from desktop or browser presentation.

The important design boundary is between a statistical signal and an engineering disposition. Software can calculate, visualize, and prioritize signals, but the engineer still needs to interpret control limits, specification limits, sampling, repeat measurements, and process context before acting.

## Current WIP and Process-Flow Views

These applications use prepared production snapshots to show current work-in-process distribution, process-flow position, wafer-size or layer slices, and detailed operational context. A related chip-side view maps work through ordered process steps and surfaces stalled, aging, or overdue material.

The architecture allows one governed snapshot to support both summary visualization and detailed operational views without forcing every page interaction to issue a new broad source query.

## Process-Run History Explorer

The process-run history workflow supports targeted investigation across cached historical records. Correctness matters as much as speed: late or corrected records can make a cached history look plausible while silently omitting valid events.

I therefore treated refresh reconciliation and store-level validation as part of the data contract rather than as performance-only features.

## Equipment Status

I adapted equipment-status information into a responsive, portal-mounted browser view for shared operational visibility. The engineering work was less about creating another isolated screen and more about integrating the view into the same deployment, routing, and support model as the broader application platform.

## What these projects demonstrate

Across these smaller tools, the recurring pattern is the same:

- start with the manufacturing decision or workflow rather than the UI
- identify the minimum trustworthy data and state model
- make transitions, timing, and ownership explicit
- separate source retrieval from presentation when shared use makes repeated querying expensive
- design correction and recovery paths rather than only the happy path
- integrate successful tools into a common hosting and support model

## My ownership

I designed and implemented the application workflows, Python transformations, visualizations, cache behavior, state transitions, and portal integrations described above.

Manufacturing definitions, source records, approvals, equipment operation, database administration, and infrastructure policy remained with their respective process and system owners.

## Confidentiality

This public summary uses generic descriptions and excludes employer source code, production identifiers, private queues, process rules, credentials, database objects, and production data.
