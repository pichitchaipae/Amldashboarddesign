Fix two specific issues across all 3 pages of the AML Dashboard. 
Do NOT change layout, colors, or structure — only fix language consistency 
and wire up button interactions.

═══════════════════════════════════════
FIX 1 — BILINGUAL LANGUAGE CONSISTENCY
═══════════════════════════════════════

RULE: Every label, heading, description, badge, and button on ALL pages 
must show BOTH English AND Thai. Format: EN on top or left, TH below or in parentheses.
Reference Page 2 (ARIA Assistant) as the correct bilingual standard.

Apply bilingual text to these specific elements on Pages 1 & 3:

PAGE 1 — OBJECTIVES & KPIs:
- Page title: "Objectives & Success Metrics (KPI)" 
  → add TH subtitle: "วัตถุประสงค์และตัวชี้วัดความสำเร็จ"
- "STEP 1 · DECISION SURFACE" 
  → "STEP 1 · DECISION SURFACE / พื้นผิวการตัดสินใจ"
- "AUTOMATED DECISION ENGINE" 
  → add TH: "ระบบตัดสินใจอัตโนมัติ"
- "System status: Critical" 
  → "System status: Critical / สถานะระบบ: วิกฤต"
- "RE-TRAIN MODEL" button — keep EN, add TH tooltip: "ฝึกโมเดลใหม่"
- "CONFIDENCE · High" 
  → "CONFIDENCE / ความมั่นใจ · High / สูง"
- "Why this decision?" 
  → "Why this decision? / ทำไมถึงตัดสินใจนี้?"
- "RECOMMENDED ACTIONS" 
  → "RECOMMENDED ACTIONS / การดำเนินการที่แนะนำ"
- "Retrain model" 
  → "Retrain model / ฝึกโมเดลใหม่"
- "Detection capability is degraded..." 
  → add TH: "ความสามารถในการตรวจจับลดลง — การฝึกใหม่คือทางที่ปลอดภัยที่สุด"
- Bottom action buttons:
  "Continue model" → "Continue model / ดำเนินการต่อ"
  "Adjust threshold" → "Adjust threshold / ปรับ Threshold"
  "Retrain model" → "Retrain model / ฝึกใหม่"
  "Rollback" → "Rollback / ย้อนกลับ"

PAGE 3 — DETECTION OVERVIEW:
- Page title: "AML Detection Dashboard" 
  → add TH subtitle: "แดชบอร์ดตรวจจับ AML"
- "Monitor suspicious activity..." 
  → add TH: "ติดตามกิจกรรมต้องสงสัย การครอบคลุมการตรวจจับ และภาระงานของนักวิเคราะห์"
- "TIER 1" label → keep EN + add tooltip "ระดับ 1 — วัดผลโดยตรง"
- "Model Performance" → add TH: "ประสิทธิภาพของโมเดล"
- "Directly measured at the current threshold — audit-citable" 
  → add TH: "วัดโดยตรงที่ threshold ปัจจุบัน"
- Metric card labels:
  "Model Recall (current τ)" → add TH: "อัตราการตรวจจับ (τ ปัจจุบัน)"
  "False Positive Rate" → add TH: "อัตราแจ้งเตือนเกิน"
  "Compliance Workload" → add TH: "ภาระงาน Compliance"
- Badge labels: "Watch" → "Watch / เฝ้าระวัง", "Healthy" → "Healthy / ปกติดี"
- "TIER 2 — ESTIMATED" → keep EN + add TH: "ระดับ 2 — ประมาณการ"
- "Estimated Coverage & Impact" → add TH: "การครอบคลุมและผลกระทบโดยประมาณ"
- "Estimated SAR Coverage" → add TH: "การครอบคลุม SAR โดยประมาณ"
- "FATF Pattern Coverage" → add TH: "การครอบคลุมรูปแบบ FATF"
- "Detected Suspicious Value" → add TH: "มูลค่าต้องสงสัยที่ตรวจพบ"
- "Threshold τ = 0.50" → add TH label: "เกณฑ์การตัดสิน"
- "Live · last refreshed 2 min ago" → add TH: "สด · อัปเดตล่าสุด 2 นาทีที่แล้ว"

═══════════════════════════════════════
FIX 2 — WIRE UP ACTION BUTTONS (PAGE 1)
═══════════════════════════════════════

The 4 bottom action buttons on Page 1 must have real interactions:

BUTTON A — "Continue model / ดำเนินการต่อ":
- On click: show confirmation toast (top-right, green)
  Message: "Model continues monitoring / โมเดลดำเนินการต่อ — Rule 1 Active"
  Auto-dismiss after 3 seconds

BUTTON B — "Adjust threshold / ปรับ Threshold":
- On click: open modal overlay with:
  Title: "Adjust Detection Threshold / ปรับค่า Threshold"
  Slider: current value τ = 0.50, range 0.30–0.80, step 0.05
  Below slider: show live preview text:
    "Estimated Recall at this threshold: XX%"
    "Estimated FPR at this threshold: XX%"
  Buttons: [Cancel / ยกเลิก] [Apply / บันทึก]
  On Apply: close modal, update KPI mini bar values, show amber toast 
    "Threshold updated to τ = X.XX / อัปเดต Threshold แล้ว"

BUTTON C — "Retrain model / ฝึกใหม่":
- On click: open confirmation modal with:
  Title: "Confirm Re-train / ยืนยันการฝึกโมเดลใหม่"
  Body: "This will trigger Rule 2 action. Estimated duration: 2–4 hours.
         การดำเนินการนี้จะใช้เวลา 2–4 ชั่วโมง"
  Warning card (amber): "Model will be temporarily unavailable during retraining"
  Buttons: 
    [Cancel / ยกเลิก] (secondary)
    [Re-train Now / ฝึกทันที] (primary blue)
    [Schedule Off-peak 02:00 / ตั้งเวลา] (secondary)
  On confirm: close modal, show red→amber→green progress toast:
    Step 1 (red): "Initiating re-train... / กำลังเริ่มต้นฝึกโมเดล..."
    Step 2 (amber): "Training in progress / กำลังฝึก..."
    Step 3 (green): "Re-train complete / ฝึกโมเดลเสร็จแล้ว"

BUTTON D — "Rollback / ย้อนกลับ":
- On click: open destructive confirmation modal with:
  Title: "Emergency Rollback / ย้อนกลับฉุกเฉิน"
  Body: "This will revert to the previous model version. 
         การดำเนินการนี้จะย้อนกลับเป็นโมเดลเวอร์ชันก่อนหน้า"
  Warning card (red border + glow): 
    "⚠️ This action cannot be undone / การดำเนินการนี้ไม่สามารถยกเลิกได้"
  Input field: Type "ROLLBACK" to confirm / พิมพ์ "ROLLBACK" เพื่อยืนยัน
  Buttons:
    [Cancel / ยกเลิก] (secondary)
    [Confirm Rollback] (red, disabled until input matches)
  On confirm: show critical red toast + update Rule Engine status on all pages

ALSO WIRE — "Why this decision?" button (Page 1):
- On click: expand inline accordion below the button showing:
  Section "Triggered Conditions / เงื่อนไขที่ trigger":
    · Recall 78% < 85% target (FAIL)
    · Drift detected: Yes
    · Pattern Coverage 75% < 80% target (FAIL)
  Section "SHAP Top Features / Feature สำคัญ":
    · transaction_velocity: +0.34
    · amount_zscore: +0.21
    · time_since_last_txn: +0.18
  Section "Rule Applied / Rule ที่ใช้":
    · Rule 2: Drift == Yes AND Recall < 85% → RE-TRAIN MODEL
  Close button [×] at top-right of accordion

═══════════════════════════════════════
GLOBAL NOTES
═══════════════════════════════════════
- All modals: dark background #0F2140, border 1px #1A3050, border-radius 16px
- Modal overlay: rgba(0,0,0,0.6) backdrop blur 4px
- Toast notifications: top-right, width 320px, border-radius 12px, auto-dismiss 3s
- KPI mini bar and nav bar: do NOT change
- ARIA floating button: do NOT change
- Page 2 (ARIA Assistant): already correct — do NOT touch