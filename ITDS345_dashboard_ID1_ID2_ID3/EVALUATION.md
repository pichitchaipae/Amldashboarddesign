# AML Detection Dashboard — UX Evaluation

**Evaluator persona:** Mid-level AML / Compliance Analyst
**Artifact evaluated:** Sentinel AML — Detection Overview prototype (v0.1)
**Date:** 2026-04-22

---

## 1. Executive Summary

The prototype establishes a credible fintech-grade surface for AML detection monitoring and introduces a genuinely useful decision aid (the threshold simulator). However, the current KPI composition creates a **trust gap** for a regulated analyst audience: model-derived metrics, estimated proxies, and business-impact figures are presented at the same visual weight, which makes it difficult to answer the auditor-facing question *"which number is the number?"*

The dashboard is therefore best characterized as a strong **decision-support surface** that is not yet an **audit-grade source of truth**. Closing that gap requires a small number of structural changes rather than visual polish.

---

## 2. Method

Feedback was produced through a persona-driven walkthrough of the live prototype. The analyst persona was instantiated with domain knowledge of recall, false positive rate, threshold tuning, SAR workflow, and regulatory defensibility. Each screen region was assessed against three criteria:

1. **Interpretability** — can the metric be understood without vendor context?
2. **Defensibility** — can the metric be cited to audit or regulator?
3. **Actionability** — does the signal connect to a next step the analyst owns?

---

## 3. Findings

### 3.1 Critical: Metric Trust Gap

The headline card "SAR Disclosure Rate — 88.4% (Approximated)" coexists with a live simulator that reports Recall at a different value (e.g. 82.3%) under the current threshold. An analyst reading both at once cannot reconcile them without internal documentation, and neither figure is defensible in isolation: the 88.4% is a derived proxy, and the 82.3% is threshold-dependent.

> **Impact.** Under regulator pressure, the analyst defaults to *not* citing either number. A headline KPI that cannot be cited is, for practical purposes, a liability.

### 3.2 Critical: Warning Without Control (Cross-Border Risk)

The Cross-Border Risk Ratio (73.1%, marked *Critical*, above a 60% tolerance) is a strong signal but terminates at the card boundary. There is no corridor breakdown, no contributing-entity view, and no path from the alert to the queue.

> **Impact.** The analyst must leave the dashboard to investigate — the card behaves as a static indicator rather than an operational lever. Cross-border threshold context is also absent (the tolerance band is asserted without reference to policy).

### 3.3 Major: KPI Class Mixing

Model metrics (Recall, FPR), operational metrics (Workload, Alert volume), and business metrics (Detected Suspicious Value) share the same card tier. Each class has a different owner, cadence, and confidence level, and the visual grid implies parity that does not exist.

> **Impact.** The analyst cannot infer which metric to optimize against, and reviewers cannot see at a glance which figures are model-derived vs. operationally grounded.

### 3.4 Major: Simulator Isolation

The threshold simulator is the strongest decision aid on the page but is presented as a standalone panel. Its outputs (Recall, FPR, Flagged Rate) are not visibly tied to the Tier-1 KPIs they should be driving.

> **Impact.** The causal relationship between the slider and the headline numbers is not communicated, so the simulator reads as a sandbox rather than the system's control surface.

### 3.5 Minor: Human-Readable Captions Drift Toward Marketing

Captions such as *"86 of every 100 alerts are worth reviewing"* optimize for accessibility but blur the underlying definition (precision vs. 1 − FPR). Analyst-grade captions should preserve the formula while adding the plain-language gloss, not replace it.

### 3.6 Required Notes (per source context)

- **Cross-border threshold context.** The 60% tolerance band on Cross-Border Risk Ratio is displayed without policy reference; it must be sourced (institution policy vs. FATF guidance) for defensibility.
- **Growth edge case.** The 10-day growth sparkline does not account for reporting-window roll-offs or weekend effects; a dampened or normalized trend is required before the figure can be cited.
- **Recall 88.4% vs 92.18% clarification.** These two numbers have been used interchangeably during stakeholder review. 92.18% reflects a full-dataset historical evaluation; 88.4% reflects the current-threshold proxy. The dashboard must disambiguate by surfacing both with their evaluation context, or pick one and retire the other from the UI.

---

## 4. Decision Impact

| Region | Supports decision? | Reason |
|---|---|---|
| Tier-1 KPI row | Partially | Headline figure is not defensible under audit |
| FATF Pattern chart | Yes | BIPARTITE underperformance is legible and triggers concrete follow-up |
| High-Risk Value donut | Partially | Ratio is clear, underlying amount needs drill-down |
| Cross-Border card | No | Signal present, control absent |
| Threshold simulator | Yes | Strongest element on the page |
| Alert queue | Yes | Sort + filter are sufficient for triage |

---

## 5. Trust Risk Assessment

The prototype currently exposes three classes of trust risk:

1. **Citation risk** — headline metrics are not audit-citable in their present form.
2. **Silent-failure risk** — the BIPARTITE recall deficit is surfaced but has no remediation path, which erodes confidence that other deficits would be surfaced at all.
3. **Category-error risk** — mixing business-impact and model-performance metrics invites stakeholders to optimize the wrong lever.

None of these are fatal; all three are addressable without changing the underlying model.

---

## 6. Recommendations (ranked by ROI)

1. **Restructure KPIs into explicit tiers.**
   - Tier 1 (Model Performance): Recall @ current threshold, FPR, Workload.
   - Tier 2 (Estimated Coverage & Impact): Estimated SAR Coverage, FATF Pattern Coverage, Detected Suspicious Value — every Tier-2 card must carry an explicit *Estimated* chip and a derivation note.
2. **Disambiguate Recall vs. Estimated SAR Coverage.** Surface both, with distinct labels and evaluation context, side-by-side.
3. **Promote Cross-Border from warning to control.** Add top-3 corridor breakdown, percent contribution, and a "View affected alerts" CTA that applies a corridor filter to the alert queue.
4. **Tie the simulator to Tier-1 metrics.** Add an explicit caption — *"This threshold drives the Model Performance metrics above"* — and visually connect the simulator's outputs to the Tier-1 row.
5. **Rewrite captions to preserve formula.** e.g. *"FPR 14.1% — ~14 of every 100 alerts are clean (FP / (FP + TN))."*
6. **Source the 60% cross-border tolerance** in the tooltip.

Out of scope for this iteration: additional KPIs, visual polish, additional chart types.

---

## 7. Final Judgment

> **Adoption recommendation:** conditional. Use as a decision-support tool; do not yet cite as a source of truth. After recommendations 1–4 land, re-evaluate for audit-grade adoption.
