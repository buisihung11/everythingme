import './foundation.css';
import { curriculum, finalIncidentByVillage, stopById, toolCardById, villageById } from './curriculum';
import { completed, discoverCards, finalUnlocked, foundationComplete, loadProgress, recordChallengeAttempt, recordFinal, recordQuiz, recommended, stopUnlocked, stopsForVillage, STORAGE_KEY, villageComplete } from './progress';
import { parseRoute } from './router';
import { mountStop } from './module-panel';
import { openJournal } from './journal';
import { escapeHTML as h, notify, query as $ } from './ui';
import type { ProgressV4, VillageId } from './types';
import type { createScene } from './scene';

let loaded: { progress: ProgressV4; warning: string };
try {
  loaded = loadProgress(localStorage, curriculum);
} catch {
  loaded = { ...loadProgress({ getItem: () => null }, curriculum), warning: 'This browser session cannot save automatically. Export JSON before closing if needed.' };
}

let progress = loaded.progress;
let storageWritable = !loaded.warning;
let disposePanel: () => void = () => {};
let scene: ReturnType<typeof createScene> | undefined;
let sceneVillageId: VillageId | null = null;
let renderId = 0;

$('#app').innerHTML = `<header class="site-header">
  <a class="brand" href="#/village/foundation"><span>✦</span> Architecture Village<span class="brand-dot">.</span></a>
  <span class="header-divider"></span>
  <span id="brand-sub" class="brand-sub">FOUNDATION JOURNEY</span>
  <nav><button id="journal">Toolkit Journal</button></nav>
  <span id="progress-pill" class="xp">0 / 5</span>
</header>
<div class="app-layout">
  <aside class="journey-sidebar">
    <label class="village-select-label" for="village-select">Village</label>
    <select id="village-select" class="village-select"></select>
    <div id="sidebar-eyebrow" class="eyebrow">FOUNDATION</div>
    <h2 id="sidebar-title">Explore the village.<br>Collect the tools.</h2>
    <p id="sidebar-intro" class="sidebar-intro"></p>
    <div class="journey-progress">
      <div><span>Stops complete</span><b id="mastery-count">0 / 5</b></div>
      <div class="progress-bar"><i id="mastery-fill"></i></div>
      <small id="next-caption">Start at Town Square.</small>
    </div>
    <div id="journey-links"></div>
    <a id="quest-link" class="quest-link" href="#/stop/town-square"><span>→</span><div>NEXT STOP<b id="quest-title">Town Square</b></div></a>
    <div class="sidebar-footer">TOOLKIT FIRST<p>Problem → tool → try → quiz.</p></div>
  </aside>
  <main id="main-content"></main>
</div>
<div id="notice" class="notice" role="status" hidden></div>`;

function save() {
  progress.updatedAt = new Date().toISOString();
  if (storageWritable) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      storageWritable = false;
      notify('Automatic save failed. Progress remains in this session; export JSON to keep it.');
    }
  }
  updateChrome();
}

function routeVillage(): VillageId {
  const route = parseRoute(location.hash);
  if (route.kind === 'village' || route.kind === 'final') return route.villageId;
  try {
    return stopById(route.stopId).villageId;
  } catch {
    return progress.lastVillageId;
  }
}

function setLastVillage(villageId: VillageId) {
  if (progress.lastVillageId !== villageId) {
    progress.lastVillageId = villageId;
    save();
  }
}

function currentStops(villageId = routeVillage()) {
  return stopsForVillage(curriculum, villageId);
}

function updateChrome() {
  const route = parseRoute(location.hash);
  const villageId = routeVillage();
  const village = villageById(villageId);
  const localStops = currentStops(villageId);
  const count = localStops.filter(stop => completed(progress.stops[stop.id])).length;
  const finalOpen = finalUnlocked(curriculum, progress, villageId);
  const incident = finalIncidentByVillage(villageId);
  $('#brand-sub').textContent = village.subtitle;
  $('#sidebar-eyebrow').textContent = village.badge || village.subtitle;
  $('#sidebar-intro').textContent = village.description;
  $('#mastery-count').textContent = `${count} / ${localStops.length}`;
  $('#progress-pill').textContent = `${count} / ${localStops.length}`;
  $('#mastery-fill').style.width = `${count / localStops.length * 100}%`;
  $('#next-caption').textContent = villageComplete(curriculum, progress, villageId) ? `${village.title} complete. Optional final incident is open.` : `${localStops.length - count} stops left in ${village.title}.`;
  $('#village-select').innerHTML = curriculum.villages.map(item => `<option value="${h(item.id)}" ${item.id === villageId ? 'selected' : ''}>${h(item.title)}${item.badge ? ' · Recommended after Foundation' : ''}</option>`).join('');
  $('#journey-links').innerHTML = localStops.map(stop => {
    const unlocked = stopUnlocked(curriculum, progress, stop.id);
    const done = completed(progress.stops[stop.id]);
    const active = route.kind === 'stop' && route.stopId === stop.id;
    return `<a class="stop-link ${active ? 'selected' : ''} ${unlocked ? '' : 'locked'}" href="${unlocked ? `#/stop/${stop.id}` : `#/village/${villageId}`}" ${active ? 'aria-current="page"' : ''}>
      <span>${done ? '✓' : stop.icon}</span>
      <div><b>${h(stop.place)}</b><small>${h(stop.problem)}</small></div>
      <i>${unlocked ? done ? 'completed' : 'available' : 'locked'}</i>
    </a>`;
  }).join('') + `<a class="stop-link final ${route.kind === 'final' && route.villageId === villageId ? 'selected' : ''} ${finalOpen ? '' : 'locked'}" href="${finalOpen ? `#/final/${villageId}` : `#/village/${villageId}`}"><span>★</span><div><b>Final Incident</b><small>${h(incident.title)}</small></div><i>${finalOpen ? 'optional' : 'locked'}</i></a>`;
  const next = recommended(curriculum, progress, villageId);
  $('#quest-link').setAttribute('href', next);
  const nextRoute = parseRoute(next);
  $('#quest-title').textContent = nextRoute.kind === 'stop' ? stopById(nextRoute.stopId).place : nextRoute.kind === 'final' ? 'Final Incident' : 'Village Map';
  scene?.statuses(Object.fromEntries(localStops.map(stop => [stop.id, completed(progress.stops[stop.id]) ? 'mastered' : route.kind === 'stop' && route.stopId === stop.id ? 'active' : stopUnlocked(curriculum, progress, stop.id) ? 'available' : 'locked'])));
}

function clearScene() {
  scene?.dispose();
  scene = undefined;
  sceneVillageId = null;
  renderId++;
}

async function buildVillage(villageId: VillageId) {
  clearScene();
  const token = renderId;
  const village = villageById(villageId);
  $('#main-content').innerHTML = `<div class="village-shell">
    <section class="village-stage">
      <div class="scene-frame">
        <div id="world" class="scene-host"></div>
        <div class="scene-badge"><i></i><span>${h(village.title)}</span></div>
        <div class="scene-tools">
          <button id="zoom-in" aria-label="Zoom in">+</button>
          <button id="zoom-out" aria-label="Zoom out">−</button>
          <button id="reset-camera" aria-label="Reset camera">⌖</button>
        </div>
        <div class="scene-hint">Click ground to walk · click buildings to open · drag to orbit</div>
      </div>
      <div id="village-overview"></div>
    </section>
    <section class="learning-panel" id="learning-panel" aria-label="Learning panel"></section>
  </div>`;
  $('#zoom-in').onclick = () => scene?.zoom(.86);
  $('#zoom-out').onclick = () => scene?.zoom(1.16);
  $('#reset-camera').onclick = () => scene?.reset();
  try {
    const { createScene } = await import('./scene');
    if (token !== renderId) return;
    scene = createScene($('#world'), village, curriculum.stops, id => openStop(id));
    sceneVillageId = villageId;
    const route = parseRoute(location.hash);
    if (route.kind === 'stop') scene.select(route.stopId);
    updateChrome();
  } catch {
    if (token !== renderId) return;
    $('#world').innerHTML = `<div class="webgl-fallback"><span>${h(village.title)}</span><h2>The map is unavailable</h2><p>WebGL is unavailable, but every lesson still works through the sidebar.</p></div>`;
  }
}

function openStop(id: string) {
  let stop;
  try {
    stop = stopById(id);
  } catch {
    notify('This stop does not exist.');
    return;
  }
  if (!stopUnlocked(curriculum, progress, id)) {
    const localStops = stopsForVillage(curriculum, stop.villageId);
    const index = localStops.findIndex(item => item.id === id);
    const previous = localStops[index - 1];
    notify(previous ? `Complete ${previous.place} quiz once to unlock this stop.` : 'This stop is locked.');
    return;
  }
  location.hash = `#/stop/${id}`;
}

function overview(villageId: VillageId) {
  const village = villageById(villageId);
  const localStops = currentStops(villageId);
  $('#village-overview').innerHTML = `<div class="village-note"><span>⌁</span><div><b>${h(village.description)}</b><p>All stops are open for exploration. Quizzes still save completion and review suggestions.</p></div></div>
    <div class="local-places">${localStops.map(stop => `<button class="place-chip" data-stop="${h(stop.id)}"><span>${h(stop.icon)}</span><div><b>${h(stop.place)}</b><small>${h(stop.problem)}</small></div><i>${completed(progress.stops[stop.id]) ? '✓' : stopUnlocked(curriculum, progress, stop.id) ? '→' : 'locked'}</i></button>`).join('')}</div>`;
  document.querySelectorAll<HTMLButtonElement>('[data-stop]').forEach(button => {
    button.onclick = () => {
      const id = button.dataset.stop!;
      scene?.select(id);
      openStop(id);
    };
  });
}

function renderVillageHome(villageId: VillageId) {
  const village = villageById(villageId);
  const incident = finalIncidentByVillage(villageId);
  overview(villageId);
  $('#learning-panel').innerHTML = `<div class="village-welcome">
    <div class="eyebrow">${h(village.badge || village.subtitle)}</div>
    <h2>${h(village.title)}</h2>
    <p>${h(village.description)}</p>
    ${currentStops(villageId).map(stop => `<button class="welcome-stop" data-stop="${h(stop.id)}"><span>${h(stop.icon)}</span><div><b>${h(stop.title)}</b><small>${h(stop.problem)}</small></div><i>${completed(progress.stops[stop.id]) ? '✓' : stopUnlocked(curriculum, progress, stop.id) ? 'Start' : 'Locked'}</i></button>`).join('')}
    <a class="boss-gate" href="${finalUnlocked(curriculum, progress, villageId) ? `#/final/${villageId}` : `#/village/${villageId}`}">${h(incident.title)}<small>${finalUnlocked(curriculum, progress, villageId) ? 'Optional review open' : 'Opens after the last stop quiz submit'}</small></a>
  </div>`;
  document.querySelectorAll<HTMLButtonElement>('.welcome-stop[data-stop]').forEach(button => button.onclick = () => openStop(button.dataset.stop!));
}

function renderStop(stopId: string) {
  let stop;
  try {
    stop = stopById(stopId);
  } catch {
    location.hash = '#/village/foundation';
    return;
  }
  overview(stop.villageId);
  if (!stopUnlocked(curriculum, progress, stop.id)) {
    $('#learning-panel').innerHTML = `<div class="locked-boss"><h2>${h(stop.place)} is locked</h2><p>Submit the previous stop quiz once to continue the route.</p><button class="primary" id="go-next">Go to available stop</button></div>`;
    $('#go-next').onclick = () => { location.hash = recommended(curriculum, progress, stop.villageId); };
    return;
  }
  scene?.select(stop.id);
  discoverCards(progress, stop.toolCardIds);
  save();
  disposePanel = mountStop($('#learning-panel'), stop, stop.toolCardIds.map(toolCardById), progress.stops[stop.id], {
    challenge: tags => { recordChallengeAttempt(progress, stop.id, tags); save(); },
    quiz: (score, tags) => { recordQuiz(progress, stop.id, score, tags); save(); },
    next: () => { location.hash = recommended(curriculum, progress, stop.villageId); },
  });
}

function renderFinal(villageId: VillageId) {
  overview(villageId);
  if (!finalUnlocked(curriculum, progress, villageId)) {
    $('#learning-panel').innerHTML = `<div class="locked-boss"><h2>Final incident is locked</h2><p>Complete every stop quiz in this village once. Scores do not gate progress.</p></div>`;
    return;
  }
  const incident = finalIncidentByVillage(villageId);
  const finalState = progress.finalIncidents[villageId];
  let answers = Array<number | undefined>(incident.steps.length).fill(undefined);
  $('#learning-panel').innerHTML = `<div class="boss-panel"><div class="section-eyebrow">Optional Final Incident</div><h2>${h(incident.title)}</h2><p>${h(incident.summary)}</p>
    ${incident.steps.map((step, index) => `<fieldset class="quiz-question"><legend>${index + 1}. ${h(step.prompt)}</legend>${step.options.map((option, optionIndex) => `<label><input type="radio" name="${h(step.id)}" value="${optionIndex}">${h(option)}</label>`).join('')}</fieldset>`).join('')}
    <button class="primary" id="submit-final">Save final score</button><div id="final-result">${finalState.attempts ? `<div class="result-banner success"><span class="result-icon">Best</span><strong>${finalState.best}%</strong><p>This optional score does not affect ${h(villageById(villageId).title)} completion.</p></div>` : ''}</div></div>`;
  document.querySelectorAll<HTMLInputElement>('.boss-panel input[type="radio"]').forEach(input => input.onchange = () => {
    const index = incident.steps.findIndex(step => step.id === input.name);
    answers[index] = Number(input.value);
  });
  $('#submit-final').onclick = () => {
    if (answers.some(answer => answer === undefined)) {
      $('#final-result').innerHTML = '<p class="warning-note">Answer every incident decision before saving.</p>';
      return;
    }
    const weak = incident.steps.filter((step, index) => answers[index] !== step.answer).map(step => step.tag);
    const score = Math.round((incident.steps.length - weak.length) / incident.steps.length * 100);
    recordFinal(progress, villageId, score, weak);
    save();
    $('#final-result').innerHTML = `<div class="result-banner ${weak.length ? 'retry' : 'success'}"><span class="result-icon">${weak.length ? 'Review' : 'Done'}</span><strong>${score}%</strong><p>${weak.length ? `Review suggested: ${weak.map(h).join(', ')}` : 'Incident handled cleanly.'}</p></div>`;
  };
}

async function render() {
  disposePanel();
  disposePanel = () => {};
  const route = parseRoute(location.hash);
  const villageId = routeVillage();
  setLastVillage(villageId);
  if (!scene || sceneVillageId !== villageId) await buildVillage(villageId);
  if (route.kind === 'stop') renderStop(route.stopId);
  else if (route.kind === 'final') renderFinal(route.villageId);
  else renderVillageHome(route.villageId);
  updateChrome();
}

$('#village-select').onchange = event => {
  location.hash = `#/village/${(event.target as HTMLSelectElement).value}`;
};
$('#journal').onclick = () => openJournal(curriculum, progress, next => { progress = next; storageWritable = true; render(); });
window.addEventListener('hashchange', () => { void render(); });
window.addEventListener('pagehide', () => { disposePanel(); clearScene(); });
window.addEventListener('pageshow', event => { if (event.persisted) void render(); });
if (!location.hash) location.hash = '#/village/foundation';
void render();
if (loaded.warning) notify(loaded.warning);
