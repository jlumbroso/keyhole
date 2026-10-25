// Progressive enhancement only: chapters, navigation, and downloads are plain HTML.
const root = document.documentElement;
const choices = [...document.querySelectorAll('[data-theme-choice]')];
function setTheme(theme) {
  root.dataset.theme = theme;
  choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
}
try { setTheme(localStorage.getItem('keyhole-manual-theme') === 'dark' ? 'dark' : 'light'); } catch {}
document.querySelector('.theme-control').hidden = false;
choices.forEach(button => button.addEventListener('click', () => {
  setTheme(button.dataset.themeChoice);
  try { localStorage.setItem('keyhole-manual-theme', root.dataset.theme); } catch {}
}));
const status = document.createElement('p');
status.className = 'copy-status';
status.setAttribute('role', 'status');
document.body.append(status);
const pageCopy = document.querySelector('.copy-page');
const pageData = document.getElementById('chapter-markdown');
if (pageCopy && pageData) {
  // The build embeds the exact Markdown export, so copying needs no fetch.
  const markdown = JSON.parse(pageData.textContent);
  const pageStatus = document.getElementById('page-copy-status');
  const fallback = document.querySelector('.page-copy-fallback');
  const selectedText = document.getElementById('page-markdown-fallback');
  if (typeof markdown === 'string') {
    pageCopy.hidden = false;
    pageCopy.addEventListener('click', async () => {
      pageStatus.textContent = '';
      try {
        await navigator.clipboard.writeText(markdown);
        fallback.hidden = true;
        pageStatus.textContent = 'Page copied.';
      } catch {
        selectedText.value = markdown;
        fallback.hidden = false;
        selectedText.focus();
        selectedText.select();
        pageStatus.textContent = 'Automatic copy is unavailable. Use your keyboard to copy the selected Markdown below.';
      }
    });
  }
}
document.querySelectorAll('pre').forEach(pre => {
  const controls = document.createElement('div');
  controls.className = 'code-tools';
  const button = document.createElement('button');
  button.className = 'copy';
  button.type = 'button';
  button.textContent = 'Copy';
  button.setAttribute('aria-label', 'Copy code example');
  controls.append(button);
  pre.before(controls);
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pre.textContent);
      button.textContent = 'Copied';
      status.textContent = 'Code example copied.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(pre);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = 'Selected';
      status.textContent = 'Code selected. Use your keyboard to copy it.';
    }
    setTimeout(() => { button.textContent = 'Copy'; }, 1800);
  });
});
