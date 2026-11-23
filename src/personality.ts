const STORAGE_KEY = 'portos.interests.v1';
const categories = ['Listening to', 'Playing', 'Learning', 'Current rabbit hole'];

export function initInterests(root: HTMLElement, openSecret: () => void) {
  root.innerHTML = `<section class="interests"><p class="personality-eyebrow">A little less professional. A little more personal.</p><h1>Currently into</h1><p>A small shelf for whatever has my attention.</p><form class="interests-form"><div class="interest-grid"></div><div class="interest-actions"><button type="submit">Save my shelf</button><span role="status" class="shelf-status"></span></div></form><p class="shelf-note">Make it yours. These entries are saved only in this browser.</p><details class="odd-drawer"><summary>Miscellaneous drawer</summary><p>One suspicious file. Absolutely no useful information.</p><button class="secret-file"><i class="ph-fill ph-file-lock" aria-hidden="true"></i> Do not open</button></details></section>`;
  let saved: string[] = [];
  try { const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); if (Array.isArray(value)) saved = value.filter(item => typeof item === 'string'); } catch { /* Fresh shelf when storage is unavailable. */ }
  const grid = root.querySelector('.interest-grid')!;
  categories.forEach((name, index) => {
    const label = document.createElement('label');
    label.className = 'interest-card';
    const title = document.createElement('span');
    title.textContent = name;
    const input = document.createElement('textarea');
    input.name = `interest-${index}`;
    input.maxLength = 220;
    input.rows = 3;
    input.placeholder = ['An album, a song, a sound…', 'A game you keep coming back to…', 'Something you are figuring out…', 'The oddly specific thing…'][index];
    input.value = saved[index] || '';
    label.append(title, input);
    grid.append(label);
  });
  root.querySelector('form')!.addEventListener('submit', event => {
    event.preventDefault();
    const values = Array.from(root.querySelectorAll('textarea'), field => field.value.trim());
    const status = root.querySelector('.shelf-status')!;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); status.textContent = 'Saved. A little more you.'; }
    catch { status.textContent = 'This browser could not save your shelf. Your text is still here.'; }
  });
  root.querySelector('.secret-file')!.addEventListener('click', openSecret);
}

export function initSecret(root: HTMLElement) {
  root.innerHTML = `<section class="secret-room"><i class="ph-fill ph-detective" aria-hidden="true"></i><p class="personality-eyebrow">Classified, apparently</p><h1>You opened it.</h1><p>Excellent. The Department of Unnecessary Curiosity has been expecting you.</p><button class="secret-reveal">Reveal highly confidential information</button><p class="secret-result" role="status" hidden></p><small>No files harmed. Just a questionable use of your time.</small></section>`;
  const results = ['The duck is the senior developer. I just work here.', 'This folder contains 0 secrets and 1 very strong sense of occasion.', 'Official finding: opening suspicious folders is a personality trait.', 'Meeting minutes: quack. Action items: also quack.'];
  let index = 0;
  root.querySelector('button')!.addEventListener('click', () => {
    const result = root.querySelector<HTMLElement>('.secret-result')!;
    result.hidden = false;
    result.textContent = results[index++ % results.length];
    root.querySelector('button')!.textContent = 'Request another classified fact';
  });
}
