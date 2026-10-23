# Small-Group Schedule Demo

[Try the no-login demo](https://small-group-demo.orange-rat-4119.chatgpt.site)

A fictional, mobile-friendly demonstration of a personal scheduling application. Explore household attendance, individual member selection, guests, upcoming responsibilities, and leader editing of meeting details and assignments.

This is a separate static site, not the live application's Flask or Cloud Run backend. The original personal app uses Flask, Google Sheets, and Cloud Run; this demo illustrates its interaction patterns without connecting to those systems. All group details, households, and schedules are fictional. No real participant data, live-app URL, credentials, or backend services are included.

## Try it

Choose a fictional household, save an attendance response, then try **Leader tools** to edit the schedule or assignments. **Reset demo** restores the original examples.

Changes stay in this tab's `sessionStorage` and survive a reload; they are not sent to a server or shared with other visitors. If storage is unavailable, the demo works in memory until reload. It uses a fixed sample date of **October 23, 2026**, so upcoming and past examples stay reproducible. Existing responses remain available when a meeting is canceled or moved into the past, but attendance editing closes.

## Run locally

No dependencies or build step are required. From this directory:

```sh
python -m http.server 8766 --directory dist
```

Open `http://localhost:8766`. Run the data-model and publication-safety checks with Node.js:

```sh
node --test tests/*.test.mjs
```

`dist/` contains the page, styles, UI module, and independently testable data model. Tests cover validation, immutable updates, attendance counts, schedule changes, storage failures, local assets, and the no-backend boundary. The page's Content Security Policy blocks network connections and form submissions; its external links only navigate to the public portfolio.
