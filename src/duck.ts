export function initDuck(root: HTMLElement) {
  const buddy = document.createElement('div');
  buddy.className = 'buddy';
  buddy.innerHTML = `<p class="buddy-message" role="status" hidden></p><button class="buddy-pet" aria-label="Pet the duck"><span class="buddy-sprite" aria-hidden="true"></span></button><button class="buddy-rest" aria-label="Let the duck nap" title="Let the duck nap"><i class="ph ph-moon" aria-hidden="true"></i></button>`;
  root.append(buddy);
  const pet = buddy.querySelector<HTMLButtonElement>('.buddy-pet')!;
  const rest = buddy.querySelector<HTMLButtonElement>('.buddy-rest')!;
  const message = buddy.querySelector<HTMLElement>('.buddy-message')!;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let sleeping = false;
  let count = 0;
  let timeout = 0;
  let x = Math.max(0, root.clientWidth - 150);
  let target = x;
  let frame = 0;
  let last = performance.now();
  let wanderAt = last + 8000;
  const clamp = (value: number) => Math.max(0, Math.min(value, root.clientWidth - 112));
  const speak = (text: string) => {
    clearTimeout(timeout);
    message.textContent = text;
    message.hidden = false;
    timeout = window.setTimeout(() => { message.hidden = true; }, 4200);
  };
  pet.addEventListener('click', () => {
    speak(sleeping ? 'Currently buffering a dream.' : ['quack. (that means hello.)', 'You have excellent taste in ducks.', 'I supervise. Mostly.', 'No thoughts. Just webbed feet.'][count++ % 4]);
    wanderAt = performance.now() + 6000;
    target = x;
  });
  rest.addEventListener('click', () => {
    sleeping = !sleeping;
    rest.setAttribute('aria-label', sleeping ? 'Wake the duck' : 'Let the duck nap');
    rest.title = sleeping ? 'Wake the duck' : 'Let the duck nap';
    rest.innerHTML = `<i class="ph ph-${sleeping ? 'sun' : 'moon'}" aria-hidden="true"></i>`;
    buddy.classList.toggle('is-asleep', sleeping);
    target = x;
    speak(sleeping ? 'Off the clock. Please hold.' : 'Back from a very important nap.');
  });
  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    x = clamp(x);
    target = clamp(target);
    if (!sleeping && !motion.matches && !document.hidden) {
      if (now > wanderAt) { target = clamp(x + (Math.random() - .5) * 260); wanderAt = now + 10000; }
      const dx = target - x;
      if (Math.abs(dx) > 2) {
        x += Math.sign(dx) * Math.min(Math.abs(dx), dt * 22);
        buddy.style.setProperty('--duck-facing', dx < 0 ? '-1' : '1');
      }
      buddy.classList.toggle('is-walking', Math.abs(dx) > 2);
    } else buddy.classList.remove('is-walking');
    buddy.style.left = `${x}px`;
    message.style.left = `${Math.max(8 - x, Math.min(0, root.clientWidth - x - 205))}px`;
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return { destroy() { cancelAnimationFrame(frame); clearTimeout(timeout); buddy.remove(); } };
}
