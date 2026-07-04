const REPO_URL = 'https://github.com/Dovshmi/Markulator';

function buildFooterContent(footer) {
  footer.dataset.githubFooterReady = 'true';
  footer.textContent = '';

  const link = document.createElement('a');
  link.className = 'footer-github-link';
  link.href = REPO_URL;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', 'Open Markulator GitHub repository');
  link.textContent = 'GitHub';

  const divider = document.createElement('span');
  divider.className = 'footer-divider';
  divider.setAttribute('aria-hidden', 'true');
  divider.textContent = '•';

  const credit = document.createElement('span');
  credit.className = 'footer-credit-text';
  credit.textContent = 'Made by Rony & Mark Shmidov';

  footer.append(link, divider, credit);
}

function enhanceFooter() {
  const footer = document.querySelector('.app-footer');
  if (!footer) return false;

  const hasGithubLink = footer.querySelector('.footer-github-link');
  const hasMadeBy = footer.textContent.includes('Made by');
  if (footer.dataset.githubFooterReady === 'true' && hasGithubLink && hasMadeBy) return true;

  buildFooterContent(footer);
  return true;
}

function startFooterEnhancer() {
  if (enhanceFooter()) return;

  const observer = new MutationObserver(() => {
    if (enhanceFooter()) observer.disconnect();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  window.setTimeout(() => {
    enhanceFooter();
    observer.disconnect();
  }, 3000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startFooterEnhancer, { once: true });
} else {
  startFooterEnhancer();
}
