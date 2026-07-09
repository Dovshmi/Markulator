const WEB_RELEASE_VERSION = 'Web v1.1';
const VERSION_PATTERN = /Web v\d+(?:\.\d+)*/g;

function updateTextNode(node) {
  if (!node?.nodeValue || !VERSION_PATTERN.test(node.nodeValue)) return;
  node.nodeValue = node.nodeValue.replace(VERSION_PATTERN, WEB_RELEASE_VERSION);
}

function updateElement(element) {
  if (!element) return;
  element.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) updateTextNode(node);
  });

  if (element.getAttribute?.('aria-label')) {
    element.setAttribute('aria-label', element.getAttribute('aria-label').replace(VERSION_PATTERN, WEB_RELEASE_VERSION));
  }

  if (element.getAttribute?.('title')) {
    element.setAttribute('title', element.getAttribute('title').replace(VERSION_PATTERN, WEB_RELEASE_VERSION));
  }
}

function applyVersionLabel() {
  document.querySelectorAll('.eyebrow, .app-footer, .drawer-status span, [aria-label], [title]').forEach(updateElement);
  if (document.title) document.title = document.title.replace(VERSION_PATTERN, WEB_RELEASE_VERSION);
}

function observeVersionLabel() {
  applyVersionLabel();

  const observer = new MutationObserver(() => applyVersionLabel());
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'title'],
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeVersionLabel, { once: true });
} else {
  observeVersionLabel();
}
