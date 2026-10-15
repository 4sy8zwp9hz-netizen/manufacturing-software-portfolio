# Big Data Analysis — Interactive Example

A working portfolio demo by Matthew Chung. Open the investigation, change product
and period, switch between wafer Qualification and device yield, inspect run
positions, open individual device measurements, and export the selected records.
Meeting minutes link illustrative review decisions to the relevant analysis, while
a published-change log records actual portfolio-demo updates. Visitors can save
their own notes locally in the browser; those notes do not update the shared site.

The example emphasizes executive presentation, manufacturing data analysis,
clear conclusions, and interactive review. It is observational analysis, not a
designed experiment or a demonstrated machine-learning training pipeline.

All 576 wafers, 72 runs, and 23,040 device records are generated deterministically
in the browser. Product names, measurements, outcomes, and screen limits are
fictional. This is an independent public example, not a production application or
a copy of employer source code.

## Run locally

No build or package installation is required. From the project directory, run
`python -m http.server 8080 --directory dist`, then open `http://localhost:8080`.
Run the data-contract checks with `node tests/data.mjs`.

## Analysis

Qualification uses completed wafer outcomes; pending results remain in the
coverage counts. Device yield uses passing/tested paired-device counts, with both
fictional screen limits applied. Missing pairs are excluded; zero endpoint response
is a measured failure. Run quarters retain original positions.

The visible logistic fit is an unadjusted two-parameter binomial model with a
log-transformed wait predictor and run-clustered sandwich uncertainty. It is
computed from the selected synthetic records. Within-run comparisons are
descriptive; no causal or production conclusion is implied.

## Files

- `dist/index.html`: application shell and accessible navigation
- `dist/styles.css`: responsive light presentation and reduced-motion behavior
- `dist/app.js`: deterministic generator, comparisons, model fit, charts, and CSV export
- `tests/data.mjs`: identity, denominator, timing-order, and fit checks

No database, external chart library, production dataset, or API credential is used.

Original demo code and documentation are released under the MIT License in the
[portfolio repository](https://github.com/4sy8zwp9hz-netizen/manufacturing-software-portfolio).
