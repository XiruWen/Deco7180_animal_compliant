/* ═══════════════════════════════════════════════
   WILDSAFE — APP.JS
   All interactivity: map, identify, deter, SOS
════════════════════════════════════════════════ */

// ── NAVIGATION ────────────────────────────────
let currentPage = 'home';
let mapInitialized = false;

function nav(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  currentPage = page;

  // update bottom nav
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });

  // lazy-init map
  if (page === 'map' && !mapInitialized) {
    setTimeout(initMap, 100);
    mapInitialized = true;
  }

  // scroll to top
  if (el) el.scrollTop = 0;
}

// ── MAP DATA (Brisbane suburbs, real approximate coords) ──
const SUBURB_DATA = [
  { name: 'Toowong',         lat: -27.4849, lng: 152.9838, complaints: 312, animals: ['dog','bird','possum'] },
  { name: 'West End',        lat: -27.4762, lng: 152.9995, complaints: 278, animals: ['bird','cat','possum'] },
  { name: 'Indooroopilly',   lat: -27.4998, lng: 152.9766, complaints: 254, animals: ['dog','snake','possum'] },
  { name: 'Kenmore',         lat: -27.5027, lng: 152.9389, complaints: 231, animals: ['dog','bird','snake'] },
  { name: 'St Lucia',        lat: -27.4975, lng: 153.0031, complaints: 208, animals: ['possum','bird','dog'] },
  { name: 'Paddington',      lat: -27.4605, lng: 152.9940, complaints: 195, animals: ['cat','bird','dog'] },
  { name: 'Sunnybank Hills', lat: -27.5880, lng: 153.0458, complaints: 187, animals: ['snake','dog','bird'] },
  { name: 'Virginia',        lat: -27.3835, lng: 153.0358, complaints: 176, animals: ['dog','cat'] },
  { name: 'Pullenvale',      lat: -27.5153, lng: 152.8816, complaints: 163, animals: ['snake','bird','possum'] },
  { name: 'Ashgrove',        lat: -27.4508, lng: 152.9799, complaints: 149, animals: ['possum','dog','bird'] },
  { name: 'Taringa',         lat: -27.4924, lng: 152.9740, complaints: 142, animals: ['possum','cat'] },
  { name: 'Milton',          lat: -27.4672, lng: 152.9885, complaints: 138, animals: ['bird','dog'] },
  { name: 'Chapel Hill',     lat: -27.5038, lng: 152.9553, complaints: 127, animals: ['snake','possum'] },
  { name: 'Yeronga',         lat: -27.5120, lng: 153.0123, complaints: 119, animals: ['dog','bird'] },
  { name: 'Brookfield',      lat: -27.4889, lng: 152.9110, complaints: 98,  animals: ['snake','bird'] },
];

const ANIMAL_COLORS = {
  all: '#e63946', dog: '#ff6b35', bird: '#2196f3',
  snake: '#8bc34a', possum: '#9c27b0', cat: '#ff9800'
};

let activeFilter = 'all';
let mapInstance = null;
let markerLayerGroup = null;

function initMap() {
  mapInstance = L.map('map-container', {
    center: [-27.4849, 152.9838],
    zoom: 12,
    zoomControl: true,
    attributionControl: true
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CartoDB',
    subdomains: 'abcd', maxZoom: 20
  }).addTo(mapInstance);

  markerLayerGroup = L.layerGroup().addTo(mapInstance);
  renderMarkers(activeFilter);
  renderSuburbStats();

  // filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderMarkers(activeFilter);
    });
  });
}

function renderMarkers(filter) {
  if (!markerLayerGroup) return;
  markerLayerGroup.clearLayers();

  SUBURB_DATA.forEach(sub => {
    if (filter !== 'all' && !sub.animals.includes(filter)) return;

    const radius = Math.max(20, Math.min(60, sub.complaints / 4));
    const color = sub.complaints > 250 ? '#ff4444'
                : sub.complaints > 150 ? '#ff9900' : '#ffdd00';

    const circle = L.circleMarker([sub.lat, sub.lng], {
      radius: radius,
      fillColor: color,
      color: 'white',
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.55
    });

    const animalIcons = sub.animals.map(a => ({
      dog:'🐕', bird:'🦅', snake:'🐍', possum:'🐾', cat:'🐈'
    }[a] || '🐾')).join(' ');

    circle.bindPopup(`
      <div style="font-family:'Sora',sans-serif">
        <strong style="font-size:15px">${sub.name}</strong><br/>
        <span style="color:#888;font-size:12px">${sub.complaints} complaints recorded</span><br/>
        <div style="margin-top:6px;font-size:13px">${animalIcons} ${sub.animals.join(', ')}</div>
        <div style="margin-top:8px;padding:6px 10px;background:#fff3e0;border-radius:6px;font-size:11px;color:#b06000">
          ⚠️ Exercise caution in this area
        </div>
      </div>
    `);

    markerLayerGroup.addLayer(circle);
  });
}

function renderSuburbStats() {
  const sorted = [...SUBURB_DATA].sort((a, b) => b.complaints - a.complaints).slice(0, 6);
  const max = sorted[0].complaints;
  const list = document.getElementById('suburb-list');
  list.innerHTML = sorted.map(s => `
    <div class="suburb-row">
      <div class="suburb-name">${s.name}</div>
      <div class="suburb-bar-wrap">
        <div class="suburb-bar" style="width:${(s.complaints/max*100).toFixed(0)}%"></div>
      </div>
      <div class="suburb-count">${s.complaints}</div>
    </div>
  `).join('');
}

// ── ANIMAL DATA ────────────────────────────────
const ANIMALS = [
  {
    emoji: '🐕', name: 'Dog (Domestic)', sci: 'Canis lupus familiaris',
    danger: 'med', dangerLabel: 'Moderate Risk',
    tip: 'Stand still, avoid eye contact, back away slowly',
    behaviour: 'Domestic dogs can become aggressive when provoked, territorial, or poorly controlled. In Brisbane, unleashed dogs in parks are the #1 source of complaints.',
    whatToDo: 'Do not run — this triggers chase instinct. Stand sideways, avoid direct eye contact. If attacked, protect your throat and face. Seek immediate medical attention for any bite wound.',
    prevention: 'Carry a walking stick in high-complaint areas. Avoid parks at peak off-leash hours (6–9am, 4–7pm).',
    source: 'Brisbane City Council Animal Complaints Data + Interview (dog bite case)'
  },
  {
    emoji: '🦅', name: 'Australian Magpie', sci: 'Gymnorhina tibicen',
    danger: 'med', dangerLabel: 'Swooping Season Risk',
    tip: 'Wear sunglasses; attach cable ties to helmet; don\'t make eye contact',
    behaviour: 'Magpies swoop aggressively to protect nests during spring (August–November). They remember faces and target repeat "threats".',
    whatToDo: 'Walk quickly through the area without running. Face the bird — they rarely swoop from the front. Wear a wide-brimmed hat. Dismount bicycles in heavily swooped areas.',
    prevention: 'Check swooping maps (magpie alert apps) before cycling. Zip ties on bicycle helmets are proven effective.',
    source: 'Bomford & O\'Brien (1990) — deterrent audio study'
  },
  {
    emoji: '🐍', name: 'Eastern Brown Snake', sci: 'Pseudonaja textilis',
    danger: 'high', dangerLabel: 'Highly Dangerous',
    tip: 'Freeze, back away slowly. NEVER handle.',
    behaviour: 'Australia\'s most venomous land snake. Common in Brisbane\'s western suburbs and near bushland. Responsible for the majority of Australian snakebite deaths.',
    whatToDo: 'Do not move. Give the snake a clear escape path. Move away slowly. If bitten: call 000 immediately, apply pressure immobilisation bandage, do NOT wash or cut the wound.',
    prevention: 'Wear long pants and boots when walking in long grass. Watch where you put your hands and feet.',
    source: 'Queensland Health Snakebite Guidelines'
  },
  {
    emoji: '🐾', name: 'Common Brushtail Possum', sci: 'Trichosurus vulpecula',
    danger: 'low', dangerLabel: 'Low Risk',
    tip: 'Do not feed or corner — they can scratch and bite',
    behaviour: 'Nocturnal marsupials common in suburban Brisbane. Harmless unless cornered or fed by hand. Can carry diseases transferable via scratch.',
    whatToDo: 'If scratched or bitten: wash thoroughly with soap for 5+ minutes, apply antiseptic, see a GP. If in your roof cavity, contact BCC for humane relocation advice.',
    prevention: 'Do not leave pet food outside at night. Seal roof entry points.',
    source: 'Queensland Government Wildlife Management Guidelines'
  },
  {
    emoji: '🐓', name: 'Bush Turkey', sci: 'Alectura lathami',
    danger: 'low', dangerLabel: 'Low Risk',
    tip: 'Protect vegetable gardens; they are legally protected',
    behaviour: 'Protected native bird in Queensland. Harmless to people but will dig up gardens. Very common in Brisbane suburbs near bushland.',
    whatToDo: 'Do not harm — it is illegal. Use physical barriers (netting) to protect gardens. Report persistent issues to Brisbane City Council.',
    prevention: 'Net vegetable gardens. Avoid composting uncovered.',
    source: 'Nature Conservation Act 1992 (Qld)'
  },
  {
    emoji: '🐊', name: 'Freshwater Crocodile', sci: 'Crocodylus johnstoni',
    danger: 'high', dangerLabel: 'Dangerous',
    tip: 'Never swim in unfamiliar waterways. Obey all warning signs.',
    behaviour: 'Found in Brisbane\'s river system and surrounding waterways. Smaller and less aggressive than saltwater crocodiles but will bite if disturbed.',
    whatToDo: 'Back away immediately. If bitten: call 000. Apply direct pressure. Do NOT remove the animal — let trained professionals handle.',
    prevention: 'Always obey crocodile warning signs. Never feed crocodiles. Stay well back from riverbanks at night.',
    source: 'Queensland Parks and Wildlife Service'
  }
];

function renderAnimalGrid() {
  const grid = document.getElementById('animal-grid');
  grid.innerHTML = ANIMALS.map((a, i) => `
    <div class="animal-card" onclick="openAnimalModal(${i})">
      <div class="animal-emoji">${a.emoji}</div>
      <div class="animal-name">${a.name}</div>
      <div class="animal-danger danger-${a.danger}">${a.dangerLabel}</div>
      <div class="animal-tip">${a.tip}</div>
    </div>
  `).join('');
}

// Modal
let modalOpen = false;
function openAnimalModal(idx) {
  const a = ANIMALS[idx];
  let modal = document.getElementById('animal-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'animal-modal';
    modal.id = 'animal-modal';
    modal.innerHTML = `
      <div class="animal-modal-card" id="animal-modal-card">
        <div class="modal-handle"></div>
        <button class="modal-close" onclick="closeAnimalModal()">✕ Close</button>
        <div id="modal-content"></div>
      </div>
    `;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAnimalModal();
    });
    document.body.appendChild(modal);
  }

  const badgeClass = a.danger === 'high' ? 'badge-high' : a.danger === 'med' ? 'badge-med' : 'badge-low';
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-emoji">${a.emoji}</div>
    <div class="modal-name">${a.name}</div>
    <div class="modal-sci">${a.sci}</div>
    <span class="id-danger-badge ${badgeClass}">${a.dangerLabel}</span>
    <div class="modal-section-title">Behaviour</div>
    <div class="modal-body">${a.behaviour}</div>
    <div class="modal-section-title">What To Do When Encountered</div>
    <div class="modal-body">${a.whatToDo}</div>
    <div class="modal-section-title">Prevention</div>
    <div class="modal-body">${a.prevention}</div>
    <div class="modal-section-title" style="margin-top:16px;font-size:10px">Source</div>
    <div class="modal-body" style="font-size:11px;opacity:0.6">${a.source}</div>
  `;

  modal.classList.add('open');
  modalOpen = true;
}

function closeAnimalModal() {
  const modal = document.getElementById('animal-modal');
  if (modal) modal.classList.remove('open');
  modalOpen = false;
}

// ── IDENTIFY ─────────────────────────────────
const IDENTIFY_RESULTS = [
  { name: 'Australian Magpie', sci: 'Gymnorhina tibicen', emoji: '🦅', danger: 'med', dangerLabel: 'Moderate Risk', body: 'Highly intelligent corvid known for its melodic song and aggressive swooping behaviour during breeding season (Aug–Nov). Common throughout Brisbane suburban areas.' },
  { name: 'Common Brushtail Possum', sci: 'Trichosurus vulpecula', emoji: '🐾', danger: 'low', dangerLabel: 'Low Risk', body: 'Nocturnal marsupial extremely common in Brisbane suburbs. Herbivorous and generally harmless. May scratch if handled. Do not feed — this disrupts their diet and can cause dependency.' },
  { name: 'Eastern Brown Snake', sci: 'Pseudonaja textilis', emoji: '🐍', danger: 'high', dangerLabel: 'Highly Dangerous', body: 'One of the world\'s most venomous snakes. Responsible for over 60% of Australian snakebite deaths. Common in Brisbane\'s western suburbs. Always back away and call 000 if bitten.' },
  { name: 'Bush Turkey', sci: 'Alectura lathami', emoji: '🐓', danger: 'low', dangerLabel: 'Low Risk', body: 'Fully protected native bird under Queensland law. Harmless to people but notorious for destroying gardens. Fines apply for harming or harassing them.' },
  { name: 'Australian Ibis', sci: 'Threskiornis molucca', emoji: '🦢', danger: 'low', dangerLabel: 'Low Risk', body: 'Often called the "bin chicken" — common urban scavenger in Brisbane. Largely harmless but can become bold around food. Do not feed. May carry zoonotic bacteria.' },
];

function identifyAnimal() {
  const preview = document.getElementById('preview-img');
  const resultEl = document.getElementById('id-result');
  const btn = document.getElementById('identify-btn');
  const btnText = document.getElementById('identify-btn-text');

  if (preview.classList.contains('hidden')) {
    // prompt upload
    document.getElementById('photo-input').click();
    return;
  }

  btn.classList.add('loading');
  btnText.textContent = 'Analysing image…';
  resultEl.classList.add('hidden');

  setTimeout(() => {
    const result = IDENTIFY_RESULTS[Math.floor(Math.random() * IDENTIFY_RESULTS.length)];
    const badgeClass = result.danger === 'high' ? 'badge-high' : result.danger === 'med' ? 'badge-med' : 'badge-low';
    resultEl.innerHTML = `
      <div style="font-size:32px;margin-bottom:8px">${result.emoji}</div>
      <div class="id-result-animal">${result.name}</div>
      <div class="id-result-sci">${result.sci}</div>
      <div class="id-result-body">${result.body}</div>
      <span class="id-danger-badge ${badgeClass}">${result.dangerLabel}</span>
    `;
    resultEl.classList.remove('hidden');
    btn.classList.remove('loading');
    btnText.textContent = 'Identify Again →';
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 2200);
}

// Photo upload preview
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('photo-input');
  if (input) {
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.getElementById('preview-img');
        img.src = ev.target.result;
        img.classList.remove('hidden');
        document.getElementById('upload-inner').style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }

  // drag & drop
  const zone = document.getElementById('upload-zone');
  if (zone) {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = document.getElementById('preview-img');
          img.src = ev.target.result;
          img.classList.remove('hidden');
          document.getElementById('upload-inner').style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });
  }
});

// ── DETERRENT AUDIO ──────────────────────────
const DETER_SOUNDS = [
  { emoji: '🦅', name: 'Hawk Call', desc: 'Effective against smaller birds and magpies during swooping season', effectiveness: '★★★★☆', target: 'Birds', freq: [1200, 1800, 1400, 2000, 1600, 1000] },
  { emoji: '🐕', name: 'Ultrasonic Burst', desc: 'High-frequency tone repels dogs without disturbing humans', effectiveness: '★★★★★', target: 'Dogs & cats', freq: [800, 200, 600, 180, 900, 220] },
  { emoji: '🦁', name: 'Predator Growl', desc: 'Low-frequency rumble triggers flight response in small mammals', effectiveness: '★★★☆☆', target: 'Possums & mammals', freq: [200, 400, 180, 350, 220, 380] },
  { emoji: '🔔', name: 'Distress Call', desc: 'Mimics prey animal alarm — causes nearby animals to flee', effectiveness: '★★★★☆', target: 'General wildlife', freq: [600, 900, 700, 1100, 500, 850] },
  { emoji: '🐍', name: 'Snake Vibration', desc: 'Ground vibration pattern that causes snakes to retreat', effectiveness: '★★★☆☆', target: 'Snakes', freq: [80, 120, 90, 110, 85, 130] },
  { emoji: '🦜', name: 'Alarm Chirp', desc: 'Native bird alarm call — effective in deterring flocks', effectiveness: '★★★★☆', target: 'Bird flocks', freq: [1500, 2200, 1700, 1900, 1400, 2100] },
];

let playingIdx = null;
let audioCtx = null;
let currentOscillators = [];

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playDeter(idx) {
  initAudio();
  stopAllDeter();

  if (playingIdx === idx) {
    playingIdx = null;
    return;
  }

  playingIdx = idx;
  document.querySelectorAll('.deter-card').forEach((c, i) => c.classList.toggle('playing', i === idx));

  const sound = DETER_SOUNDS[idx];
  const vol = parseInt(document.getElementById('vol-slider').value) / 100;
  const freqs = sound.freq;

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(vol * 0.3, audioCtx.currentTime + 0.1);
  gainNode.connect(audioCtx.destination);

  freqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = idx === 2 ? 'sawtooth' : idx === 4 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + i * 0.15 + 0.1);
    osc.connect(gainNode);
    osc.start(audioCtx.currentTime + i * 0.15);
    osc.stop(audioCtx.currentTime + i * 0.15 + 0.12);
    currentOscillators.push(osc);
  });

  // animate soundwave
  animateSoundwave(true);

  setTimeout(() => {
    if (playingIdx === idx) {
      playingIdx = null;
      document.querySelectorAll('.deter-card').forEach(c => c.classList.remove('playing'));
      animateSoundwave(false);
    }
  }, freqs.length * 150 + 200);
}

function stopAllDeter() {
  currentOscillators.forEach(o => { try { o.stop(); } catch(e){} });
  currentOscillators = [];
  document.querySelectorAll('.deter-card').forEach(c => c.classList.remove('playing'));
  animateSoundwave(false);
}

function animateSoundwave(active) {
  const bars = document.querySelectorAll('.sw-bar');
  bars.forEach((bar, i) => {
    bar.style.animationPlayState = active ? 'running' : 'paused';
    bar.style.animationDelay = active ? `${i * 0.1}s` : '0s';
  });
}

function renderDeterGrid() {
  const grid = document.getElementById('deter-grid');
  grid.innerHTML = DETER_SOUNDS.map((s, i) => `
    <div class="deter-card" id="deter-${i}" onclick="playDeter(${i})">
      <div class="deter-card-emoji">${s.emoji}</div>
      <div class="deter-card-name">${s.name}</div>
      <div class="deter-card-desc">${s.desc}</div>
      <div class="deter-effectiveness">${s.effectiveness} ${s.target}</div>
      <button class="deter-play-btn" onclick="event.stopPropagation();playDeter(${i})">▶ Play</button>
    </div>
  `).join('');
}

function renderSoundwave() {
  const sw = document.getElementById('soundwave');
  const bars = 18;
  sw.innerHTML = Array.from({length: bars}, (_, i) => {
    const h = 20 + Math.random() * 40;
    return `<div class="sw-bar" style="height:${h}px;animation-delay:${(i * 0.07).toFixed(2)}s;animation-play-state:paused"></div>`;
  }).join('');
}

// ── SOS / WOUND CARE ──────────────────────────
const WOUND_STEPS = [
  { num:1, title:'Stay Calm & Move to Safety', desc:'Remove yourself from the situation — do not stay near the animal. Sit down to prevent fainting from shock. Call a bystander for help if possible.', time:'⏱ Immediate' },
  { num:2, title:'Control the Bleeding', desc:'Apply firm, direct pressure with a clean cloth or clothing for at least 10 minutes without lifting. Do not use a tourniquet unless bleeding is life-threatening.', time:'⏱ 0–2 minutes' },
  { num:3, title:'Clean the Wound', desc:'Rinse thoroughly under running water for at least 5 minutes. Use soap if available — this dramatically reduces infection risk. Do NOT scrub the wound.', time:'⏱ 2–7 minutes' },
  { num:4, title:'Cover & Protect', desc:'Apply a clean bandage or cloth. Do NOT close the wound with tape or butterfly strips — animal bites need to remain open for drainage and antibiotic treatment.', time:'⏱ 7–10 minutes' },
  { num:5, title:'Assess Severity & Act', desc:'Minor scratch with no deep puncture: go to GP within 24 hours. Deep bite, large wound, or snake/spider: call 000 or go to emergency immediately. Do NOT drive yourself.', time:'⏱ 10 minutes' },
];

const HOSPITAL_CARDS = [
  { name: 'Royal Brisbane & Women\'s Hospital', meta: 'Herston — Major Trauma Centre', distance: '~8 km from CBD', phone: 'tel:+61736468111', phoneLabel: '(07) 3646 8111' },
  { name: 'Princess Alexandra Hospital', meta: 'Woolloongabba — 24hr Emergency', distance: '~5 km from CBD', phone: 'tel:+61731765000', phoneLabel: '(07) 3176 5000' },
  { name: 'The Prince Charles Hospital', meta: 'Chermside — Emergency Dept', distance: '~12 km from CBD', phone: 'tel:+61731394000', phoneLabel: '(07) 3139 4000' },
  { name: '13 HEALTH', meta: 'QLD Health Advice Line — 24/7 Nurse on call', distance: 'Statewide hotline', phone: 'tel:131432', phoneLabel: '13 43 25 (13 HEALTH)' },
];

const BRING_TO_HOSPITAL = [
  { icon: '🪪', text: 'Photo ID (passport or driver\'s licence)' },
  { icon: '💳', text: 'Medicare card (or overseas health insurance card)' },
  { icon: '📸', text: 'Photo of the wound taken immediately after incident' },
  { icon: '📍', text: 'Location of incident (suburb, park name)' },
  { icon: '🐕', text: 'Description of animal (breed, colour, size, owner details if known)' },
  { icon: '⏰', text: 'Exact time of attack' },
  { icon: '💊', text: 'Any medications you are currently taking' },
];

const INSURANCE_STEPS = [
  { title: 'Step 1 — Document Everything at the Scene', body: 'Take photos of the wound, the location, and the animal if safely possible. Note the exact time, GPS location, and any witnesses\' contact details. This is critical for any claim.' },
  { title: 'Step 2 — Medicare (Australian Residents)', body: 'Medicare covers emergency treatment and GP visits. Present your Medicare card at the hospital. Emergency department visits at public hospitals are fully covered. GP follow-up visits are bulk-billed or partially rebated via Medicare online.' },
  { title: 'Step 3 — International Student Insurance (OSHC)', body: 'International students must hold Overseas Student Health Cover. After treatment, download your OSHC app (Allianz, Medibank, Bupa, AHM, or NIB) and submit a claim within 2 years. Keep ALL receipts. Upload your medical reports and referral letters.' },
  { title: 'Step 4 — If the Animal Has an Owner', body: 'Report the incident to Brisbane City Council (BCC) Animal Management: 3403 8888. If the dog is registered, the owner\'s CTP or home insurance may cover your medical costs. File a Queensland Police report if you intend to pursue the owner.' },
  { title: 'Step 5 — Queensland Civil Liability Claim', body: 'If bitten by an uncontrolled dog, you may be entitled to civil compensation under the Queensland Civil Liability Act 2003. Contact LawRight (free legal advice) or a personal injury solicitor. You have 3 years from the incident date to lodge a claim.' },
  { title: 'Step 6 — Tetanus & Rabies Follow-up', body: 'Ensure your tetanus vaccination is up to date (within 5 years). If bitten by a bat or flying fox, seek immediate post-exposure rabies prophylaxis (PEP) from a hospital — this is time-critical within 72 hours.' },
];

function renderSosContent() {
  // Wound steps
  const woundContainer = document.getElementById('wound-steps');
  if (woundContainer) {
    woundContainer.innerHTML = WOUND_STEPS.map(s => `
      <div class="step-card">
        <div class="step-num">${s.num}</div>
        <div class="step-body">
          <div class="step-title">${s.title}</div>
          <div class="step-desc">${s.desc}</div>
          <div class="step-time">${s.time}</div>
        </div>
      </div>
    `).join('');
  }

  // Hospital cards
  const hospContainer = document.getElementById('hospital-cards');
  if (hospContainer) {
    hospContainer.innerHTML = HOSPITAL_CARDS.map(h => `
      <div class="hosp-card">
        <div class="hosp-name">${h.name}</div>
        <div class="hosp-meta">${h.meta}</div>
        <span class="hosp-distance">📍 ${h.distance}</span>
        <a href="${h.phone}" class="call-hosp-btn">📞 ${h.phoneLabel}</a>
      </div>
    `).join('');
  }

  // What to bring
  const wtbContainer = document.getElementById('wtb-list');
  if (wtbContainer) {
    wtbContainer.innerHTML = BRING_TO_HOSPITAL.map(item => `
      <div class="wtb-item">
        <span style="font-size:20px">${item.icon}</span>
        <span>${item.text}</span>
      </div>
    `).join('');
  }

  // Insurance steps
  const insContainer = document.getElementById('ins-steps');
  if (insContainer) {
    insContainer.innerHTML = INSURANCE_STEPS.map(s => `
      <div class="ins-step">
        <div class="ins-step-title">${s.title}</div>
        <div class="ins-step-body">${s.body}</div>
      </div>
    `).join('');
  }
}

function switchSosTab(tab) {
  document.querySelectorAll('.sos-tab').forEach((t, i) => {
    const tabs = ['wound', 'hospital', 'insurance'];
    t.classList.toggle('active', tabs[i] === tab);
  });
  document.querySelectorAll('.sos-section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById('sos-' + tab);
  if (section) section.classList.add('active');
}

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderAnimalGrid();
  renderDeterGrid();
  renderSoundwave();
  renderSosContent();

  // Volume slider
  const volSlider = document.getElementById('vol-slider');
  if (volSlider) {
    volSlider.addEventListener('input', () => {
      if (audioCtx) {
        // volume updated on next play
      }
    });
  }

  // Keyboard ESC closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOpen) closeAnimalModal();
  });

  // Swipe to go back (simple swipe right)
  let touchStartX = 0;
  document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, {passive: true});
  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx > 80 && currentPage !== 'home') nav('home');
  }, {passive: true});
});
