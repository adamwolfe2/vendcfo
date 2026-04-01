/**
 * VendCFO Calculator Widget — embed on any site via:
 * <script src="https://vendcfo.vercel.app/embed/calculator-widget.js"></script>
 * Options: data-position="bottom-right|bottom-left" data-color="#0f172a" data-label="Calculators"
 */
(function(){
"use strict";
if(typeof window==="undefined")return;
if(window.__vendcfo_calc_loaded)return;
window.__vendcfo_calc_loaded=true;

var s=document.currentScript||document.querySelector('script[src*="calculator-widget"]');
var pos=(s&&s.getAttribute("data-position"))||"bottom-right";
var col=(s&&s.getAttribute("data-color"))||"#0f172a";
var lbl=(s&&s.getAttribute("data-label"))||"";
var base=(s&&s.getAttribute("data-base-url"))||(s&&s.src?s.src.replace(/\/embed\/calculator-widget\.js.*$/,""):"")||"https://vendcfo-lime.vercel.app";

var URL=base+"/en/embed/calculators",W=400,H=600,SZ=56,G=24,open=false;
var R=pos==="bottom-right",side=R?"right":"left";

var css="#vendcfo-calc-btn{position:fixed;"+side+":"+G+"px;bottom:"+G+"px;z-index:2147483646;width:"+SZ+"px;height:"+SZ+"px;border-radius:50%;border:none;cursor:pointer;background:"+col+";color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}"
+"#vendcfo-calc-btn:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(0,0,0,.3)}"
+"#vendcfo-calc-btn svg{width:24px;height:24px}"
+"#vendcfo-calc-btn .vendcfo-label{font-size:12px;font-weight:600;margin-left:6px}"
+"#vendcfo-calc-frame{position:fixed;"+side+":"+G+"px;bottom:"+(G+SZ+12)+"px;z-index:2147483647;width:"+W+"px;height:"+H+"px;max-width:calc(100vw - "+(G*2)+"px);max-height:calc(100vh - "+(G*2+SZ+16)+"px);border:none;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.2);background:#fff;opacity:0;transform:translateY(12px) scale(.96);transition:opacity .2s,transform .2s;pointer-events:none}"
+"#vendcfo-calc-frame.vendcfo-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}"
+"@media(max-width:480px){#vendcfo-calc-frame{width:calc(100vw - "+(G*2)+"px);height:calc(100vh - "+(G*2+SZ+16)+"px)}}";

var CALC='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>';
var CLOSE='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

function btnContent(){return CALC+(lbl?'<span class="vendcfo-label">'+lbl+"</span>":"");}

function init(){
var st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

var btn=document.createElement("button");
btn.id="vendcfo-calc-btn";
btn.setAttribute("aria-label","Open VendCFO Calculators");
btn.innerHTML=btnContent();
if(lbl){btn.style.width="auto";btn.style.borderRadius="28px";btn.style.padding="0 18px";}

var fr=document.createElement("iframe");
fr.id="vendcfo-calc-frame";
fr.setAttribute("title","VendCFO Calculators");
fr.setAttribute("allow","clipboard-write");
fr.setAttribute("loading","lazy");
var loaded=false;

function toggle(){
open=!open;
if(open&&!loaded){fr.src=URL;loaded=true;}
if(open){
fr.classList.add("vendcfo-open");btn.innerHTML=CLOSE;
btn.setAttribute("aria-label","Close VendCFO Calculators");
if(lbl){btn.style.width=SZ+"px";btn.style.borderRadius="50%";btn.style.padding="0";}
}else{
fr.classList.remove("vendcfo-open");btn.innerHTML=btnContent();
btn.setAttribute("aria-label","Open VendCFO Calculators");
if(lbl){btn.style.width="auto";btn.style.borderRadius="28px";btn.style.padding="0 18px";}
}}

btn.addEventListener("click",toggle);
document.body.appendChild(fr);
document.body.appendChild(btn);
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&open)toggle();});
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
else init();
})();
