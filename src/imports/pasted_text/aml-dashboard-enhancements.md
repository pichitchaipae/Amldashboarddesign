Fix and enhance the AML Dashboard with these 4 specific improvements. 
Do NOT change layout, colors, or dark theme. Only add/fix the listed features.

═══════════════════════════════════════
FIX 1 — LANGUAGE TOGGLE (ทุกหน้า)
═══════════════════════════════════════

Add a language toggle button in the TOP NAV BAR, right side, 
left of the notification bell.

Toggle design:
- Pill shape, width 80px, height 32px
- Two states: [TH | EN] where active language is highlighted
- Active: background #1E6FD9 white text
- Inactive: transparent, text #8FA3BC
- Border: 1px #1A3050, border-radius 100px

Behavior:
- Default state: Bilingual (TH + EN both shown)
- Click "EN": show English only — hide all Thai text globally
- Click "TH": show Thai only — hide all English text globally
- Toggle persists across all pages (global state)
- Apply to ALL text elements: labels, headings, badges, 
  button text, descriptions, tooltips

Placement: between "Last updated" timestamp and notification bell

═══════════════════════════════════════
FIX 2 — NOTIFICATION BELL (ทุกหน้า)
═══════════════════════════════════════

Wire up the notification bell icon in top nav so it works:

On click: open notification dropdown panel below the bell
Panel design:
- Width 360px, background #0F2140
- Border 1px #1A3050, border-radius 12px
- Shadow 0 8px 32px rgba(0,0,0,0.5)
- Header row: "Notifications / การแจ้งเตือน" SemiBold 16px 
  + "Mark all read" link right-aligned in #1E6FD9

Notification items (show these 3):

ITEM 1 — CRITICAL (unread, red left border):
  Icon: red alert circle
  Title: "Rule 2 Triggered / Rule 2 ถูก Trigger แล้ว"
  Body: "Recall ลดเหลือ 78% · Concept Drift Detected"
  Time: "2 min ago / 2 นาทีที่แล้ว"
  CTA button: "View Rule / ดู Rule" → navigate to ARIA Assistant page
  Background: rgba(239,68,68,0.08)

ITEM 2 — WARNING (unread, amber left border):
  Icon: amber warning triangle
  Title: "Pattern Coverage Warning / คำเตือน Pattern Coverage"
  Body: "Pattern Coverage อยู่ที่ 75% ต่ำกว่า Target 80%"
  Time: "15 min ago / 15 นาทีที่แล้ว"
  CTA button: "View KPI / ดู KPI" → navigate to Objectives & KPIs page

ITEM 3 — INFO (read, no border):
  Icon: blue info circle
  Title: "Champion Model Stable / โมเดล Champion เสถียร"
  Body: "XGBoost ทำงานปกติ · Status: STABLE"
  Time: "1 hour ago / 1 ชั่วโมงที่แล้ว"
  No CTA button
  Background: transparent, text #8FA3BC

Footer: "View all notifications / ดูการแจ้งเตือนทั้งหมด" 
  centered, blue text, border-top 1px #1A3050

Close: click outside panel to dismiss

═══════════════════════════════════════
FIX 3 — CHAT RECOMMENDED QUESTIONS
(Page 3 — ARIA Assistant)
═══════════════════════════════════════

In the ARIA Assistant chat panel, ABOVE the input bar,
add a "Recommended Questions" chip row that appears when chat is empty
or after each bot response.

Section label: "คำถามที่แนะนำ / Suggested Questions" 
  — 11px UPPERCASE #8FA3BC, margin-bottom 8px

Show 4 question chips in a 2×2 grid:
Each chip: background #0F2140, border 1px #1A3050, 
  border-radius 8px, padding 10px 14px, 
  text #F0F4F8 14px, hover: border #1E6FD9

CHIP 1: "Rule ไหน Triggered อยู่ตอนนี้? / Which rules are triggered?"
  On click: auto-send as user message → bot replies with Rule Engine summary

CHIP 2: "KPI ปัจจุบันเป็นยังไง? / What are current KPIs?"
  On click: auto-send → bot replies with all 5 KPI values + status

CHIP 3: "ทำไม Recall ถึงต่ำ? / Why is Recall low?"
  On click: auto-send → bot replies with SHAP top features explanation:
    "Feature สำคัญที่ดึง Recall ลง:
     · transaction_velocity: +0.34
     · amount_zscore: +0.21  
     · time_since_last_txn: +0.18
     Concept Drift ทำให้รูปแบบธุรกรรมเปลี่ยนไปจาก training data"

CHIP 4: "แนะนำ action ถัดไปให้หน่อย / What should I do next?"
  On click: auto-send → bot replies with priority action list:
    "ลำดับความสำคัญในการดำเนินการ:
     1. RE-TRAIN MODEL (Critical) — Recall 78% + Drift detected
     2. Monitor FPR (Watch) — 16.4% ใกล้ขีดจำกัด 20%
     3. ตรวจสอบ Pattern Coverage — 75% ต่ำกว่า Target 5%"

After user clicks chip OR sends any message:
  - Hide chip grid
  - Show chat response
  - After bot response finishes: show chip grid again below response
    with label "คำถามต่อไป / Follow-up Questions" 
    and show 2 contextual follow-up chips based on topic

═══════════════════════════════════════
FIX 4 — AUDIT ALL BUTTONS (ทุกหน้า)
═══════════════════════════════════════

Check and wire every button that currently has no interaction:

PAGE 1 — OBJECTIVES & KPIs:
  [RE-TRAIN MODEL] → open Retrain confirmation modal (3-step: Cancel / Off-peak / Now)
  [Why this decision?] → expand accordion with Triggered Conditions + SHAP + Rule Applied
  [Continue model] → green toast "Model continues monitoring / โมเดลดำเนินการต่อ"
  [Adjust threshold] → open threshold slider modal (τ 0.30–0.80, live Recall/FPR preview)
  [Retrain model] → same as RE-TRAIN MODEL modal above
  [Rollback] → destructive modal requiring typed "ROLLBACK" confirmation

PAGE 2 — DETECTION OVERVIEW:
  Threshold τ = 0.50 (clickable) → open same threshold slider modal
  "ⓘ" info icons on each metric card → show tooltip with formula and explanation:
    Model Recall: "TP / (TP + FN) — สัดส่วนธุรกรรมผิดปกติที่ตรวจพบได้"
    False Positive Rate: "FP / (FP + TN) — สัดส่วนแจ้งเตือนที่เป็น false alarm"
    Compliance Workload: "Flagged / Total (30d) — ภาระงานนักวิเคราะห์"
  "Watch / เฝ้าระวัง" badges → on click: open alert setting modal for that metric
    Modal: "Set Alert for [Metric] / ตั้งการแจ้งเตือน"
    Input: threshold value + [Save / ยกเลิก]
  "Healthy / ปกติดี" badges → on click: show green toast "No action required"
  "Export report" button (top-right) → show download toast 
    "Generating report... / กำลังสร้างรายงาน" → 
    "Report ready / รายงานพร้อมแล้ว — report_2025.pdf"

PAGE 3 — ARIA ASSISTANT:
  [A] Re-train ทันที → open Retrain modal → on confirm: 
    show 3-step progress toast (red→amber→green)
    update Rule 2 badge to "IN PROGRESS"
  [B] Re-train ช่วง Off-peak → open schedule modal:
    "Scheduled: 02:00 tonight / ตั้งเวลา Re-train คืนนี้เวลา 02:00"
    [Cancel] [Confirm Schedule]
    On confirm: amber toast "Re-train scheduled / ตั้งเวลาแล้ว"
  [C] ดู Detail ก่อน → auto-send "ขอดู KPI detail ทั้งหมด" in chat
    → bot responds with full KPI table
  [D] Monitor ต่อ / ยกเลิก → show amber toast 
    "Monitoring continued / กำลัง Monitor ต่อ — จะแจ้งเตือนเมื่อ KPI เปลี่ยนแปลง"
    → hide choice buttons, show new message in chat:
    "โอเค ระบบจะแจ้งเตือนอัตโนมัติหาก Recall ลดลงต่อเนื่อง"
  [View Detail] on each Rule card → expand that rule card inline showing:
    Condition table: Condition | Target | Current | Pass/Fail
    Last triggered timestamp
    [Force Trigger] button (destructive) + [Simulate] button (secondary)

ALL PAGES:
  ARIA floating button (bottom-right) → 
    On Pages 1 & 2: navigate to ARIA Assistant page
    On Page 3: scroll to top of chat / focus input bar
  Nav tab links → correctly navigate between pages
  KPI mini bar pills → on click: scroll to that metric's detail card on current page

═══════════════════════════════════════
MODAL GLOBAL SPEC (ใช้กับทุก modal)
═══════════════════════════════════════
- Background: #0F2140, border 1px #1A3050, border-radius 16px
- Overlay: rgba(0,0,0,0.65) backdrop-blur 4px
- Close [×] top-right always present
- Primary button: #1E6FD9, Secondary: border #1A3050 transparent
- Destructive button: #EF4444
- Toast: top-right, 320px wide, 3s auto-dismiss, border-radius 12px
- All modals and toasts must respect language toggle state