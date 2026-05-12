Fix the language toggle bug. Currently:
- EN mode: removes ALL text including English-only content (page goes blank/broken)
- TH mode: does not switch to Thai-only, bilingual text remains

Root cause: the toggle is hiding entire elements instead of 
swapping between EN and TH text variants.

DO NOT touch any layout, colors, or other functionality.
Only fix the language toggle logic.

═══════════════════════════════════════
CORRECT TOGGLE BEHAVIOR
═══════════════════════════════════════

The toggle has 3 states shown as [BI | TH | EN] pill:

STATE 1 — BI (Bilingual, default):
Show BOTH languages simultaneously.
Format: English text first, Thai text second (below or after /)
Example: "Objectives & Success Metrics (KPI) / วัตถุประสงค์และตัวชี้วัด"
ALL content visible, nothing hidden.

STATE 2 — EN (English only):
Show ONLY the English portion of every bilingual string.
Thai text hidden. Pure English labels remain unchanged.
The page must look complete — no blank spaces, no missing labels.
Example: show "Objectives & Success Metrics (KPI)" only

STATE 3 — TH (Thai only):
Show ONLY the Thai portion of every bilingual string.
English text hidden. Labels that have Thai translation show Thai only.
For labels with NO Thai translation yet: show English as fallback
(do not hide — show original EN text as fallback).
Example: show "วัตถุประสงค์และตัวชี้วัดความสำเร็จ" only

═══════════════════════════════════════
IMPLEMENTATION FIX
═══════════════════════════════════════

Every bilingual text element must be structured as TWO separate spans:

<span class="lang-en">English text</span>
<span class="lang-th">ข้อความภาษาไทย</span>

CSS rules:
/* BI mode (default) — show both */
body.lang-bi .lang-en { display: inline; }
body.lang-bi .lang-th { display: inline; }

/* EN mode — show EN only */
body.lang-en .lang-en { display: inline; }
body.lang-en .lang-th { display: none; }

/* TH mode — show TH only, fallback to EN if no TH */
body.lang-th .lang-en { display: none; }
body.lang-th .lang-th { display: inline; }
/* fallback: if .lang-th span is empty, show .lang-en instead */
body.lang-th .lang-th:empty + .lang-en,
body.lang-th .lang-th:empty { display: inline; }

Toggle button JS:
const toggle = document.querySelector('.lang-toggle');
const states = ['bi', 'en', 'th'];
let current = 0;
toggle.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-lang]');
  if (!btn) return;
  const lang = btn.dataset.lang;
  document.body.className = document.body.className
    .replace(/lang-(bi|en|th)/, '') + ' lang-' + lang;
  // update active pill state
  document.querySelectorAll('[data-lang]').forEach(b => 
    b.classList.toggle('active', b.dataset.lang === lang));
});

═══════════════════════════════════════
APPLY TO THESE SPECIFIC ELEMENTS
(Page 1 — Objectives & KPIs)
═══════════════════════════════════════

Fix each element to use the dual-span structure:

Page label:
  EN: "STEP 1 · DECISION SURFACE"
  TH: "ขั้นตอน 1 · พื้นผิวการตัดสินใจ"

Page title:
  EN: "Objectives & Success Metrics (KPI)"
  TH: "วัตถุประสงค์และตัวชี้วัดความสำเร็จ"

Page subtitle:
  EN: "Model performance against defined strategic thresholds. This screen answers one question: is the model still acceptable to use?"
  TH: "ประสิทธิภาพโมเดลเทียบกับเกณฑ์เชิงกลยุทธ์ที่กำหนด คำถามที่หน้านี้ตอบ: โมเดลยังคงยอมรับได้อยู่หรือไม่?"

Decision engine card:
  EN: "AUTOMATED DECISION ENGINE"
  TH: "ระบบตัดสินใจอัตโนมัติ"
  
  EN: "System status / : Critical /"  
  TH: "สถานะระบบ: วิกฤต"

Confidence label:
  EN: "CONFIDENCE /"
  TH: "ความมั่นใจ"
  
  EN: "High /"
  TH: "สูง"

Body text:
  EN: "Drift is present and at least one detection KPI has dropped below its target — retraining is required to restore coverage."
  TH: "ตรวจพบ Drift และ KPI การตรวจจับอย่างน้อยหนึ่งรายการต่ำกว่าเป้าหมาย — จำเป็นต้องฝึกโมเดลใหม่"

Why button:
  EN: "Why this decision?"
  TH: "ทำไมถึงตัดสินใจนี้?"

Recommended section:
  EN: "RECOMMENDED ACTIONS"
  TH: "การดำเนินการที่แนะนำ"
  
  EN: "Retrain model"
  TH: "ฝึกโมเดลใหม่"
  
  EN: "Detection capability is degraded — retraining is the safest path to restore Recall."
  TH: "ความสามารถในการตรวจจับลดลง — การฝึกใหม่คือทางที่ปลอดภัยที่สุดในการกู้คืน Recall"

Bullet points:
  EN: "Lower threshold to improve detection."
  TH: "ลด threshold เพื่อเพิ่มการตรวจจับ"
  
  EN: "Increase threshold to reduce false alerts."
  TH: "เพิ่ม threshold เพื่อลด false alerts"
  
  EN: "Review threshold or retrain for alert quality."
  TH: "ทบทวน threshold หรือฝึกใหม่เพื่อคุณภาพการแจ้งเตือน"
  
  EN: "Consider model rollback or retraining."
  TH: "พิจารณา Rollback หรือการฝึกโมเดลใหม่"

KPI Decision Table:
  EN: "KPI Decision Table"
  TH: "ตารางการตัดสินใจ KPI"
  
  EN: "Five strategic KPIs benchmarked against their target thresholds."
  TH: "KPI เชิงกลยุทธ์ 5 รายการเทียบกับเกณฑ์เป้าหมาย"
  
  EN: "meets target"
  TH: "ผ่านเกณฑ์"
  
  EN: "near threshold"
  TH: "ใกล้เกณฑ์"
  
  EN: "violation"
  TH: "ไม่ผ่านเกณฑ์"

Action buttons:
  EN: "Continue model"  TH: "ดำเนินการต่อ"
  EN: "Adjust threshold"  TH: "ปรับ Threshold"
  EN: "Retrain model"  TH: "ฝึกโมเดลใหม่"
  EN: "Rollback"  TH: "ย้อนกลับ"

═══════════════════════════════════════
TOGGLE BUTTON UI FIX
═══════════════════════════════════════

Current toggle shows [BI | TH | EN] — keep this design but fix:
- Each of the 3 segments must be individually clickable: 
  data-lang="bi", data-lang="th", data-lang="en"
- Active segment: background #1E6FD9, text white, font SemiBold
- Inactive segments: background transparent, text #8FA3BC
- Clicking any segment immediately applies that language mode
- Default active: BI
- Toggle state must persist when navigating between pages
  (store in localStorage key: "aml_lang_mode")

On page load:
  const saved = localStorage.getItem('aml_lang_mode') || 'bi';
  document.body.classList.add('lang-' + saved);
  // highlight correct toggle segment