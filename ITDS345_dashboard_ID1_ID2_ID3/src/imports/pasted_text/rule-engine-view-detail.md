Fix "View Detail" buttons on all Rule Engine cards in the ARIA Assistant page.
Currently all View Detail buttons are non-functional. Wire them up with 
inline expand behavior as specified below.

DO NOT change any layout, colors, nav, or other components.
Only fix the View Detail interaction on Rule cards 1–5.

═══════════════════════════════════════
VIEW DETAIL — BEHAVIOR SPEC
═══════════════════════════════════════

Each Rule card (1–5) has a "View Detail" button.
On click: toggle expand/collapse an accordion panel 
directly below that rule card's content row.
Button label changes: "View Detail ›" → "Hide Detail ∧" when open.
Only one card can be expanded at a time — opening one closes others.

═══════════════════════════════════════
RULE 1 — STILL VALID (GO)
═══════════════════════════════════════

Expanded panel shows:

SECTION A — Condition Table:
| Condition          | Target  | Current | Status |
| Recall             | ≥ 85%   | 78.0%   | FAIL ✗ |  ← wait, Rule1=CLEAR so use passing values
| FPR                | ≤ 20%   | 16.4%   | PASS ✓ |
| Flagged Rate       | ≤ 5%    | 8.7%    | FAIL ✗ |
| Pattern Coverage   | ≥ 80%   | 75.0%   | FAIL ✗ |
| Precision          | ≥ 30%   | 29.1%   | FAIL ✗ |
| System Status      | OK      | OK      | PASS ✓ |
| Drift Detected     | No      | Yes     | FAIL ✗ |

Status badge row: "CLEAR" green pill — "All conditions must pass. Currently NOT all pass."
Note text (amber): "Rule 1 requires ALL conditions met. Current data does not satisfy Rule 1."

SECTION B — Action:
"STILL VALID (GO) / โมเดลยังใช้งานได้" — currently NOT triggered

SECTION C — Last Triggered:
"Last triggered: ไม่เคย trigger / Never triggered"
"Last checked: 2 min ago"

No action buttons for Rule 1.

═══════════════════════════════════════
RULE 2 — RE-TRAIN MODEL (TRIGGERED)
═══════════════════════════════════════

Expanded panel shows (red glowing border on card):

SECTION A — Condition Table:
| Condition          | Target  | Current | Status  |
| Recall             | < 85%   | 78.0%   | PASS ✓  |
| Drift Detected     | Yes     | Yes     | PASS ✓  |
| Pattern Coverage   | < 80%   | 75.0%   | PASS ✓  |
| Precision          | < 30%   | 29.1%   | PASS ✓  |

Status badge: "TRIGGERED" red pill

SECTION B — SHAP Top Features:
Label: "Feature ที่ส่งผลต่อ Recall มากที่สุด / Top Contributing Features"
Bar chart (horizontal, 3 bars):
  transaction_velocity  ████████░░  +0.34  (red bar)
  amount_zscore         ██████░░░░  +0.21  (red bar)
  time_since_last_txn   █████░░░░░  +0.18  (amber bar)

SECTION C — Rule Logic:
Code block (dark #0A1628 bg, monospace):
  IF Drift == 'Yes' 
  AND (Recall < 0.85 
       OR Pattern_Coverage < 0.80 
       OR Precision < 0.30)
  THEN 'RE-TRAIN MODEL'

SECTION D — Action Buttons:
  [Re-train ทันที] primary blue → open Retrain confirmation modal
  [Schedule Off-peak 02:00] secondary → open schedule modal
  [Monitor ต่อ] secondary → amber toast "กำลัง Monitor ต่อ"

Last triggered: "วันนี้ 09:42 / Today 09:42"

═══════════════════════════════════════
RULE 3 — TUNE THRESHOLD / SENSITIVITY (ACTIVE)
═══════════════════════════════════════

Expanded panel shows (amber border):

SECTION A — Condition Table:
| Condition          | Target  | Current | Status  |
| Recall             | ≥ 85%   | 78.0%   | FAIL ✗  |
| FPR                | > 20%   | 16.4%   | FAIL ✗  |
| Flagged Rate       | > 5%    | 8.7%    | PASS ✓  |
| Pattern Coverage   | ≥ 80%   | 75.0%   | FAIL ✗  |
| Precision          | < 30%   | 29.1%   | PASS ✓  |
| Drift              | No      | Yes     | FAIL ✗  |

Status badge: "ACTIVE" amber pill
Note: "บางเงื่อนไขผ่าน — Rule ยังไม่ fully triggered"

SECTION B — Rule Logic:
  IF Recall >= 0.85 AND Pattern_Coverage >= 0.80
  AND FPR > 0.20 AND Flagged_Rate > 0.05
  AND Precision < 0.30 AND Drift == 'No'
  THEN 'TUNE THRESHOLD / SENSITIVITY'

SECTION C — Action Buttons:
  [Adjust Threshold / ปรับ Threshold] primary → open threshold slider modal
  [Simulate Rule / จำลอง Rule] secondary → amber toast 
    "Simulating... Rule 3 would trigger if FPR reaches 20.1%"

Last triggered: "3 days ago / 3 วันที่แล้ว"

═══════════════════════════════════════
RULE 4 — OPTIMIZE SYSTEM / RESOURCE (CLEAR)
═══════════════════════════════════════

Expanded panel shows (green border):

SECTION A — Condition Table:
| Condition          | Target  | Current | Status  |
| Recall             | ≥ 85%   | 78.0%   | FAIL ✗  |
| FPR                | ≤ 20%   | 16.4%   | PASS ✓  |
| Flagged Rate       | ≤ 5%    | 8.7%    | FAIL ✗  |
| Pattern Coverage   | ≥ 80%   | 75.0%   | FAIL ✗  |
| Precision          | ≥ 30%   | 29.1%   | FAIL ✗  |
| Drift              | No      | Yes     | FAIL ✗  |
| System Status      | Not OK  | OK      | FAIL ✗  |

Status badge: "CLEAR" green pill
Note: "ระบบทำงานปกติ — Rule 4 ไม่ถูก trigger"

SECTION B — Rule Logic:
  IF Recall >= 0.85 AND FPR <= 0.20 
  AND Flagged_Rate <= 0.05 AND Pattern_Coverage >= 0.80
  AND Precision >= 0.30 AND Drift == 'No' 
  AND System == 'Not OK'
  THEN 'OPTIMIZE SYSTEM / RESOURCE'

SECTION C — System Health (read-only):
  Latency: OK ✓ (green)
  CPU Usage: 67% (amber — watch)
  Memory: Normal (green)

No action buttons — system is healthy.
Last triggered: "Never / ไม่เคย"

═══════════════════════════════════════
RULE 5 — EMERGENCY ROLLBACK (CLEAR)
═══════════════════════════════════════

Expanded panel shows (green border, but with red warning section):

SECTION A — Condition Table:
| Condition          | Target   | Current | Status  |
| Recall             | < 50%    | 78.0%   | FAIL ✗  |
| Pattern Coverage   | < 50%    | 75.0%   | FAIL ✗  |
| Precision          | < 10%    | 29.1%   | FAIL ✗  |
| Drift              | Yes      | Yes     | PASS ✓  |

Status badge: "CLEAR" green pill
Note (green): "Recall และ Precision ยังอยู่เหนือเกณฑ์ฉุกเฉิน — ไม่จำเป็นต้อง Rollback"

SECTION B — Rule Logic:
  IF Drift == 'Yes' 
  AND (Recall < 0.50 
       OR Pattern_Coverage < 0.50 
       OR Precision < 0.10)
  THEN 'EMERGENCY ROLLBACK'

SECTION C — Warning (always show even when CLEAR):
  Red warning card:
  "⚠️ หาก Recall ลดลงต่อเนื่องถึง 50% Rule นี้จะถูก trigger อัตโนมัติ
   ระยะห่างจาก trigger: Recall ต้องลดอีก 28% / Gap to trigger: -28% Recall"

SECTION D — Action Button:
  [Force Rollback / บังคับ Rollback] destructive red button
  → open destructive modal requiring typed "ROLLBACK" confirmation
  → on confirm: critical red toast + update all page statuses

Last triggered: "Never / ไม่เคย"

═══════════════════════════════════════
EXPANDED PANEL DESIGN SPEC
═══════════════════════════════════════

Panel container:
- Background: #0A1628 (slightly darker than card)
- Border-top: 1px dashed #1A3050
- Padding: 20px 24px
- Animate: slide down 200ms ease-out on open

Condition table:
- Header row: #8FA3BC 11px UPPERCASE
- PASS rows: Precision text #10B981 + ✓ icon
- FAIL rows: text #EF4444 + ✗ icon
- Alternating row bg: transparent / rgba(255,255,255,0.02)

Rule Logic code block:
- Background: #0A1628, border 1px #1A3050
- Border-radius: 8px, padding: 12px 16px
- Font: monospace 13px, color #F0F4F8
- Keyword IF/AND/OR/THEN: color #1E6FD9

Action buttons inside expanded panel:
- Same spec as global buttons
- Margin-top: 16px, display flex gap 12px

Language toggle: expanded panel content must also 
respect TH/EN/Bilingual toggle state