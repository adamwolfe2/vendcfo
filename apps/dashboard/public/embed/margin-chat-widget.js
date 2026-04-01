/**
 * Vendingpreneurs Margin Calculator — chatbot embed
 *
 * Usage (on any site):
 *   <script src="https://vendcfo-lime.vercel.app/embed/margin-chat-widget.js"></script>
 *
 * Options (data attributes on the script tag):
 *   data-position  = "bottom-right" | "bottom-left"   (default: bottom-right)
 *   data-color     = "#B85C43"                         (hex brand color)
 *   data-label     = "Margin Calculator"               (button label text)
 *   data-base-url  = "https://vendcfo-lime.vercel.app" (override base URL)
 */
(function () {
  "use strict";
  if (typeof window === "undefined") return;
  if (window.__vp_margin_loaded) return;
  window.__vp_margin_loaded = true;

  var s =
    document.currentScript ||
    document.querySelector('script[src*="margin-chat-widget"]');

  var pos = (s && s.getAttribute("data-position")) || "bottom-right";
  var col = (s && s.getAttribute("data-color")) || "#B85C43";
  var lbl = (s && s.getAttribute("data-label")) || "Margin Calculator";
  var base =
    (s && s.getAttribute("data-base-url")) ||
    (s && s.src
      ? s.src.replace(/\/embed\/margin-chat-widget\.js.*$/, "")
      : "") ||
    "https://vendcfo-lime.vercel.app";

  var PAGE = base + "/en/embed/margin-chat";
  var W = 380,
    H = 580,
    BTN = 56,
    GAP = 20;
  var isRight = pos !== "bottom-left";
  var side = isRight ? "right" : "left";
  var isOpen = false;
  var iframeLoaded = false;

  // ── Styles ────────────────────────────────────────────────────
  var css =
    "#vp-mc-btn{" +
    "position:fixed;" +
    side +
    ":" +
    GAP +
    "px;" +
    "bottom:" +
    GAP +
    "px;" +
    "z-index:2147483646;" +
    "display:flex;align-items:center;gap:8px;" +
    "height:" +
    BTN +
    "px;" +
    "border-radius:" +
    BTN / 2 +
    "px;" +
    "padding:0 20px;" +
    "border:none;cursor:pointer;" +
    "background:" +
    col +
    ";color:#fff;" +
    "box-shadow:0 4px 16px rgba(0,0,0,.22);" +
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" +
    "font-size:13px;font-weight:600;letter-spacing:.01em;" +
    "transition:transform .18s,box-shadow .18s,background .18s;" +
    "white-space:nowrap;" +
    "}" +
    "#vp-mc-btn:hover{transform:translateY(-2px);box-shadow:0 6px 22px rgba(0,0,0,.28);}" +
    "#vp-mc-btn:active{transform:translateY(0);}" +
    "#vp-mc-frame{" +
    "position:fixed;" +
    side +
    ":" +
    GAP +
    "px;" +
    "bottom:" +
    (GAP + BTN + 10) +
    "px;" +
    "z-index:2147483647;" +
    "width:" +
    W +
    "px;height:" +
    H +
    "px;" +
    "max-width:calc(100vw - " +
    GAP * 2 +
    "px);" +
    "max-height:calc(100vh - " +
    (GAP * 2 + BTN + 16) +
    "px);" +
    "border:none;border-radius:16px;" +
    "box-shadow:0 12px 40px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.08);" +
    "background:#F8F4F2;" +
    "opacity:0;transform:translateY(14px) scale(.95);" +
    "transition:opacity .22s,transform .22s;" +
    "pointer-events:none;" +
    "}" +
    "#vp-mc-frame.vp-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}" +
    "@media(max-width:440px){" +
    "#vp-mc-frame{width:calc(100vw - " +
    GAP * 2 +
    "px);height:calc(100vh - " +
    (GAP * 2 + BTN + 16) +
    "px);" +
    "border-bottom-left-radius:0;border-bottom-right-radius:0;" +
    "bottom:0;" +
    side +
    ":0;max-width:100vw;}" +
    "#vp-mc-btn{" +
    side +
    ":" +
    GAP +
    "px;}" +
    "}";

  // ── SVG icons ─────────────────────────────────────────────────
  var CHAT_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>';
  var CLOSE_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  function btnHTML(open) {
    return (
      (open ? CLOSE_ICON : CHAT_ICON) +
      '<span style="margin-left:2px">' +
      (open ? "Close" : lbl) +
      "</span>"
    );
  }

  function init() {
    // Inject styles
    var st = document.createElement("style");
    st.textContent = css;
    document.head.appendChild(st);

    // Create iframe
    var fr = document.createElement("iframe");
    fr.id = "vp-mc-frame";
    fr.setAttribute("title", "Vendingpreneurs Margin Calculator");
    fr.setAttribute("allow", "clipboard-write");
    fr.setAttribute("loading", "lazy");

    // Create button
    var btn = document.createElement("button");
    btn.id = "vp-mc-btn";
    btn.setAttribute("aria-label", "Open Margin Calculator");
    btn.innerHTML = btnHTML(false);

    function toggle() {
      isOpen = !isOpen;
      if (isOpen && !iframeLoaded) {
        fr.src = PAGE;
        iframeLoaded = true;
      }
      if (isOpen) {
        fr.classList.add("vp-open");
        btn.innerHTML = btnHTML(true);
        btn.setAttribute("aria-label", "Close Margin Calculator");
      } else {
        fr.classList.remove("vp-open");
        btn.innerHTML = btnHTML(false);
        btn.setAttribute("aria-label", "Open Margin Calculator");
      }
    }

    btn.addEventListener("click", toggle);
    document.body.appendChild(fr);
    document.body.appendChild(btn);

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) toggle();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
