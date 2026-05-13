Redesign and unify an existing AML Monitoring Dashboard that currently has 2-3 inconsistent pages. 
Apply a strict shared Design System across ALL pages so fonts, colors, spacing, navigation, 
and components are identical on every screen.

═══════════════════════════════════════
DESIGN SYSTEM — APPLY TO ALL PAGES
═══════════════════════════════════════

COLORS (use exact hex, no variations):
- Background base:      #0A1628
- Card surface:         #0F2140
- Border / divider:     #1A3050
- Primary accent:       #1E6FD9  (interactive, buttons, links)
- Safe / Clear:         #10B981  (green)
- Warning:              #F59E0B  (amber)
- Critical / Alert:     #EF4444  (red)
- Text primary:         #F0F4F8
- Text secondary:       #8FA3BC
- Text disabled:        #3D5470

TYPOGRAPHY (enforce strictly):
- EN font: Inter (Regular 14, Medium 15, SemiBold 16, Bold 20, 24, 32)
- TH font: Noto Sans Thai (same weight scale as Inter)
- Section headers: Bold 20px, color #F0F4F8
- Card labels: Medium 12px UPPERCASE, color #8FA3BC
- Body text: Regular 14px, color #F0F4F8
- Metric values: Bold 32px, color #F0F4F8
- Badges / Pills: SemiBold 11px

SPACING & LAYOUT:
- Base grid: 8px
- Card padding: 24px
- Section gap: 32px
- Border radius — cards: 12px, buttons: 8px, badges: 100px (pill)
- Page margin: 40px horizontal

COMPONENT RULES (same across all pages):
- Status badge: pill shape, colored background at 15% opacity + border + colored dot + text
  GREEN = CLEAR / STABLE, AMBER = WARNING, RED = TRIGGERED / CRITICAL
- All cards: background #0F2140, border 1px #1A3050, shadow: 0 4px 24px rgba(0,0,0,0.4)
- Triggered/active cards: border 1px #EF4444, glow: 0 0 16px rgba(239,68,68,0.25)
- Primary button: fill #1E6FD9, radius 8px, text white SemiBold 14px
- Secondary button: border 1px #1E6FD9, transparent fill, text #1E6FD9
- Destructive button: fill #EF4444, text white
- All hover states: brightness +10%, subtle glow in accent color

═══════════════════════════════════════
SHARED COMPONENTS — APPEAR ON EVERY PAGE
═══════════════════════════════════════

TOP NAVIGATION BAR (fixed, identical on all pages):
- Height: 64px, background #0A1628, border-bottom 1px #1A3050
- Left: Logo icon + "ARIA" wordmark (blue) + subtitle "AML Intelligence Assistant" (secondary text)
- Center: Nav links — [Overview] [Rule Engine] [ARIA Chatbot] [History] 
  Active page: text #1E6FD9 + underline 2px #1E6FD9
  Inactive: text #8FA3BC
- Right: 
  · Model status pill: "XGBoost STABLE" (green badge)
  · Notification bell with red dot if alert exists
  · Avatar circle with user initials

CHATBOT ENTRY POINT (on every page, bottom-right corner):
- Floating pill button: background #1E6FD9, icon (chat bubble) + label "ARIA"
- If alert is active: amber pulsing ring around button + "1 Alert" badge
- On click: navigate to dedicated ARIA Chatbot page
- Position: fixed bottom-right, 32px from edges, z-index top layer

KPI MINI STATUS BAR (below top nav, identical on all pages):
- Height: 48px, background #0F2140, border-bottom 1px #1A3050
- Show 5 KPI pills in a row: Recall | FPR | Flagged Rate | Pattern Coverage | Precision
- Each pill: metric name + current value + colored dot (green/amber/red by threshold)
- Right side: "Last updated: 10 min ago" in secondary text

═══════════════════════════════════════
PAGE 1 — OVERVIEW DASHBOARD
═══════════════════════════════════════

Below shared nav + KPI bar, show:

ROW 1 — KPI METRIC CARDS (5 cards, equal width):
Each card contains:
- Icon (top-left)
- Label EN + TH (e.g. "Recall / อัตราการตรวจจับ")
- Large value: e.g. "78%" in Bold 32px
- Target line: "Target ≥ 85%" in secondary text 12px
- Delta vs last period: e.g. "▼ 7% vs last week" in red
- Bottom color bar: full width, 4px height, colored by status

ROW 2 — TWO COLUMNS:
Left (60%): Rule Engine Status List
- 5 rule rows, each with:
  · Rule number + name EN/TH
  · Condition summary (compact, 1 line)
  · Status badge (CLEAR / WARNING / TRIGGERED)
  · "View Detail ›" link in blue
- Triggered rule (Rule 2): red glowing card, expanded slightly

Right (40%): System Health + Model Info
- Champion model: XGBoost — Recall 78%, Precision 34%
- Challenger model: Random Forest — Recall 74%, Precision 31%
- Delta card: "Champion leads by +4% Recall"
- System status: Latency OK (green) | CPU 67% (amber)
- Drift indicators: Data Drift DETECTED (red) | Concept Drift DETECTED (red)

═══════════════════════════════════════
PAGE 2 — RULE ENGINE DETAIL
═══════════════════════════════════════

Full page rule table with 5 expandable rule cards:
Each rule card (collapsed default):
- Header row: Rule number | Rule name EN/TH | Status badge | Expand chevron
- Expanded state shows:
  · Condition table: Condition | Target | Current Value | Pass/Fail
  · Action that will be triggered
  · Last triggered: date/time
  · "Simulate Rule" button (secondary)
  · "Force Trigger" button (destructive, requires confirm)

Below all rules:
- Threshold Management section
- Table: Metric | Current Threshold | Editable input | Save button
- "Reset All to Default" button (secondary, bottom right)

═══════════════════════════════════════
PAGE 3 — ARIA CHATBOT (Dedicated Page)
═══════════════════════════════════════

Full-page chat interface:

LEFT SIDEBAR (280px):
- Section: "Active Alerts / การแจ้งเตือน"
  · Alert cards for each triggered rule, click to load context into chat
- Section: "Quick Actions / คำสั่งด่วน"
  · Buttons: [ดู KPI] [สถานะ Rule] [ประวัติ Action] [ตั้ง Alert]
- Section: "Chat History / ประวัติการสนทนา"
  · List of past sessions with date

MAIN CHAT AREA:
Chat history showing this example conversation flow:

1. SYSTEM MESSAGE (bot, full width):
   Icon + "ARIA" label
   "ตรวจพบ Concept Drift — Rule 2 Triggered"
   "Recall: 78% (ต่ำกว่า Target 85%) | Drift: Detected"
   Timestamp: 09:42

2. BOT RECOMMENDATION CARD:
   Title: "แนะนำการดำเนินการ / Recommended Action"
   Action: RE-TRAIN MODEL
   Confidence badge: "87% Confidence"
   Reason: "Drift detected + Recall below threshold for 3 consecutive checks"
   Risk warning: "⚠️ หากไม่ดำเนินการภายใน 24 ชม. Recall อาจลดลงต่อเนื่อง"

3. CHOICE ACTION BUTTONS (2x2 grid):
   [A] Re-train ทันที          [B] Re-train ช่วง Off-peak 02:00
   [C] ดู Detail เพิ่มเติม     [D] Monitor ต่อ / ยกเลิก
   Button A styled as primary blue, D as secondary, no destructive here

4. USER MESSAGE BUBBLE (right aligned, blue background):
   "ขอดู detail ก่อน"

5. BOT DETAIL RESPONSE:
   Expandable data table showing current KPI vs target vs threshold
   SHAP explanation: "Feature ที่ส่งผลมากที่สุด: transaction_velocity (+0.34), amount_zscore (+0.21)"
   After table, repeat choice buttons

CHAT INPUT BAR (bottom, sticky):
- Left: attachment icon
- Center: input field placeholder "พิมพ์คำถามหรือคำสั่ง / Type a command..." 
- Right: send button (blue) + mic icon
- Above input: quick suggestion chips: 
  ["ดู KPI ทั้งหมด"] ["Rule ไหน Triggered?"] ["Re-train ทันที"] ["ดู Log ล่าสุด"]

═══════════════════════════════════════
CONSISTENCY ENFORCEMENT NOTES
═══════════════════════════════════════

- Every page MUST use identical Top Nav, KPI Mini Bar, and ARIA floating button
- No page should introduce new colors outside the defined palette
- No page should use a different font or font size outside the type scale
- All card components must share identical border-radius, shadow, and padding
- Status badges must use identical shape and color rules on all pages
- Navigation active state must correctly highlight current page
- ARIA floating button must appear at identical position on all pages
- Bilingual labels: always EN on top / TH below in secondary color, same size ratio throughout