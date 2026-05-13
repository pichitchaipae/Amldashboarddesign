You are refining an existing AML Dashboard in Figma Make that has 3 pages 
with inconsistent styling. Fix ALL pages to match one unified dark design system. 
Do NOT redesign layout — only fix: theme, colors, fonts, nav consistency, 
and chatbot placement.

═══════════════════════════════════════
PROBLEM SUMMARY — FIX THESE ISSUES
═══════════════════════════════════════

ISSUE 1 — THEME MISMATCH:
Pages "Detection Overview" and "Objectives & KPIs" are currently LIGHT theme 
(white background, dark text). Convert them fully to dark theme.
Replace all white/light backgrounds with #0A1628 (base) and #0F2140 (card surface).
Replace all dark body text with #F0F4F8. Replace light card fills with #0F2140.
Keep all content and layout structure intact — only change colors.

ISSUE 2 — NAV BAR INCONSISTENCY:
Page 1 (ARIA Assistant): nav shows "ARIA / AML Intelligence Assistant" branding.
Pages 2 & 3: nav shows "Sentinel AML / Compliance Intelligence" — different brand name.
Fix: Unify ALL pages to use identical nav bar from Page 1 spec:
- Logo: ARIA icon + "ARIA" wordmark + "AML Intelligence Assistant" subtitle
- Nav tabs: [Objectives & KPIs] [Detection Overview] [ARIA Assistant]
- Right side: CHAMPION pill + XGBoost label + Status STABLE badge 
  + last updated + notification bell + avatar
- Height: 64px, background #0A1628, border-bottom 1px #1A3050
- Active tab: filled pill #1E6FD9 white text, inactive: #8FA3BC text no fill

ISSUE 3 — CHATBOT PLACEMENT INCONSISTENCY:
Page 1: Chatbot is correctly embedded as main content panel — keep as-is.
Page 3: Chatbot appears as a right sidebar panel — this is wrong.
Fix Page 3: Remove the sidebar chatbot panel entirely.
Add ARIA floating button (bottom-right, fixed position) on Pages 2 and 3:
- Pill shape, background #1E6FD9
- Icon: chat bubble + label "ARIA"
- If alert active: amber pulsing ring + "1 Alert" badge on button
- On click: navigate to Page 1 (ARIA Assistant page)
- Position: 32px from bottom, 32px from right edge

ISSUE 4 — KPI MINI BAR MISSING ON PAGES 2 & 3:
Add KPI mini status bar below nav on all pages:
- Height: 48px, background #0F2140, border-bottom 1px #1A3050
- 5 pills: Recall 78% (RED) | FPR 16.4% (GREEN) | Flagged 8.7% (AMBER) 
  | Pattern Coverage 75% (AMBER) | Precision 29.1% (AMBER)
- Each pill: metric name + value + colored status dot
- Right side: "Last updated 2 min ago" in #8FA3BC 12px

═══════════════════════════════════════
PAGE-BY-PAGE FIX INSTRUCTIONS
═══════════════════════════════════════

PAGE 1 — ARIA ASSISTANT (Image 1):
Status: mostly correct, minor fixes only.
- Keep dark theme as-is ✓
- Keep chatbot panel layout as-is ✓
- Fix nav: ensure tab labels match exactly [Objectives & KPIs] [Detection Overview] [ARIA Assistant]
- Add KPI mini bar below nav if missing
- Ensure ARIA floating button does NOT appear on this page 
  (chatbot is already the main content)

PAGE 2 — DETECTION OVERVIEW (Image 2):
Status: LIGHT THEME — full dark conversion needed.
- Convert background: white → #0A1628
- Convert all cards: white/light gray → #0F2140, border 1px #1A3050
- Convert all body text: dark → #F0F4F8
- Convert secondary text: gray → #8FA3BC
- Keep all metric values, labels, tier badges, and layout intact
- Status badges: "Watch" → amber #F59E0B, "Healthy" → green #10B981, 
  "Info" → blue #1E6FD9 — use pill shape with 15% opacity fill + colored border
- TIER labels: background #1A3050, text #8FA3BC, border 1px #1A3050
- Threshold slider area: convert to dark surface #0F2140
- Fix nav to match unified spec above
- Add KPI mini bar
- Add ARIA floating button bottom-right

PAGE 3 — OBJECTIVES & KPIs (Image 3):
Status: LIGHT THEME + wrong chatbot placement — full fix needed.
- Convert background and all cards to dark theme (same as Page 2 fix above)
- Remove the right sidebar chatbot panel entirely
- The main content area should expand to full width after removing sidebar
- Keep "STEP 1 · DECISION SURFACE" label and all KPI content intact
- Keep "AUTOMATED DECISION ENGINE / Rule 2 / System status: Critical" 
  card — but restyle to dark: background #0F2140, Rule 2 badge red #EF4444, 
  Critical text #EF4444
- Keep "RECOMMENDED ACTIONS / Retrain model" section at bottom — restyle dark
- Fix nav to match unified spec above
- Add KPI mini bar
- Add ARIA floating button bottom-right

═══════════════════════════════════════
GLOBAL STYLE RULES — ENFORCE ON ALL PAGES
═══════════════════════════════════════

COLORS:
- Base background:    #0A1628
- Card surface:       #0F2140
- Border:             #1A3050
- Primary accent:     #1E6FD9
- Safe / Pass:        #10B981
- Warning / Watch:    #F59E0B
- Critical / Fail:    #EF4444
- Text primary:       #F0F4F8
- Text secondary:     #8FA3BC

TYPOGRAPHY:
- EN: Inter | TH: Noto Sans Thai
- Metric values: Bold 32px #F0F4F8
- Section headers: SemiBold 20px #F0F4F8
- Card labels: Medium 12px UPPERCASE #8FA3BC
- Body: Regular 14px #F0F4F8
- Badges: SemiBold 11px

CARDS:
- Background #0F2140, border 1px #1A3050
- Border radius 12px, shadow 0 4px 24px rgba(0,0,0,0.4)
- Triggered/critical cards: border #EF4444, glow 0 0 16px rgba(239,68,68,0.25)

STATUS BADGES:
- Pill shape, border-radius 100px
- PASS/CLEAR/STABLE: #10B981 dot + text, bg rgba(16,185,129,0.15)
- WARN/WATCH: #F59E0B dot + text, bg rgba(245,158,11,0.15)
- FAIL/TRIGGERED/CRITICAL: #EF4444 dot + text, bg rgba(239,68,68,0.15)