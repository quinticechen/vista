// Shared helper for hosted visuals (see docs/PUBLISHING_VISUALS.md).
// When the page is opened inside a Vista post iframe it:
//   1. hides every element marked with data-embed-hide (page nav, duplicate titles)
//   2. reports its content height to the parent so the iframe grows to fit
// Opened directly, it does nothing.
(function () {
  if (window.self === window.top) return;

  var root = document.documentElement;
  root.classList.add("is-embedded");

  var style = document.createElement("style");
  style.textContent =
    ".is-embedded [data-embed-hide]{display:none !important}" +
    "html.is-embedded,html.is-embedded body{overflow:hidden !important}";
  document.head.appendChild(style);

  var lastHeight = 0;
  function sendHeight() {
    var height = Math.ceil(document.body.scrollHeight);
    if (height === lastHeight) return;
    lastHeight = height;
    window.parent.postMessage({ type: "vista-visual:height", height: height }, window.location.origin);
  }

  if ("ResizeObserver" in window) new ResizeObserver(sendHeight).observe(document.body);
  window.addEventListener("load", sendHeight);
  sendHeight();
})();
