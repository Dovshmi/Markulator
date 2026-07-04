const REPO_URL = 'https://github.com/Dovshmi/Markulator';

function enhanceFooter() {
  const footer = document.querySelector('.app-footer');
  if (!footer || footer.dataset.githubFooterReady === 'true') return;

  footer.dataset.githubFooterReady = 'true';
  footer.textContent = '';

  const credit = document.createElement('span');
  credit.className = 'footer-credit-text';
  credit.textContent = 'Rony & Mark Shmidov';

  const divider = document.createElement('span');
  divider.className = 'footer-divider';
  divider.setAttribute('aria-hidden', 'true');
  divider.textContent = '•';

  const link = document.createElement('a');
  link.className = 'footer-github-link';
  link.href = REPO_URL;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', 'Open Markulator GitHub repository');
  link.textContent = 'GitHub';

  footer.append(credit, divider, link);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', enhanceFooter, { once: true });
} else {
  enhanceFooter();
}
