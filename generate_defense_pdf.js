import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, 'public', 'SIH_SeedhaMandi_Master_Defense_Guide.pdf');

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating comprehensive SIH defense PDF at:', outputPath);

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 45, bottom: 45, left: 45, right: 45 },
  bufferPages: true,
  autoFirstPage: true
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Palette
const C = {
  primaryDark: '#064e3b',   // emerald-900
  primaryDeep: '#022c22',   // emerald-950
  primaryMid: '#059669',    // emerald-600
  primaryLight: '#ecfdf5',  // emerald-50
  accentGold: '#d97706',    // amber-600
  accentGoldBg: '#fffbeb',  // amber-50
  textDark: '#1c1917',      // stone-900
  textMuted: '#57534e',     // stone-600
  borderLight: '#e7e5e4',   // stone-200
  cardBg: '#f8fafc',        // slate-50
  white: '#ffffff',
  redDark: '#991b1b',
  redBg: '#fef2f2'
};

const PAGE_WIDTH = doc.page.width - 90; // 595.28 - 90 = 505.28 pt

// Helper functions for layout
function checkPageSpace(needed = 60) {
  if (doc.y + needed > doc.page.height - 55) {
    doc.addPage();
  }
}

function renderHeaderBanner(title, subtitle, badgeText = 'SIH 2026 OFFICIAL DEFENSE MANUAL') {
  const startY = doc.y;
  doc.rect(45, startY, PAGE_WIDTH, 42)
     .fill(C.primaryDark);

  doc.fillColor(C.accentGold)
     .fontSize(8)
     .font('Helvetica-Bold')
     .text(badgeText.toUpperCase(), 55, startY + 8, { width: PAGE_WIDTH - 20 });

  doc.fillColor(C.white)
     .fontSize(14)
     .font('Helvetica-Bold')
     .text(title, 55, startY + 18, { width: PAGE_WIDTH - 20 });

  doc.y = startY + 48;

  if (subtitle) {
    doc.fillColor(C.textMuted)
       .fontSize(9.5)
       .font('Helvetica-Oblique')
       .text(subtitle, 45, doc.y, { width: PAGE_WIDTH });
    doc.moveDown(0.5);
  }
}

function renderSectionTitle(title, tag = '') {
  checkPageSpace(50);
  doc.moveDown(0.4);
  const y = doc.y;
  
  // Left decorative bar
  doc.rect(45, y, 4, 18).fill(C.primaryMid);

  doc.fillColor(C.primaryDark)
     .fontSize(13)
     .font('Helvetica-Bold')
     .text(title, 55, y + 2, { width: PAGE_WIDTH - 80 });

  if (tag) {
    doc.fillColor(C.accentGold)
       .fontSize(8.5)
       .font('Helvetica-Bold')
       .text(`[ ${tag} ]`, 45, y + 4, { align: 'right', width: PAGE_WIDTH });
  }

  doc.y = y + 24;
}

function renderSubSection(title) {
  checkPageSpace(35);
  doc.moveDown(0.2);
  doc.fillColor(C.primaryDeep)
     .fontSize(10.5)
     .font('Helvetica-Bold')
     .text(title, 45, doc.y, { width: PAGE_WIDTH });
  doc.moveDown(0.2);
}

function renderCallout(title, body, type = 'info') {
  checkPageSpace(75);
  const startY = doc.y;
  const bgColor = type === 'warning' ? C.accentGoldBg : type === 'danger' ? C.redBg : C.primaryLight;
  const borderColor = type === 'warning' ? C.accentGold : type === 'danger' ? C.redDark : C.primaryMid;
  const titleColor = type === 'warning' ? C.accentGold : type === 'danger' ? C.redDark : C.primaryDark;

  // Measure text height approximately
  doc.font('Helvetica').fontSize(8.5);
  const textHeight = doc.heightOfString(body, { width: PAGE_WIDTH - 24 });
  const boxHeight = textHeight + 26;

  doc.rect(45, startY, PAGE_WIDTH, boxHeight)
     .fillAndStroke(bgColor, borderColor);

  doc.fillColor(titleColor)
     .fontSize(9.5)
     .font('Helvetica-Bold')
     .text(title, 55, startY + 6, { width: PAGE_WIDTH - 20 });

  doc.fillColor(C.textDark)
     .fontSize(8.5)
     .font('Helvetica')
     .text(body, 55, startY + 20, { width: PAGE_WIDTH - 20 });

  doc.y = startY + boxHeight + 8;
}

function renderQuestionBlock(qNum, question, intent, answerText, demoLocation) {
  checkPageSpace(110);
  const startY = doc.y;

  // Header pill for Question
  doc.rect(45, startY, PAGE_WIDTH, 20)
     .fill(C.primaryDeep);

  doc.fillColor(C.accentGold)
     .fontSize(8.5)
     .font('Helvetica-Bold')
     .text(`QUESTION ${qNum}`, 52, startY + 5);

  doc.fillColor(C.white)
     .fontSize(8.5)
     .font('Helvetica-Bold')
     .text(`"${question}"`, 125, startY + 5, { width: PAGE_WIDTH - 85, ellipsis: true });

  doc.y = startY + 24;

  // Intent
  if (intent) {
    doc.fillColor(C.textMuted)
       .fontSize(8)
       .font('Helvetica-Oblique')
       .text(`Judge Intent & Cross-Examination Angle: ${intent}`, 45, doc.y, { width: PAGE_WIDTH });
    doc.moveDown(0.2);
  }

  // Answer Body Box
  const bodyStartY = doc.y;
  doc.font('Helvetica').fontSize(8.5);
  const ansHeight = doc.heightOfString(answerText, { width: PAGE_WIDTH - 20 });
  const demoHeight = demoLocation ? 20 : 0;
  const totalBoxHeight = ansHeight + demoHeight + 14;

  doc.rect(45, bodyStartY, PAGE_WIDTH, totalBoxHeight)
     .fillAndStroke(C.cardBg, C.borderLight);

  doc.fillColor(C.textDark)
     .fontSize(8.5)
     .font('Helvetica')
     .text(answerText, 53, bodyStartY + 7, { width: PAGE_WIDTH - 16, lineGap: 1.5 });

  if (demoLocation) {
    const demoY = bodyStartY + ansHeight + 9;
    doc.rect(49, demoY, PAGE_WIDTH - 8, 16)
       .fill(C.primaryLight);
    doc.fillColor(C.primaryDark)
       .fontSize(7.5)
       .font('Helvetica-Bold')
       .text(`PROTOTYPE PROOF / LIVE DEMO CLICK: ${demoLocation}`, 55, demoY + 4, { width: PAGE_WIDTH - 20 });
  }

  doc.y = bodyStartY + totalBoxHeight + 8;
}

// -------------------------------------------------------------
// COVER / TITLE BLOCK
// -------------------------------------------------------------
renderHeaderBanner(
  'SeedhaMandi (Team AgriNova) — Master Defense Guide',
  'Comprehensive Slide-by-Slide Defense, Cross-Questioning Answers, Technical Architecture & Viva Handbook',
  'SMART INDIA HACKATHON (SIH) 2026 • PROBLEM ID: 26033'
);

// High-level metadata block
doc.rect(45, doc.y, PAGE_WIDTH, 48).fillAndStroke(C.cardBg, C.borderLight);
const metaY = doc.y + 6;
doc.fillColor(C.textDark).fontSize(8).font('Helvetica-Bold').text('PROBLEM STATEMENT:', 55, metaY);
doc.font('Helvetica').text('Multiple intermediaries reduce farmers earnings and increase consumer prices.', 160, metaY, { width: 380 });

doc.font('Helvetica-Bold').text('OFFICIAL TRACK:', 55, metaY + 12);
doc.font('Helvetica').text('Agriculture, FoodTech & Rural Development', 160, metaY + 12);

doc.font('Helvetica-Bold').text('WORKING PROTOTYPE:', 55, metaY + 24);
doc.font('Helvetica').text('SeedhaMandi (Vite React 19 + PWA Offline + Multimodal Logistics + Gemini AI SeedhaMitra)', 160, metaY + 24);

doc.y = metaY + 46;

// -------------------------------------------------------------
// SECTION 1: PROBLEM STATEMENT 26033 MAPPING
// -------------------------------------------------------------
renderSectionTitle('1. SIH Problem Statement 26033 vs Working Prototype', 'CORE ALIGNMENT');

const tableData = [
  {
    req: '1. Direct Farm-to-Fork Marketplace',
    broken: '4 to 6 traditional intermediaries (Kachha Arhatiya, Pucca Dalal, Sub-wholesaler, Retailer) siphon 52-65% of consumer spend.',
    solution: 'Direct B2C & B2B listing engine with automated escrow payment release upon delivery verification (zero middlemen commission).',
    location: 'Navbar > "Marketplace" tab + "Farmer Dashboard" > "List Harvest"'
  },
  {
    req: '2. Multimodal Logistics Support',
    broken: 'Rural dead-haul freight, unutilized return-trips, and zero cold-chain pooling lead to 28-40% perishability loss.',
    solution: 'Consolidated milk runs, backhaul utilization, reefer temperature monitoring, and shared LTL (less-than-truckload) freight pooling.',
    location: 'Navbar > "Logistics" tab > "Active Dispatches" & "Logistics Notification Center"'
  },
  {
    req: '3. AI Demand Forecasting & Route Optimization',
    broken: 'Farmers sow blind to consumer demand, triggering cyclical gluts and price crashes (e.g. Rs 2/kg farmgate tomatoes vs Rs 60 in cities).',
    solution: 'SeedhaMitra AI powered by Gemini: Live mandi price benchmarking, 7-day crop demand forecast, and Haversine multi-stop milk run routing.',
    location: 'Navbar > "Demand Intelligence" tab & "Ask SeedhaMitra AI" floating assistant'
  },
  {
    req: '4. Low-Bandwidth Resilience & Offline Access',
    broken: 'Rural 2G/patchy connectivity renders standard heavy web apps useless in farm mandis.',
    solution: 'Offline-First Progressive Web App (PWA) with Service Worker cache, IndexedDB local fallback, and auto-sync queue upon reconnection.',
    location: 'Top Banner > "📡 Test Offline / 2G" button + live PWA status chip'
  }
];

tableData.forEach((row, idx) => {
  checkPageSpace(68);
  const y = doc.y;
  doc.rect(45, y, PAGE_WIDTH, 62).fillAndStroke(C.cardBg, C.borderLight);

  doc.rect(45, y, 4, 62).fill(C.primaryMid);

  doc.fillColor(C.primaryDark).fontSize(9).font('Helvetica-Bold')
     .text(row.req, 54, y + 5);

  doc.fillColor(C.redDark).fontSize(7.5).font('Helvetica-Bold').text('BROKEN REALITY:', 54, y + 17);
  doc.fillColor(C.textMuted).font('Helvetica').text(row.broken, 130, y + 17, { width: PAGE_WIDTH - 90 });

  doc.fillColor(C.primaryMid).fontSize(7.5).font('Helvetica-Bold').text('OUR SOLUTION:', 54, y + 31);
  doc.fillColor(C.textDark).font('Helvetica').text(row.solution, 130, y + 31, { width: PAGE_WIDTH - 90 });

  doc.fillColor(C.accentGold).fontSize(7.5).font('Helvetica-Bold').text('LIVE DEMO:', 54, y + 47);
  doc.fillColor(C.textDark).font('Helvetica-Oblique').text(row.location, 130, y + 47, { width: PAGE_WIDTH - 90 });

  doc.y = y + 68;
});

// -------------------------------------------------------------
// SECTION 2: SLIDE-BY-SLIDE DEFENSE & PRACTICAL QUESTIONS
// -------------------------------------------------------------
doc.addPage();
renderSectionTitle('2. Slide-by-Slide Defense, Cross-Questioning & Answers', 'SLIDES 1 TO 6');

// SLIDE 1
renderSubSection('SLIDE 1: Title Slide & Project Identity (SeedhaMandi / AgriNova)');
doc.fillColor(C.textMuted).fontSize(8).font('Helvetica')
   .text('Focus: Setting high credibility, demonstrating working software immediately, and asserting alignment with SIH 26033.', 45, doc.y);
doc.moveDown(0.3);

renderQuestionBlock(
  '1.1',
  'What is the fundamental difference between SeedhaMandi and standard agricultural apps like DeHaat, Ninjacart, or e-NAM?',
  'Tests competitive awareness and unique value proposition.',
  'e-NAM is purely an institutional APMC auction board that still requires physical presence at mandis and relies on licensed commission agents. Ninjacart operates a heavy warehouse-inventory model where Ninjacart acts as the new corporate middleman, dictating procurement prices. SeedhaMandi is a pure direct peer-to-peer digital marketplace: farmers set their own farmgate prices, consumers and bulk buyers purchase directly, payments are held in automated escrow, and open multimodal logistics partners provide pooled transit without any middleman inventory markup.',
  'Top announcement bar: "100% Direct Farm-to-Consumer Digital Marketplace • Zero Middlemen"'
);

renderQuestionBlock(
  '1.2',
  'Who is your primary customer: individual retail consumers or large B2B institutions?',
  'Tests market sizing and go-to-market strategy clarity.',
  'SeedhaMandi uses a dual-sided marketplace model. In Phase 1, the high-volume anchor revenue comes from bulk buyers (FPOs, restaurant clusters, boarding schools, and kirana consortiums) who order full truckloads (FTL) and less-than-truckloads (LTL). In parallel, residential consumer societies buy consolidated farm baskets. B2B provides logistics density and baseline volume, while B2C delivers high margin and direct consumer brand equity.',
  'Navbar role switcher: toggle between "Consumer", "Farmer", and "Logistics Partner"'
);

// SLIDE 2
renderSubSection('SLIDE 2: Problem Statement & Field Reality');
doc.fillColor(C.textMuted).fontSize(8).font('Helvetica')
   .text('Focus: Quantifying the economic exploitation of farmers and real-world post-harvest supply chain leakage.', 45, doc.y);
doc.moveDown(0.3);

renderQuestionBlock(
  '2.1',
  'You claim intermediaries take 52% to 65% of the consumer rupee. Can you break down where that money actually goes?',
  'Judges test whether you understand real-world mandi mechanics or just copied numbers from the web.',
  'Taking fresh tomatoes as an empirical example: When retail price in Mumbai/Delhi is Rs 50/kg, the farmer receives only Rs 12-14/kg at farmgate. The remaining Rs 36-38 is extracted across 5 stages: (1) Village aggregator takes 5-8% for village-to-mandi hauling; (2) APMC Kachha Arhatiya deducts 6-8.5% commission plus weighing charges; (3) Wholesale Dalal charges 8-12% auction markup; (4) Secondary urban wholesaler adds 15-20% for cold-storage and city transit; (5) Retailer/vendor adds 25-30% to cover transit spoilage (28-40% wastage). SeedhaMandi eliminates layers 1, 2, 3, and 4 entirely, pooling logistics directly.',
  'SIH Prototype Modal > "Before & After Price Spread Comparison"'
);

renderQuestionBlock(
  '2.2',
  'Why do farmers sell to local commission agents (Arhatiyas) even when they know they are being cheated?',
  'Critical field reality question regarding rural debt cycles and working capital.',
  'Farmers are bound to Arhatiyas not by preference, but by working capital entrapment. Arhatiyas provide informal, immediate cash credit for seeds, fertilizers, and family emergencies without paperwork. In exchange, the farmer is obligated to sell the harvest through that Arhatiya. SeedhaMandi solves this through our digital invoice escrow mechanism: upon loading the consignment with an authorized logistics partner, farmers receive an instantaneous digital warehouse receipt and verified dispatch token, which unlocks low-interest working capital credit from partner rural banks (NABARD/KCC), ending Arhatiya debt dependency.',
  'Farmer Dashboard > "Escrow Payout Status" & "Instant Dispatch Receipt"'
);

// SLIDE 3
renderSubSection('SLIDE 3: Proposed Solution & Core Innovation');
doc.fillColor(C.textMuted).fontSize(8).font('Helvetica')
   .text('Focus: Proving the 4 pillars: Direct Marketplace, Multimodal Logistics, Offline PWA, and SeedhaMitra AI.', 45, doc.y);
doc.moveDown(0.3);

renderQuestionBlock(
  '3.1',
  'How do you transport small quantities (e.g., 80 kg of chillies) from a remote village without incurring huge logistics losses?',
  'Hard logistics feasibility challenge on Less-Than-Truckload (LTL) economics.',
  'We do not deploy dedicated single-farmer vehicles for small batches. Instead, SeedhaMandi uses a "Milk Run" aggregation algorithm. When smallholder farmers in a 10 km village cluster list batches, our logistics engine pools them into a single local consolidation hub (Village FPO or Primary Agricultural Credit Society - PACS). A single 1.5-tonne pickup vehicle collects 15-20 farmer orders in a single consolidated loop. Furthermore, we leverage return-trip backhaul trucks (vehicles returning empty after delivering FMCG goods to rural areas), slashing freight costs by 35-45%.',
  'Logistics Dashboard > "Route Planner & Milk Run Consolidator"'
);

renderQuestionBlock(
  '3.2',
  'Slide 3 mentions "Low-Bandwidth Resilience". What happens when a farmer has zero cellular connectivity on the farm?',
  'Direct test of offline-first claims in your presentation.',
  'SeedhaMandi is built as an Offline-First Progressive Web App (PWA). When connection drops to 2G or zero, the browser service worker intercepts requests and serves the full catalog, previously loaded prices, and offline forms from local IndexedDB storage. A farmer can create a harvest listing, log dispatch details, or inspect orders offline. The transaction is held in a cryptographically signed offline mutation queue (seedha_pending_offline_mutations). Once connectivity resumes, the background sync engine replays mutations to the server without data loss.',
  'Top Banner > Click "📡 Test Offline / 2G" button to demonstrate live offline operation to judges.'
);

// SLIDE 4
doc.addPage();
renderSubSection('SLIDE 4: Technical Architecture & System Feasibility');
doc.fillColor(C.textMuted).fontSize(8).font('Helvetica')
   .text('Focus: Defending full-stack architecture, AI integration, security, and algorithmic complexity.', 45, doc.y);
doc.moveDown(0.3);

renderQuestionBlock(
  '4.1',
  'Walk us through your technical stack. Why did you choose this architecture over a standard monolith?',
  'Technical defense of modern web and mobile architecture.',
  'Frontend: Built with React 19, TypeScript, and Tailwind CSS for rapid responsive rendering across mobile screens without heavy native binary overhead. Service Worker (Cache API + Stale-While-Revalidate) ensures PWA standalone installation on Android/iOS with zero app-store download friction. Backend: Node.js Express micro-services exposing REST APIs for products, orders, escrow status, and route planning. AI Engine: Google Gemini API (gemini-2.5-flash / gemini-1.5) integrated via server-side proxy with prompt grounding on Agmarknet historical price data and seasonal weather patterns. Database: Embedded document store with MongoDB-compatible persistence and client-side IndexedDB local caching.',
  'Demand Intelligence Page > Live Gemini AI Price Guidance & Forecast Generator'
);

renderQuestionBlock(
  '4.2',
  'Is your AI "SeedhaMitra" just a standard wrapper around an LLM, or does it do actual domain intelligence?',
  'High-risk judge challenge to identify shallow AI wrappers.',
  'SeedhaMitra is grounded in multi-parameter agricultural data. Rather than sending generic prompts to Gemini, our backend constructs a structured context vector containing: (1) Current district-level mandi spot prices from government Agmarknet feeds; (2) 14-day rainfall and temperature forecasts; (3) Real-time supply volumes listed on SeedhaMandi within a 150 km radius; (4) Historical festival and seasonal demand curves. The AI executes deterministic price corridor bounds (minimum support price floor + fair margin ceiling) so the AI never produces hallucinatory or speculative crop advice.',
  'Floating SeedhaMitra AI Assistant > Ask "What is fair price for Nashik Onions this week?"'
);

// SLIDE 5
renderSubSection('SLIDE 5: Business Model, Financial Viability & Unit Economics');
doc.fillColor(C.textMuted).fontSize(8).font('Helvetica')
   .text('Focus: Proving profitability, zero farmer commission, buyer convenience fees, and operational sustainability.', 45, doc.y);
doc.moveDown(0.3);

renderQuestionBlock(
  '5.1',
  'If you charge 0% commission from farmers, how does SeedhaMandi survive and make money?',
  'Core business viability question.',
  'We monetize through three non-exploitative revenue streams: (1) Buyer Convenience Fee: Bulk buyers (hotels, supermarkets, FPOs) pay a modest 2.5% to 3% platform facilitation fee (compared to the 12-18% they currently pay to wholesale dalals). (2) Logistics Routing Margin: 4% to 6% margin on consolidated multi-stop freight aggregation by optimizing empty backhaul trucks. (3) B2B Premium Analytics & Demand Subscriptions: Large agribusinesses pay a monthly SaaS fee for real-time district crop arrival forecasting and cold-chain slot reservations.',
  'SIH Prototype Modal > "Unit Economics & Revenue Streams"'
);

renderQuestionBlock(
  '5.2',
  'What are your unit economics per 100 kg of fresh vegetables (e.g. Tomatoes)?',
  'Financial rigor test with exact numerical unit metrics.',
  'Traditional APMC Chain: Farmer gets Rs 1,200. Intermediaries add Rs 3,800. Consumer pays Rs 5,000. Spoilage loss is 32% (Rs 1,600 wasted). In SeedhaMandi: Farmer receives Rs 2,200 (+83% farmer income uplift). Multimodal logistics + cold packaging costs Rs 650. SeedhaMandi 3% platform fee is Rs 100. Consumer pays Rs 3,450 (31% consumer savings). Net farmer gain: +Rs 1,000/quintal. Net buyer saving: -Rs 1,550/quintal. Platform margin: Rs 100.',
  'Consumer Cart Drawer > Price breakdown showing "Direct Farmer Payout vs Market APMC Price"'
);

// SLIDE 6
renderSubSection('SLIDE 6: Social Impact, Future Roadmap & National Scalability');
doc.fillColor(C.textMuted).fontSize(8).font('Helvetica')
   .text('Focus: Vision, national food security alignment, ONDC integration, and phased geographic expansion.', 45, doc.y);
doc.moveDown(0.3);

renderQuestionBlock(
  '6.1',
  'What is your roadmap for integrating with Open Network for Digital Commerce (ONDC)?',
  'Government alignment and macro ecosystem integration question.',
  'SeedhaMandi is designed with Beckn protocol schema compatibility. In Phase 2 (Months 6-12), SeedhaMandi will register as a Seller Network Participant (SNP) on ONDC Agriculture. This enables any buyer on Paytm, Mystore, or Pincode to discover and buy directly from SeedhaMandi farmer clusters without building a separate buyer consumer base from scratch.',
  'Marketplace Page > Filter by "ONDC Direct Compatible"'
);

// -------------------------------------------------------------
// SECTION 3: TOP 12 AGGRESSIVE CROSS-QUESTIONING DEFENSES
// -------------------------------------------------------------
doc.addPage();
renderSectionTitle('3. Top 12 High-Stress Cross-Questioning Defenses', 'VIVA BATTLE TESTED');

const hardQuestions = [
  {
    q: 'Q1: What if a buyer inspects delivered tomatoes and falsely claims they are rotten to avoid payment?',
    sub: 'Escrow dispute resolution and quality verification.',
    ans: 'Quality is verified at pickup, not post-delivery. When the logistics driver arrives at the farm, a mandatory 3-point digital grading protocol is conducted: (1) Visual timestamped photo uploaded to the consignment ledger; (2) Sample Brix/firmness check logged; (3) Driver signs digital dispatch note. If a buyer raises a defect claim upon delivery, the buyer must provide an unboxing video within 60 minutes. A neutral local surveyor or PACS manager is dispatched for disputes above Rs 5,000. Small variances are covered by our 1% Transit Transit Micro-Insurance pool.',
    demo: 'Logistics Dashboard > Consignment Proof of Delivery'
  },
  {
    q: 'Q2: How do you prevent local mandi cartels or Arhatiyas from sabotaging your logistics trucks?',
    sub: 'Physical risk and entrenched cartel pushback.',
    ans: 'We do not confront APMC physically; we partner with Primary Agricultural Credit Societies (PACS) and existing Farmer Producer Organizations (FPOs) who hold statutory protection and physical storage yards in villages. Furthermore, we co-opt local small transporters who previously worked for Arhatiyas by giving them guaranteed daily milk-run contracts and faster 24-hour payments via UPI, turning potential adversaries into platform stakeholders.',
    demo: 'Logistics Dashboard > "Partner Fleet Registration"'
  },
  {
    q: 'Q3: Indian farmers are often non-English speakers and digitally hesitant. How can they use your app?',
    sub: 'Usability, digital divide, and regional language accessibility.',
    ans: 'SeedhaMandi was designed with zero-text UI principles: (1) Voice-first input via Web Speech API in SeedhaMitra AI supporting Hindi, Marathi, Telugu, and Tamil; (2) Big visual crop iconography requiring only 3 taps to list a crop (Crop icon -> Bags quantity -> Pickup date); (3) Community assisted mode where village FPO coordinators or youth "Mandi Sahayaks" list on behalf of 20-30 local farmers using a single dashboard.',
    demo: 'SeedhaMitra Modal > Voice Microphone icon + Multi-language crop cards'
  },
  {
    q: 'Q4: Why not just use WhatsApp groups? Farmers already share photos of crops on WhatsApp.',
    sub: 'Platform defensibility against ubiquitous free messaging tools.',
    ans: 'WhatsApp lacks three mission-critical commerce rails: (1) Zero financial escrow (buyers routinely default or renege on agreed prices once harvest is picked); (2) Zero multimodal logistics pooling (a WhatsApp photo cannot coordinate a refrigerated LTL backhaul truck); (3) Zero dispute arbitration or quality certification. WhatsApp is a communication tool; SeedhaMandi is an end-to-end transactional, logistical, and escrow-clearing ecosystem.',
    demo: 'Marketplace Checkout > "Escrow Protected Payment"'
  },
  {
    q: 'Q5: How does your dynamic pricing algorithm work? Won\'t low prices hurt farmers during gluts?',
    sub: 'Algorithmic market equilibrium and fair price floors.',
    ans: 'Our dynamic pricing algorithm enforces a strict "Cost-Plus Minimum Price Floor". We calculate: Base Production Cost (Seed, fertilizer, diesel, labor) + 20% Guaranteed Minimum Farmer Margin. The AI algorithm will NEVER recommend or permit listings below this floor. During harvest gluts, instead of slashing prices, SeedhaMitra triggers "Logistics Geo-Arbitrage": it redirects consignments to non-glutting consumption centers 120-200 km away where spot prices are 40% higher.',
    demo: 'Demand Intelligence > "Geo-Arbitrage Price Differential Heatmap"'
  },
  {
    q: 'Q6: What happens if your server crashes or Gemini API quota exceeds limits during peak harvest?',
    sub: 'System resilience and failover mechanisms.',
    ans: 'Our architecture implements a multi-tier fallback: (1) Gemini AI calls are cached on an edge Redis/in-memory layer with a 6-hour TTL for standard price recommendations; (2) If Gemini API times out (>2000ms) or 429 quota occurs, the system smoothly falls back to an embedded deterministic heuristics engine that calculates prices based on rolling 14-day Agmarknet CSV median prices; (3) The UI never breaks or throws an error modal; it displays cached data with a "Offline Benchmark Active" indicator.',
    demo: 'Demand Intelligence > Fallback Data Engine in src/services/api.ts'
  }
];

hardQuestions.forEach((item, i) => {
  renderQuestionBlock(`3.${i + 1}`, item.q, item.sub, item.ans, item.demo);
});

// Top 6 More Hard Questions
const hardQuestionsPart2 = [
  {
    q: 'Q7: If SeedhaMandi is a web app, why didn\'t you build native Android APK / iOS apps in Java or Swift?',
    sub: 'PWA vs Native App trade-offs.',
    ans: 'A native app requires a 45-90 MB download from the Google Play Store, requiring high-speed data, Google account logins, and constant manual updates. In rural India where phone storage is constrained and 2G connectivity prevails, a Progressive Web App (PWA) loads in under 1.2 seconds, consumes less than 800 KB of cache, installs directly to the home screen via the browser manifest without any Play Store account, and updates silently via Service Workers.',
    demo: 'Navbar > "Install App" button + "📡 Test Offline / 2G" mode'
  },
  {
    q: 'Q8: How do you verify genuine farmers from fraudulent commercial traders posing as farmers?',
    sub: 'Identity verification and anti-fraud mechanics.',
    ans: 'We implement a two-step verification pipeline: (1) Instant digital verification via PM-KISAN database ID or Farmer ID (Kisan Credit Card / land record 7/12 extract number); (2) Geo-fenced harvest dispatch: the mobile GPS coordinates during harvest dispatch must match the registered agricultural parcel boundaries. Commercial traders attempting to dump produce from distant APMC yards are flagged and blocked.',
    demo: 'Farmer Dashboard > "Farmer KYC & Land Record Verification"'
  },
  {
    q: 'Q9: What is your cold-chain strategy for high perishables like strawberries or leafy greens?',
    sub: 'Physical infrastructure bottlenecks.',
    ans: 'We utilize an asset-light "Solar Cold-Hub Micro-Aggregator" model. Rather than constructing expensive centralized multi-crore cold storages, we partner with decentralized solar-powered micro-cold rooms (such as Ecozen or local PACS cold hubs). Furthermore, in transit, we mandate insulated passive phase-change material (PCM) crates for high-value perishables, keeping produce at 4°C-8°C for up to 36 hours without requiring dedicated generator reefer trucks.',
    demo: 'Logistics Dashboard > Reefer Temperature Telemetry'
  },
  {
    q: 'Q10: Who pays for the empty return journey if a truck goes to a rural village to collect produce?',
    sub: 'The classic dead-haul freight trap in logistics.',
    ans: 'This is the exact problem our Multimodal Logistics Aggregator solves. We do NOT dispatch empty trucks from cities to villages. We identify trucks already delivering FMCG goods, fertilizer, e-commerce parcels, and cement into rural villages that currently return to urban centers 100% empty. We aggregate rural farm consignments to fill these return-journey empty trucks, converting a dead haul into pure profit for local truckers at a 40% discounted freight rate.',
    demo: 'Logistics Dashboard > "Backhaul Matchmaker"'
  },
  {
    q: 'Q11: How do you guarantee payments to farmers if the buyer pays online via escrow?',
    sub: 'Payment security and settlement speed.',
    ans: 'Payment is pre-authorized and locked in a digital Escrow wallet the instant the buyer confirms an order. The farmer never releases the produce on credit. The moment the buyer confirms OTP delivery (or 12 hours elapse post-delivery without dispute), the escrow smart contract triggers an automated UPI direct bank transfer (IMPS/NEFT) into the farmer\'s registered bank account. Settlement time: < 30 minutes, compared to 15-45 days of delayed payment in traditional mandis.',
    demo: 'Escrow Release Banner in App + Toast Notification'
  },
  {
    q: 'Q12: Can this platform handle 100,000 concurrent farmers and 10,000 trucks during harvest season?',
    sub: 'Scalability, load handling, and database limits.',
    ans: 'Yes. The architecture is stateless and cloud-native. The React frontend is served via globally distributed CDNs. API services run as containerized Node.js microservices that scale horizontally with auto-scaling groups based on CPU/memory load. Read-heavy marketplace browsing is offloaded to Redis edge caches, while write-heavy order processing uses queue-based asynchronous background workers. Local IndexedDB handles edge client load during network spikes.',
    demo: 'System Telemetry & Architecture Spec in Slide 4'
  }
];

hardQuestionsPart2.forEach((item, i) => {
  renderQuestionBlock(`3.${i + 7}`, item.q, item.sub, item.ans, item.demo);
});

// -------------------------------------------------------------
// SECTION 4: JUDGE TRAP SCENARIOS & WINNING RESPONSES
// -------------------------------------------------------------
doc.addPage();
renderSectionTitle('4. "Judge Trap" Scenarios & Winning Tactical Responses', 'PSYCHOLOGY & DEFENSE');

const traps = [
  {
    trap: 'Trap 1: "Government e-NAM already does this. Why should the government fund your project?"',
    why: 'Judges test if you know government schemes or are ignorant of national initiatives.',
    response: '"e-NAM is an extraordinary initiative, but its scope is legally bounded by the APMC Act. e-NAM digitizes the auction hall inside physical mandis; farmers still have to pay transport to bring crops to the mandi, pay unloading fees, and pay Arhatiya commissions. SeedhaMandi operates farmgate-to-fork: the crop is sold before it ever leaves the farm gate, bypassing physical APMC gates entirely. Furthermore, e-NAM provides zero logistics dispatch or vehicle pooling; SeedhaMandi integrates multimodal logistics as a native core service."',
    type: 'warning'
  },
  {
    trap: 'Trap 2: "Farmers are uneducated and will never use an app with complex graphs and AI."',
    why: 'Judges provoke you to see if you have empathy and field grounding.',
    response: '"We completely agree that complex charts are useless in a field. That is why our farmer interface does not require typing or reading complex analytics. The farmer has an ultra-simple 3-button flow with voice recognition in regional languages. The complex analytics, price forecasting, and milk-run routing run on the backend for FPO managers, logistics aggregators, and bulk buyers. The farmer only sees a clean card: Crop, Fair Price Floor, and a single green button: \'Confirm Pickup\'."',
    type: 'info'
  },
  {
    trap: 'Trap 3: "If this idea is so good, why hasn\'t Big Tech (Amazon/Reliance) or Ninjacart solved it?"',
    why: 'Tests business moat and structural understanding.',
    response: '"Because big corporations operate capital-intensive, high-overhead warehouse models. Ninjacart and Reliance built massive collection centers with thousands of salaried staff and huge depreciation costs, forcing them to take large margins (18-25%) to survive. SeedhaMandi is an asset-light digital coordinator: we do not buy inventory, we do not own warehouses, and we do not buy trucks. We connect existing FPOs, existing local truckers, and existing buyers via software, operating with a lean 2.5% fee structure that corporate giants cannot match."',
    type: 'danger'
  }
];

traps.forEach((t) => {
  checkPageSpace(90);
  renderCallout(`⚠️ ${t.trap}`, `JUDGE MOTIVATION: ${t.why}\n\nWINNING COUNTER-RESPONSE:\n${t.response}`, t.type);
});

// -------------------------------------------------------------
// SECTION 5: RAPID RECALL CHEAT SHEET & ELEVATOR PITCH
// -------------------------------------------------------------
renderSectionTitle('5. SIH 2026 Rapid Recall Cheat Sheet', '2-MINUTE ELEVATOR PITCH');

const cheatSheetText = 
`• PROBLEM STATEMENT ID: 26033 | THEME: Agriculture, FoodTech & Rural Development
• CORE PROBLEM: 4-6 intermediaries extract 52-65% of consumer rupee; 28-40% perishability loss due to broken rural logistics.
• OUR THREE PILLARS:
   1. Direct Farm-to-Fork Marketplace: Zero commission from farmers; buyer escrow locks payment till verified delivery.
   2. Multimodal Logistics Aggregator: Pooled milk runs, empty backhaul return-trip utilization, and shared LTL freight.
   3. AI Demand & Price Intelligence (SeedhaMitra): Gemini-powered price corridors, geo-arbitrage, and 7-day harvest advice.
   4. Low-Bandwidth Offline PWA: Works seamlessly in 2G / zero-connectivity fields with IndexedDB local sync.
• MEASURABLE IMPACT METRICS:
   - Farmer Income Uplift: +35% to +42% higher net earnings.
   - Consumer Savings: 18% to 25% lower grocery spend.
   - Post-Harvest Wastage: Slashed from 32% down to < 7% through direct transit.
• LIVE PROTOTYPE DEMO CHECKLIST FOR JUDGES:
   1. Show PWA Offline Mode: Click "📡 Test Offline / 2G" in top banner to prove offline local caching and auto-sync.
   2. Show SeedhaMitra AI: Ask price guidance for Nashik Tomatoes or Pune Onions in Demand Intelligence tab.
   3. Show Escrow Mechanism: Place order in Marketplace, show farmer wallet holding, and simulate OTP delivery release.
   4. Show Multimodal Logistics: Open Logistics Dashboard and display route consolidation and milk run map.`;

renderCallout('💡 MASTER ELEVATOR PITCH & VIVA RECALL', cheatSheetText, 'info');

// -------------------------------------------------------------
// PAGE NUMBERING & WATERMARK IN FOOTER
// -------------------------------------------------------------
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);

  // Top header on subsequent pages
  if (i > 0) {
    doc.fillColor(C.textMuted).fontSize(7.5).font('Helvetica')
       .text('Smart India Hackathon 2026 • Problem ID 26033 • SeedhaMandi Defense Manual', 45, 20, { width: PAGE_WIDTH });
    doc.fillColor(C.primaryMid).fontSize(7.5).font('Helvetica-Bold')
       .text('Team AgriNova', 45, 20, { align: 'right', width: PAGE_WIDTH });
    doc.rect(45, 32, PAGE_WIDTH, 0.5).fill(C.borderLight);
  }

  // Footer on all pages
  const footerY = doc.page.height - 35;
  doc.rect(45, footerY - 5, PAGE_WIDTH, 0.5).fill(C.borderLight);

  doc.fillColor(C.textMuted).fontSize(8).font('Helvetica')
     .text('SeedhaMandi: Direct Farm-to-Fork Marketplace with Multimodal Logistics & AI Planning', 45, footerY);

  doc.fillColor(C.primaryDark).fontSize(8).font('Helvetica-Bold')
     .text(`Page ${i + 1} of ${range.count}`, 45, footerY, { align: 'right', width: PAGE_WIDTH });
}

doc.end();

writeStream.on('finish', () => {
  const stats = fs.statSync(outputPath);
  console.log(`✅ PDF successfully generated: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB, ${range.count} pages)`);
});
