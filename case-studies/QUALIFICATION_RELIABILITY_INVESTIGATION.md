# Qualification and Reliability Investigation

**[Open the working demo](https://qualification-studio.orange-rat-4119.chatgpt.site)** · [Inspect its source](../demos/qualification-studio)

**What I built:** An investigation application that connects process history, electrical measurements, reliability tests, and qualification outcomes so engineers can test competing explanations for qualification losses.

**What it demonstrates:** Quality engineering, data reconciliation, statistical modeling, reliability analysis, and the design of readable applications for technical decisions.

## Problem

Poor qualification yield creates a difficult root-cause problem: the available records describe different objects at different times. Process history follows wafers and operations. Electrical and reliability measurements follow individual devices, repeated tests, and test configurations. Final qualification decisions may arrive later, and failures can become visible before passing results.

An attractive correlation is therefore only a starting point. Engineers need to know which physical wafers were compared, whether their results are complete, whether repeated measurements were linked correctly, and whether an apparent process effect survives a more comparable population.

## Connect the evidence before fitting the model

I combined independently extracted process, electrical, and reliability records with wafer context from the [Manufacturing Yield Platform](YIELD.md). Physical substrate and device identities connect the evidence while keeping wafer outcomes distinct from device measurements. Baseline and stressed readings are paired within compatible test configurations, retaining repeated-test context.

The analysis distinguishes two endpoints: recorded wafer qualification and the fraction of evaluable devices meeting a reliability screen. A visible selector changes the analytical endpoint across the relevant product views. Missing or invalid pairs remain visible in coverage counts rather than silently becoming failures or passes.

Process timing is also explicit. The application compares waiting intervals to different recorded process milestones, so engineers can see whether the choice of timestamp changes the result. Product families keep their own process definitions and comparison populations.

[![Big Data Analysis example running with generated data](../assets/qualification-studio-demo.png)](https://qualification-studio.orange-rat-4119.chatgpt.site)

*Screenshot of the runnable public synthetic demo. All displayed products, records, measurements, and relationships are fictional.*

## Separate a population trend from a within-run comparison

The application presents observed counts and distributions before model output. Engineers can examine time groups, calendar periods, process groups, and run positions without treating those comparisons as interchangeable.

- **Completion context:** show completed and pending wafers by period. A recent cohort with early failures and outstanding tests can give a misleading picture of its eventual qualification rate.
- **Adjusted population comparisons:** use logistic models with explicit adjustment variables and uncertainty that accounts for shared growth runs. Device yield uses passing and tested counts rather than treating a wafer percentage as a binary outcome.
- **Within-run comparisons:** compare wafers sharing a run using their relative processing positions. Conditional logistic regression supports the binary qualification comparison; grouped binomial models with run effects support the device-yield endpoint.
- **Auditable statistics:** expose the model population, fitted and observed results, coefficient estimates, confidence intervals, significance tests, and sensitivity checks. Explain odds ratios as odds rather than multipliers of the observed qualification percentage.

These are observational comparisons. Their role is to narrow the engineering investigation and test competing explanations; establishing a physical cause still requires process evidence and controlled follow-up.

## Make the findings readable without losing the detail

Direct engineering review shaped the presentation: a concise conclusion and supporting counts come first, followed by charts and progressively deeper statistical detail.

Consistent tables and compact endpoint controls help readers compare results. Primary analysis tabs and a disclosure menu separate the main investigation from detailed tools and methods; additional product analyses open without repeating the application header.

Statistical output is collapsed by default, while raw-data exports and definitions remain available. Responsive layouts, keyboard focus states, and reduced-motion support keep presentation choices from blocking access to the evidence.

## Result

The application turns fragmented reliability records into a shared investigation: engineers can inspect a suspected relationship, change the endpoint, compare more closely matched wafers, and trace the result back to its underlying records.

It supported process-timing hypotheses and showed where an association became weaker under a different endpoint or a within-run comparison. The result is a more focused engineering investigation and a reviewable analytical basis for follow-up. No measured yield improvement or proven physical root cause is claimed here.

## My ownership

I defined the investigation with process stakeholders, implemented data reconciliation, statistical comparisons and exports, designed the interface, integrated it into the [Manufacturing Application Platform](MANUFACTURING_APPLICATION_PLATFORM.md), and verified published workflows through browser checks and regression tests.

Source manufacturing systems, physical testing, process operation, and final process approvals remain with their respective owners.

## Public example

Try [Big Data Analysis — Interactive Example](https://qualification-studio.orange-rat-4119.chatgpt.site) directly. The independent, buildless browser application includes filters, outcome switching, timing charts, completion context, run and device drilldowns, searchable wafer records, CSV exports, and meeting minutes linked to the evidence. The meeting tab separates illustrative engineering discussion, actual published revisions, and visitor notes saved only in their own browser. Its synthetic generator and small binomial model are included in the [public source](../demos/qualification-studio). It demonstrates investigation patterns without reproducing production code, data, or process rules.

For related quality workflows, see [Wafer Quality Investigation](WAFER_QUALITY_INVESTIGATION.md). For a runnable public synthetic application, see the [Manufacturing Yield Platform](YIELD.md).

## Confidentiality

This case study omits production values, screen limits, model coefficients, equipment and product identities, database objects, network details, production source code, and private screenshots. The demo's numbers and relationships are fictional and support no production or statistical claim.
