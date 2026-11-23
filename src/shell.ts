import { APP_ICONS, PLACEHOLDER_ICONS, notifyTaskbarUpdate } from './desktop';
import { openApp, windowAction, toggleDesktop, cycleWindows } from './window';
import { openNotesListWindow, createNewStickyNote } from './stickyNotes';

export function initShell(root: HTMLElement, windows: HTMLElement, taskbar: HTMLElement) {
  try { const saved: unknown = JSON.parse(localStorage.getItem('portos.pinned') || 'null'); if (Array.isArray(saved)) { PLACEHOLDER_ICONS.forEach(icon => { icon.pinned = saved.includes(icon.appId); }); notifyTaskbarUpdate(); } } catch { /* Default pins. */ }
  const panel = document.createElement('section');
  panel.className = 'os-panel'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Desktop menu');
  const menu = document.createElement('div'); menu.className = 'os-context'; menu.hidden = true;
  root.append(panel, menu);
  const start = taskbar.querySelector<HTMLButtonElement>('.taskbar__start')!;
  start.setAttribute('aria-expanded', 'false');
  let returnFocus: HTMLElement | null = null;
  const close = () => { panel.hidden = true; menu.hidden = true; start.setAttribute('aria-expanded', 'false'); };
  const launch = (id: string) => {
    close();
    if (id === 'credits') openNotesListWindow(windows);
    else { const icon = PLACEHOLDER_ICONS.find(i => i.appId === id); if (icon) openApp(windows, icon); }
  };
  const show = (kind: string) => {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : start;
    close(); panel.hidden = false; panel.dataset.kind = kind;
  };
  const launcher = () => {
    if (!panel.hidden && panel.dataset.kind === 'launcher') { close(); return; }
    show('launcher'); start.setAttribute('aria-expanded', 'true');
    panel.innerHTML = `<header><div><strong>PortOS</strong><small>A place for work & wandering</small></div><button data-settings aria-label="Quick settings"><i class="ph ph-sliders-horizontal"></i></button></header><input class="launcher-search" type="search" placeholder="Find an app…" aria-label="Find an app"><div class="launcher-apps"></div><p class="launcher-empty" hidden>No apps found.</p><footer>Ctrl / ⌘ + K to search <span>Escape to dismiss</span></footer>`;
    const list = panel.querySelector('.launcher-apps')!;
    PLACEHOLDER_ICONS.filter(i => !i.hidden).forEach(icon => {
      const button = document.createElement('button'); button.dataset.appId = icon.appId;
      button.innerHTML = `<i class="ph-fill ph-${APP_ICONS[icon.appId]}" aria-hidden="true"></i><span>${icon.label}</span>`;
      button.addEventListener('click', () => launch(icon.appId)); list.append(button);
    });
    const input = panel.querySelector<HTMLInputElement>('input')!;
    input.addEventListener('input', () => {
      let visible = 0;
      list.querySelectorAll<HTMLButtonElement>('button').forEach(button => { button.hidden = !button.textContent!.toLowerCase().includes(input.value.toLowerCase().trim()); if (!button.hidden) visible++; });
      panel.querySelector<HTMLElement>('.launcher-empty')!.hidden = visible > 0;
    });
    input.addEventListener('keydown', event => { if (event.key === 'Enter') list.querySelector<HTMLButtonElement>('button:not([hidden])')?.click(); if (event.key === 'ArrowDown') { event.preventDefault(); list.querySelector<HTMLButtonElement>('button:not([hidden])')?.focus(); } });
    panel.querySelector('[data-settings]')!.addEventListener('click', settings);
    input.focus();
  };
  const wallpapers = [['Midnight Chalk','wallpaper-midnight-chalk.png'],['Quiet Paper','wallpaper-quiet-paper.png'],['Pastel Objects','wallpaper-pastel-objects.png']];
  const applyWallpaper = (file: string) => {
    root.style.backgroundImage = `url('/images/${file}')`;
    root.classList.toggle('desktop--light-wallpaper', file !== wallpapers[0][1]);
  };
  try { const saved = localStorage.getItem('portos.wallpaper'); if (wallpapers.some(([,file]) => file === saved)) applyWallpaper(saved!); } catch { /* Defaults remain available. */ }
  const settings = () => {
    show('settings');
    panel.innerHTML = `<header><div><strong>Make yourself at home</strong><small>Desktop preferences</small></div><button data-dismiss aria-label="Close settings"><i class="ph ph-x"></i></button></header><h3>Wallpaper</h3><div class="wallpaper-options"></div><label class="setting-toggle"><span>Desktop buddy</span><input type="checkbox" aria-label="Show desktop buddy" ${root.classList.contains('hide-buddy') ? '' : 'checked'}></label><button class="settings-desktop">Show desktop</button><details><summary>Keyboard shortcuts</summary><p>Ctrl / ⌘ + K — app search<br>Alt + W — next app<br>Alt + D — show / restore desktop<br>Alt + ← / → — snap window<br>Escape — dismiss menus</p></details><p class="settings-status" role="status"></p>`;
    wallpapers.forEach(([label,file]) => {
      const button = document.createElement('button'); button.className = 'wallpaper-option'; button.setAttribute('aria-label', label);
      button.innerHTML = `<img src="/images/${file}" alt=""><span>${label}</span>`;
      button.addEventListener('click', () => { applyWallpaper(file); try { localStorage.setItem('portos.wallpaper', file); panel.querySelector('.settings-status')!.textContent = 'Wallpaper saved.'; } catch { panel.querySelector('.settings-status')!.textContent = 'Applied for this visit.'; } });
      panel.querySelector('.wallpaper-options')!.append(button);
    });
    panel.querySelector('input')!.addEventListener('change', event => { const hidden = !(event.target as HTMLInputElement).checked; root.classList.toggle('hide-buddy', hidden); try { localStorage.setItem('portos.hideBuddy', String(hidden)); } catch { /* Session-only preference. */ } });
    panel.querySelector('[data-dismiss]')!.addEventListener('click', close);
    panel.querySelector('.settings-desktop')!.addEventListener('click', () => { close(); toggleDesktop(); });
    panel.querySelector<HTMLButtonElement>('button')!.focus();
  };
  try { root.classList.toggle('hide-buddy', localStorage.getItem('portos.hideBuddy') === 'true'); } catch { /* Default visible. */ }
  start.addEventListener('click', launcher);
  const quick = document.createElement('button'); quick.className = 'taskbar__quick'; quick.setAttribute('aria-label', 'Quick settings'); quick.innerHTML = '<i class="ph ph-sliders-horizontal" aria-hidden="true"></i>'; quick.addEventListener('click', settings);
  taskbar.querySelector('.taskbar__section--right')!.prepend(quick);
  const desktop = document.createElement('button'); desktop.className = 'taskbar__show-desktop'; desktop.setAttribute('aria-label','Show or restore desktop'); desktop.title = 'Show desktop · Alt+D'; desktop.addEventListener('click', toggleDesktop); taskbar.append(desktop);
  const clock = taskbar.querySelector<HTMLElement>('.taskbar__clock')!; clock.tabIndex = 0; clock.setAttribute('role','button'); clock.setAttribute('aria-label','Open calendar');
  const calendar = () => {
    show('calendar'); const now = new Date();
    panel.innerHTML = `<header><strong>${now.toLocaleDateString([], {weekday:'long',month:'long',day:'numeric'})}</strong></header><h3>${now.toLocaleDateString([], {month:'long',year:'numeric'})}</h3><div class="calendar-grid"></div><p>No rush. One thing at a time.</p>`;
    const grid = panel.querySelector('.calendar-grid')!;
    ['S','M','T','W','T','F','S'].forEach(day => { const label = document.createElement('b'); label.textContent = day; grid.append(label); });
    const offset = new Date(now.getFullYear(),now.getMonth(),1).getDay();
    for (let i=0; i<offset; i++) grid.append(document.createElement('span'));
    const days = new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
    for(let day=1;day<=days;day++) { const cell = document.createElement('span'); cell.textContent = String(day); if(day===now.getDate()) { cell.className='today'; cell.setAttribute('aria-current','date'); } grid.append(cell); }
  };
  clock.addEventListener('click',calendar); clock.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();calendar();}});
  const action = (label: string, handler: () => void) => { const button = document.createElement('button'); button.textContent = label; button.addEventListener('click',()=>{close();handler();}); menu.append(button); };
  root.addEventListener('contextmenu', event => {
    const target = event.target as HTMLElement;
    if (target.closest('input,textarea,[contenteditable],iframe') || target.closest('.desktop-window__content')) return;
    event.preventDefault(); close(); menu.replaceChildren();
    const app = target.closest<HTMLElement>('.desktop-icon,.taskbar__app-icon');
    const win = target.closest<HTMLElement>('.desktop-window');
    if (app?.dataset.appId) {
      const icon = PLACEHOLDER_ICONS.find(i=>i.appId===app.dataset.appId)!;
      action(`Open ${icon.label}`,()=>launch(icon.appId));
      action(icon.pinned ? 'Unpin from taskbar':'Pin to taskbar',()=>{icon.pinned=!icon.pinned;try { localStorage.setItem('portos.pinned', JSON.stringify(PLACEHOLDER_ICONS.filter(i=>i.pinned).map(i=>i.appId))); } catch { /* Session-only pin. */ } notifyTaskbarUpdate();});
      if (target.closest('.taskbar__app-icon')) action('Close window',()=>windowAction('close',icon.appId));
    } else if (win?.dataset.appId) {
      action('Snap left',()=>windowAction('left',win.dataset.appId)); action('Snap right',()=>windowAction('right',win.dataset.appId)); action('Maximize / restore',()=>windowAction('maximize',win.dataset.appId)); action('Minimize',()=>windowAction('minimize',win.dataset.appId)); action('Close',()=>windowAction('close',win.dataset.appId));
    } else {
      action('Open app launcher',launcher); action('New sticky note',()=>createNewStickyNote(windows)); action('Show / restore desktop',toggleDesktop); action('Personalize desktop',settings);
    }
    menu.hidden=false; menu.style.left=`${Math.max(8,Math.min(event.clientX,root.clientWidth-menu.offsetWidth-8))}px`; menu.style.top=`${Math.max(8,Math.min(event.clientY,root.clientHeight-menu.offsetHeight-8))}px`; menu.querySelector('button')?.focus();
  });
  document.addEventListener('pointerdown',event=> { const target=event.target as Node; if(!panel.contains(target)&&!menu.contains(target)&&!taskbar.contains(target)) close(); });
  document.addEventListener('keydown',event=> {
    if(event.key==='Escape'){close();returnFocus?.focus();}
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();launcher();}
    if(event.altKey && !event.ctrlKey && !event.metaKey) {
      if(event.key.toLowerCase()==='d'){event.preventDefault();toggleDesktop();}
      if(event.key.toLowerCase()==='w'){event.preventDefault();cycleWindows();}
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();windowAction(event.key==='ArrowLeft'?'left':'right');}
    }
    if(!menu.hidden && ['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); const buttons=Array.from(menu.querySelectorAll('button')); const i=buttons.indexOf(document.activeElement as HTMLButtonElement); buttons[(i+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus(); }
  });
}
