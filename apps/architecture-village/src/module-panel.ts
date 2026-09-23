import type { Challenge, JourneyStop, QuizQuestion, StopProgress, ToolCard } from './types';
import { REVIEW_THRESHOLD, completed } from './progress';
import { escapeHTML as h } from './ui';

declare global {
  interface Window {
    mermaid?: { initialize: (config: Record<string, unknown>) => void; run: (config?: { nodes?: Element[] }) => Promise<void> };
  }
}

export type StopCallbacks = {
  challenge: (weakTags: string[]) => void;
  quiz: (score: number, weakTags: string[]) => void;
  next: () => void;
};

export function mountStop(
  host: HTMLElement,
  stop: JourneyStop,
  cards: ToolCard[],
  state: StopProgress,
  callbacks: StopCallbacks,
): () => void {
  let challengeSubmitted = state.challengeAttempts > 0;
  let quizDone = false;

  function draw() {
    host.innerHTML = `<article class="stop-panel">
      <header class="stop-hero" style="--stop:${h(stop.color)}">
        <div class="stop-kicker"><span>${String(stop.order).padStart(2, '0')}</span>${h(stop.place)} · ${stop.duration} min</div>
        <h1>${h(stop.title)}</h1>
        <p>${h(stop.problem)}</p>
        <small>${h(stop.subtitle)}</small>
      </header>
      <section class="story-block">
        <div class="section-eyebrow">Story Problem</div>
        <p>${h(stop.story)}</p>
        <div class="clue-list">${stop.clues.map(clue => `<span>${h(clue)}</span>`).join('')}</div>
      </section>
      <section class="knowledge-flow">
        <div class="section-eyebrow">Knowledge Beats</div>
        ${stop.beats.map((beat, index) => `<article><span>${index + 1}</span><h3>${h(beat.title)}</h3><p>${h(beat.body)}</p></article>`).join('')}
      </section>
      ${stop.diagram ? `<section class="diagram-block"><div class="section-eyebrow">Problem Diagram</div><pre class="mermaid">${h(stop.diagram)}</pre></section>` : ''}
      <section class="toolkit-block">
        <div class="section-eyebrow">Tool Cards</div>
        ${cards.map(card => toolCard(card)).join('')}
      </section>
      <section class="challenge-block" id="challenge-block"></section>
      <section class="quiz-block" id="quiz-block"></section>
    </article>`;
    mountChallenge(host.querySelector('#challenge-block')!, stop.challenge, value => {
      challengeSubmitted = true;
      callbacks.challenge(value);
      draw();
    }, challengeSubmitted);
    mountStopQuiz(host.querySelector('#quiz-block')!, stop.quiz, state, (score, tags) => {
      quizDone = true;
      callbacks.quiz(score, tags);
      draw();
    }, () => callbacks.next(), quizDone);
    void renderMermaid(host);
  }

  draw();
  return () => { host.innerHTML = ''; };
}

let mermaidLoading: Promise<void> | null = null;

function loadMermaid(): Promise<void> {
  if (window.mermaid) return Promise.resolve();
  if (mermaidLoading) return mermaidLoading;
  mermaidLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
    script.async = true;
    script.onload = () => {
      window.mermaid?.initialize({ startOnLoad: false, theme: 'base', securityLevel: 'strict' });
      resolve();
    };
    script.onerror = () => reject(new Error('Could not load Mermaid.'));
    document.head.append(script);
  });
  return mermaidLoading;
}

async function renderMermaid(host: HTMLElement) {
  const diagrams = Array.from(host.querySelectorAll<HTMLElement>('.mermaid'));
  if (!diagrams.length) return;
  try {
    await loadMermaid();
    await window.mermaid?.run({ nodes: diagrams });
  } catch {
    diagrams.forEach(diagram => diagram.classList.add('mermaid-fallback'));
  }
}

function toolCard(card: ToolCard): string {
  return `<article class="tool-card">
    <div><span>${h(card.category)}</span><h3>${h(card.title)}</h3></div>
    <p><b>Signal:</b> ${h(card.signal)}</p>
    <p><b>Method:</b> ${h(card.method)}</p>
    <ol>${card.steps.map(step => `<li>${h(step)}</li>`).join('')}</ol>
    <p><b>Tradeoff:</b> ${h(card.tradeoff)}</p>
    <p><b>Verify:</b> ${h(card.verification)}</p>
  </article>`;
}

function mountChallenge(host: HTMLElement, challenge: Challenge, complete: (weakTags: string[]) => void, submitted: boolean) {
  const status = submitted ? '<p class="done-note">Obstacle tried. You can revisit it, but the quiz is what completes this stop.</p>' : '';
  if (challenge.kind === 'sequence') {
    host.innerHTML = `<div class="section-eyebrow">Obstacle</div><h2>${h(challenge.title)}</h2><p>${h(challenge.prompt)}</p>
      <div class="sequence-list">${challenge.items.map((item, index) => `<label><select data-seq="${h(item)}">${challenge.items.map((_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}</select>${h(item)}</label>`).join('')}</div>
      <button class="primary" data-submit>Check the request path</button><div id="challenge-result">${status}</div>`;
    host.querySelector<HTMLButtonElement>('[data-submit]')!.onclick = () => {
      const placed = Array.from(host.querySelectorAll<HTMLSelectElement>('[data-seq]')).sort((a, b) => Number(a.value) - Number(b.value)).map(input => input.dataset.seq!);
      const correct = placed.every((item, index) => item === challenge.answer[index]);
      const tags = correct ? [] : [challenge.tag];
      host.querySelector('#challenge-result')!.innerHTML = `<div class="feedback ${correct ? '' : 'failure'}"><b>${correct ? 'Path repaired' : 'Review the request journey'}</b><p>${h(correct ? challenge.observation : `Expected order: ${challenge.answer.join(' -> ')}. ${challenge.observation}`)}</p></div>`;
      complete(tags);
    };
  } else if (challenge.kind === 'diagnose') {
    host.innerHTML = `<div class="section-eyebrow">Obstacle</div><h2>${h(challenge.title)}</h2><p>${h(challenge.prompt)}</p>
      ${challenge.cases.map(item => `<label class="case-row"><b>${h(item.clue)}</b><select data-case="${h(item.id)}"><option>DNS</option><option>Connection</option><option>Application</option></select></label>`).join('')}
      <button class="primary" data-submit>Diagnose clues</button><div id="challenge-result">${status}</div>`;
    host.querySelector<HTMLButtonElement>('[data-submit]')!.onclick = () => {
      const misses = challenge.cases.filter(item => host.querySelector<HTMLSelectElement>(`[data-case="${item.id}"]`)!.value !== item.answer);
      host.querySelector('#challenge-result')!.innerHTML = `<div class="feedback ${misses.length ? 'failure' : ''}"><b>${misses.length ? 'Review suggested' : 'Diagnosis complete'}</b>${challenge.cases.map(item => `<p>${h(item.answer)}: ${h(item.explanation)}</p>`).join('')}</div>`;
      complete(misses.map(item => item.tag));
    };
  } else if (challenge.kind === 'contract' || challenge.kind === 'data' || challenge.kind === 'cache') {
    const entries = challenge.kind === 'contract' ? challenge.fixes : challenge.decisions;
    host.innerHTML = `<div class="section-eyebrow">Obstacle</div><h2>${h(challenge.title)}</h2><p>${h(challenge.prompt)}</p>
      ${entries.map(item => `<label class="check-row"><input type="checkbox" data-pick="${h(item.id)}">${h(item.label)}</label>`).join('')}
      <button class="primary" data-submit>Submit obstacle</button><div id="challenge-result">${status}</div>`;
    host.querySelector<HTMLButtonElement>('[data-submit]')!.onclick = () => {
      const misses = entries.filter(item => host.querySelector<HTMLInputElement>(`[data-pick="${item.id}"]`)!.checked !== item.correct);
      host.querySelector('#challenge-result')!.innerHTML = `<div class="feedback ${misses.length ? 'failure' : ''}"><b>${misses.length ? 'Review suggested' : 'Obstacle complete'}</b>${entries.map(item => `<p>${item.correct ? 'Use' : 'Skip'}: ${h(item.explanation)}</p>`).join('')}</div>`;
      complete(misses.map(item => item.tag));
    };
  } else if (challenge.kind === 'bottleneck') {
    host.innerHTML = `<div class="section-eyebrow">Obstacle</div><h2>${h(challenge.title)}</h2><p>${h(challenge.prompt)}</p>
      ${challenge.symptoms.map(item => `<label class="case-row"><b>${h(item.label)}</b><select data-symptom="${h(item.id)}"><option value="cache">cache</option><option value="queue">queue</option><option value="scale-out">scale-out</option></select></label>`).join('')}
      <button class="primary" data-submit>Match tools</button><div id="challenge-result">${status}</div>`;
    host.querySelector<HTMLButtonElement>('[data-submit]')!.onclick = () => {
      const misses = challenge.symptoms.filter(item => host.querySelector<HTMLSelectElement>(`[data-symptom="${item.id}"]`)!.value !== item.answer);
      host.querySelector('#challenge-result')!.innerHTML = `<div class="feedback ${misses.length ? 'failure' : ''}"><b>${misses.length ? 'Review suggested' : 'Growth tools matched'}</b>${challenge.symptoms.map(item => `<p>${h(item.answer)}: ${h(item.explanation)}</p>`).join('')}</div>`;
      complete(misses.map(item => item.tag));
    };
  } else if (challenge.kind === 'shard') {
    host.innerHTML = `<div class="section-eyebrow">Obstacle</div><h2>${h(challenge.title)}</h2><p>${h(challenge.prompt)}</p>
      ${challenge.candidates.map(item => `<label class="case-row"><b>${h(item.label)}</b><select data-shard="${h(item.id)}"><option value="strong">strong</option><option value="weak">weak</option><option value="danger">danger</option></select></label>`).join('')}
      <button class="primary" data-submit>Rate shard keys</button><div id="challenge-result">${status}</div>`;
    host.querySelector<HTMLButtonElement>('[data-submit]')!.onclick = () => {
      const misses = challenge.candidates.filter(item => host.querySelector<HTMLSelectElement>(`[data-shard="${item.id}"]`)!.value !== item.fit);
      host.querySelector('#challenge-result')!.innerHTML = `<div class="feedback ${misses.length ? 'failure' : ''}"><b>${misses.length ? 'Review suggested' : 'Shard keys rated'}</b>${challenge.candidates.map(item => `<p>${h(item.fit)}: ${h(item.explanation)}</p>`).join('')}</div>`;
      complete(misses.map(item => item.tag));
    };
  } else if (challenge.kind === 'ring') {
    host.innerHTML = `<div class="section-eyebrow">Obstacle</div><h2>${h(challenge.title)}</h2><p>${h(challenge.prompt)}</p>
      ${challenge.events.map(item => `<label class="case-row"><b>${h(item.label)}</b><select data-ring="${h(item.id)}"><option value="few-keys">few keys move</option><option value="many-keys">many keys move</option><option value="skewed">load is skewed</option></select></label>`).join('')}
      <button class="primary" data-submit>Check ring events</button><div id="challenge-result">${status}</div>`;
    host.querySelector<HTMLButtonElement>('[data-submit]')!.onclick = () => {
      const misses = challenge.events.filter(item => host.querySelector<HTMLSelectElement>(`[data-ring="${item.id}"]`)!.value !== item.answer);
      host.querySelector('#challenge-result')!.innerHTML = `<div class="feedback ${misses.length ? 'failure' : ''}"><b>${misses.length ? 'Review suggested' : 'Ring decisions checked'}</b>${challenge.events.map(item => `<p>${h(item.answer)}: ${h(item.explanation)}</p>`).join('')}</div>`;
      complete(misses.map(item => item.tag));
    };
  } else {
    host.innerHTML = `<div class="section-eyebrow">Obstacle</div><h2>${h(challenge.title)}</h2><p>${h(challenge.prompt)}</p>
      ${challenge.operations.map(item => `<label class="case-row"><b>${h(item.label)}</b><select data-partition="${h(item.id)}"><option value="CP">CP</option><option value="AP">AP</option><option value="Reconcile">Reconcile</option></select></label>`).join('')}
      <button class="primary" data-submit>Choose behavior</button><div id="challenge-result">${status}</div>`;
    host.querySelector<HTMLButtonElement>('[data-submit]')!.onclick = () => {
      const misses = challenge.operations.filter(item => host.querySelector<HTMLSelectElement>(`[data-partition="${item.id}"]`)!.value !== item.answer);
      host.querySelector('#challenge-result')!.innerHTML = `<div class="feedback ${misses.length ? 'failure' : ''}"><b>${misses.length ? 'Review suggested' : 'Partition choices saved'}</b>${challenge.operations.map(item => `<p>${h(item.answer)}: ${h(item.explanation)}</p>`).join('')}</div>`;
      complete(misses.map(item => item.tag));
    };
  }
}

function mountStopQuiz(host: HTMLElement, questions: QuizQuestion[], state: StopProgress, completeQuiz: (score: number, tags: string[]) => void, next: () => void, justSubmitted: boolean) {
  let answers = Array<number | undefined>(questions.length).fill(undefined);
  host.innerHTML = `<div class="section-eyebrow">Cumulative Quiz <span>5 questions</span></div>
    <h2>Lock in the toolkit</h2>
    ${questions.map((question, index) => `<fieldset class="quiz-question"><legend>${index + 1}. ${h(question.prompt)} ${question.scope === 'retrieval' ? '<span>retrieval</span>' : ''}</legend>${question.options.map((option, optionIndex) => `<label><input type="radio" name="${h(question.id)}" value="${optionIndex}">${h(option)}</label>`).join('')}</fieldset>`).join('')}
    <button class="primary" data-quiz>Submit quiz</button>
    <div id="quiz-result">${renderQuizStatus(state, justSubmitted)}</div>`;
  host.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach(input => {
    input.onchange = () => {
      const index = questions.findIndex(question => question.id === input.name);
      answers[index] = Number(input.value);
    };
  });
  host.querySelector<HTMLButtonElement>('[data-quiz]')!.onclick = () => {
    if (answers.some(answer => answer === undefined)) {
      host.querySelector('#quiz-result')!.innerHTML = '<p class="warning-note">Answer all five questions before submitting.</p>';
      return;
    }
    const weak = questions.filter((question, index) => answers[index] !== question.answer).map(question => question.tag);
    const score = Math.round((questions.length - weak.length) / questions.length * 100);
    completeQuiz(score, weak);
  };
  const nextButton = document.createElement('button');
  nextButton.className = 'secondary';
  nextButton.type = 'button';
  nextButton.textContent = completed(state) ? 'Continue journey ->' : 'Continue to suggested stop';
  nextButton.onclick = next;
  host.append(nextButton);
}

function renderQuizStatus(state: StopProgress, justSubmitted: boolean): string {
  if (!state.quizAttempts) return '<p class="small">Submitting once completes this stop. A score below 80% only marks review suggestions.</p>';
  const review = state.quizBest < REVIEW_THRESHOLD || state.weakTags.length > 0;
  return `<div class="result-banner ${review ? 'retry' : 'success'}"><span class="result-icon">${review ? 'Review' : 'Done'}</span><h3>${review ? 'Review suggested' : 'Stop complete'}</h3><strong>${state.quizBest}%</strong><p>${review ? `Revisit: ${state.weakTags.map(h).join(', ')}` : 'The next stop is unlocked.'}</p>${justSubmitted ? '<p>Progress saved.</p>' : ''}</div>`;
}
