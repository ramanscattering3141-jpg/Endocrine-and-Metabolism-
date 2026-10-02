# Endocrine Physiology Lab

An interactive endocrine physiology and metabolism laboratory: pathway atlas, feedback-axis simulators and a whole-body metabolic flux simulator. Built around one question: **"If I change X, what happens downstream, and why?"**

Open `index.html` in a browser (no build step, no server needed), or serve the folder with any static host (e.g. GitHub Pages).

## What's inside

| Area | Highlights |
|---|---|
| Fundamentals | Hormone classes & life cycles, live receptor diagrams (Gs/Gi/Gq, RTK, JAK–STAT, nuclear), feedback motifs (negative, positive, feed-forward), pulsatile GnRH demo, sourced half-life curves |
| Hypothalamus & pituitary | Dynamic HPA, HPT, HPG (♂/♀ incl. LH-surge positive feedback), GH–IGF-1, prolactin (dopamine-dominant), ADH and RAAS axes with disorder presets, lab-pattern interpretation and time courses |
| Thyroid | Follicular cell (NIS → pendrin → TPO → coupling → release) and target-cell deiodinase/TR action |
| Adrenal | Steroidogenesis flux map across the three zones with enzyme-deficiency mode (ACTH and renin feedback re-route flux), catecholamine synthesis, cortisol actions |
| Pancreas & glucose | **Insulin prototype**: animated GLUT4 cell (11 steps, play/step/slow-mo, insulin resistance, contraction route), signaling map with organ effects, whole-body read-out; glucagon liver-vs-muscle simulation; β-cell coupling |
| Calcium & bone | Ca/PTH/calcitriol/FGF23 network separating direct from vitamin-D-mediated effects; nephron/enterocyte and RANK/RANKL/OPG diagrams |
| Reproduction | Testis, ovary two-cell model, androgen metabolism, menstrual cycle explorer, feto-placental unit |
| Metabolism | Flux simulator (8 organs, 17 knobs, presets: fed, fasting, prolonged fasting, exercise, stress, insulin resistance, T1D, T2D), hepatocyte map, acetyl-CoA hub, malonyl-CoA/CPT-1 module, amino acids & urea cycle, lipoproteins |
| Explore | What-if cascade generator, Follow the molecule / hormone, organ cross-talk map, Compare, clinical cases, global search, L1–L4 detail levels |

## Architecture

```
js/core/model.js      Qualitative regulatory-network engine (power-law terms, Newton steady state, dynamics, explanations)
js/core/pathway.js    Reusable pathway renderer (typed nodes/edges, zoom/pan, levels, layers, walk-through, quiz, clinical overlays)
js/core/network.js    Endocrine-axis / feedback engine (presets, lesions, exogenous hormones, time-course traces)
js/data/*.js          Entities, references, pathways, axes, metabolic model, fates, cases — add content here
js/views/*.js         Pages
```

New pathways are data: add an object to `EP.pathways` (nodes, edges with `why` text, steps, clinical states) and register it in a page in `js/app.js`.

## Sources and model honesty

Primary sources: Kovacs & Ojeda, *Textbook of Endocrine Physiology* 6e; Molina, *Endocrine Physiology* 5e; Petersen & Shulman, *Physiol Rev* 2018 (all in this repo). Supporting literature was verified on PubMed (PMIDs and DOIs listed in the app's **Sources** page). *Williams Textbook of Endocrinology* was requested but is not in the repo, so nothing is attributed to specific Williams chapters.

All simulations are **qualitative**: values are relative to a reference state and show direction and relative strength of regulation, not measured fluxes or concentrations. Numbers shown (e.g. half-lives) are quoted with their source.
