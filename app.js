/* ============================================================
   TEMPLATE CONFIG — PUBLISH KORTE SHUDHU EI DUITA JINIS BADLAN:
   1) API_BASE -> apnar API URL (official DevZeron host ba nijer
                  deploy). Shesh e slash ( / ) thakbe na.
   2) API_KEY  -> apnar key ( key_xxxx ). Khali rakhe dile end-user
                  config panel diye set korte parbe (localStorage).
   ============================================================ */
var TEMPLATE_CONFIG = {
  API_BASE: "https://dev-zeron-temp-gmail-api-v1.vercel.app",
  API_KEY: ""
};

var GROUPS = ["auth","generate","read","manage","system"];
var ENDPOINTS = {
  auth: [
    {id:"register", m:"POST", path:"/api/register", needKey:false,
     params:[{n:"email",t:"email",ph:"you@gmail.com",ex:"you@gmail.com"},{n:"pass",t:"password",ph:"abcd wxyz 1234 4567",ex:"abcd wxyz 1234 4567"}],
     desc:"Verify gmail + app password once, get permanent key_xxx", resp:"data.key"},
    {id:"key", m:"GET", path:"/api/key", needKey:true, params:[],
     desc:"Check key: gmail, created, last_used", resp:"data.gmail / data.created"},
    {id:"revoke", m:"GET", path:"/api/revoke", needKey:true, params:[],
     desc:"Delete key + all stored data instantly", resp:"data.revoked"}
  ],
  generate: [
    {id:"dot", m:"GET", path:"/api/generate/dot", needKey:true, params:[],
     desc:"Random dot alias — y.ou@gmail.com", resp:"data.email"},
    {id:"plus", m:"GET", path:"/api/generate/plus", needKey:true, params:[],
     desc:"Random plus alias — you+8x9zk2@gmail.com", resp:"data.email"},
    {id:"mixed", m:"GET", path:"/api/generate/mixed", needKey:true, params:[],
     desc:"Dot or plus alias, random pick", resp:"data.email"},
    {id:"custom", m:"GET", path:"/api/generate/custom/<tag>", needKey:true,
     params:[{n:"tag",t:"text",ph:"netflix",ex:"netflix"}],
     desc:"Custom plus alias — you+netflix@gmail.com", resp:"data.email"},
    {id:"batch", m:"GET", path:"/api/generate/batch/<count>", needKey:true,
     query:[{n:"type",t:"select",opts:["mixed","dot","plus"]}],
     params:[{n:"count",t:"number",ph:"1-25",ex:"3"}],
     desc:"Generate up to 25 unique aliases in one request", resp:"data.count / data.emails[]"}
  ],
  read: [
    {id:"read", m:"GET", path:"/api/read/<email>", needKey:true,
     query:[{n:"limit",t:"number",ph:"10",ex:"10"}],
     params:[{n:"email",t:"email",ph:"you+netflix@gmail.com",ex:"you+netflix@gmail.com"}],
     desc:"Latest messages for an alias: from, subject, body, attachments", resp:"data.messages[]"},
    {id:"unread", m:"GET", path:"/api/unread/<email>", needKey:true,
     query:[{n:"limit",t:"number",ph:"10",ex:"10"}],
     params:[{n:"email",t:"email",ph:"you+netflix@gmail.com",ex:"you+netflix@gmail.com"}],
     desc:"Fetch only UNSEEN messages", resp:"data.messages[]"},
    {id:"search", m:"GET", path:"/api/readby/<email>/<text>", needKey:true,
     params:[{n:"email",t:"email",ph:"you+netflix@gmail.com",ex:"you+netflix@gmail.com"},{n:"text",t:"text",ph:"verification",ex:"verification"}],
     desc:"Full-text inbox search like 'code' / 'verification'", resp:"data.messages[]"},
    {id:"count", m:"GET", path:"/api/count/<email>", needKey:true,
     params:[{n:"email",t:"email",ph:"you+netflix@gmail.com",ex:"you+netflix@gmail.com"}],
     desc:"Total + unread counts per alias", resp:"data.total / data.unread"}
  ],
  manage: [
    {id:"delete", m:"GET", path:"/api/delete/<uid>", needKey:true,
     params:[{n:"uid",t:"number",ph:"12345",ex:"12345"}],
     desc:"Move a message to Trash", resp:"data.action = trash"},
    {id:"markread", m:"GET", path:"/api/markread/<uid>", needKey:true,
     params:[{n:"uid",t:"number",ph:"12345",ex:"12345"}],
     desc:"Mark a message as read", resp:"data.read = true"},
    {id:"markunread", m:"GET", path:"/api/markunread/<uid>", needKey:true,
     params:[{n:"uid",t:"number",ph:"12345",ex:"12345"}],
     desc:"Mark a message as unread", resp:"data.read = false"}
  ],
  system: [
    {id:"health", m:"GET", path:"/api/health", needKey:false, params:[],
     desc:"Public — server + firebase status / uptime", resp:"data.status / data.uptime_seconds"},
    {id:"info", m:"GET", path:"/api/info", needKey:false, params:[],
     desc:"Public — endpoint list + version", resp:"data.endpoints"}
  ]
};

var C="", filterKey="auth", lastOut="";

function $(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function toast(m){ var t=$("toast"); t.textContent="! "+m; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(function(){t.classList.remove("show");},2600); }
function masked(k){ return !k?"none":(k.length>16?k.slice(0,6)+"…"+k.slice(-4):k); }
function copyTxt(txt){
  function fb(){ var ta=document.createElement("textarea"); ta.value=txt; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); toast("COPIED"); }
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(function(){toast("COPIED");},fb); }
  else fb();
}

/* ---- config state ---- */
var store=(function(){ try{ return JSON.parse(localStorage.getItem("zzer-config")||"null")||{}; }catch(e){ return {}; } })();
function stateNow(){ return { base:(store.base||TEMPLATE_CONFIG.API_BASE).replace(/\/+$/,""), key:(store.key||TEMPLATE_CONFIG.API_KEY||"") }; }
var S=stateNow();
function persist(){ try{ localStorage.setItem("zzer-config",JSON.stringify(store)); }catch(e){} }
function refreshKeyUI(){
  $("pgKey").textContent = S.key?masked(S.key):"none";
  $("pgBase").textContent = S.base;
  var d=$("cfgDot"); d.className="dot"+(S.key?" ok":"");
  $("cfgKeyLabel").textContent = S.key?("key: "+masked(S.key)):"No key set";
  if($("cfgBase")) $("cfgBase").value=S.base;
  if($("cfgKey")) $("cfgKey").value=S.key||"";
}

/* ---- syntax highlight (operates on fully-escaped text; JSON quotes are &quot;) ---- */
function highlightJson(raw){
  var line=esc(raw);
  line=line.replace(/(&quot;)((?:(?!&quot;).)*?)(&quot;)(\s*:)?|\b(true|false)\b|\b(null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    function(mq,q1,inner,q2,col,bool,nul,num){
      if(q1){ return col?'<span class="hk">'+inner+':</span>':'<span class="hs">'+q1+inner+q2+'</span>'; }
      if(bool) return '<span class="hb">'+bool+'</span>';
      if(nul) return '<span class="hn" style="color:#c084fc">'+nul+'</span>';
      if(num) return '<span class="hn">'+num+'</span>';
      return mq;
    });
  return line;
}
function sampleOf(n){ return {email:"you+netflix@gmail.com",tag:"netflix",text:"verification",uid:"12345",limit:"5",count:"3"}[n]||""; }
function sampleFor(n){ return {email:"you+netflix@gmail.com",tag:"netflix",text:"verification",uid:"12345",limit:"5",count:"3"}[n]||""; }
function findEp(id){ for(var g in ENDPOINTS){ for(var i=0;i<ENDPOINTS[g].length;i++) if(ENDPOINTS[g][i].id===id) return ENDPOINTS[g][i]; } return null; }

/* ---- endpoint matrix ---- */
function renderMatrix(){
  var html="";
  GROUPS.forEach(function(g){
    html+='<div class="ep-group"><div class="ep-head"><b>'+esc(g.toUpperCase())+'</b><span>'+ENDPOINTS[g].length+'</span></div>';
    ENDPOINTS[g].forEach(function(ep){
      html+='<div class="ep-card" data-ep="'+esc(ep.id)+'" role="button" tabindex="0"><span class="mmethod">'+esc(ep.m)+'</span><span class="ep-path">'+esc(ep.path)+'</span><span class="go">→</span></div>';
    });
    html+='</div>';
  });
  $("epGrid").innerHTML=html;
  $("epGrid").querySelectorAll(".ep-card").forEach(function(el){
    function go(){ selectEndpoint(el.getAttribute("data-ep")); document.getElementById("playground").scrollIntoView({behavior:"smooth"}); }
    el.addEventListener("click",go);
    el.addEventListener("keydown",function(e){ if(e.key==="Enter"||e.key===" "){e.preventDefault();go();} });
  });
}

/* ---- playground ---- */
function selectEndpoint(id){ C=id; syncLinks(); renderParams(); updateReq(); }
function syncLinks(){
  var els=$("epList").querySelectorAll(".pg-link");
  for(var i=0;i<els.length;i++){ els[i].classList.toggle("on",els[i].getAttribute("data-ep")===C); }
}
function renderPlaygroundSelects(){
  var filterEl=$("epFilter"); if(filterEl) filterEl.innerHTML="";
  GROUPS.forEach(function(g){
    var b=document.createElement("button"); b.className="fchip"+(filterKey===g||filterKey==="all"?" on":""); b.textContent=g.toUpperCase();
    b.addEventListener("click",function(){ filterKey=g; renderPlaygroundSelects(); syncLinks(); });
    if(filterEl) filterEl.appendChild(b);
  });
  var list=$("epList"); list.innerHTML="";
  GROUPS.forEach(function(g){
    if(filterKey!=="all"&&filterKey!==g) return;
    ENDPOINTS[g].forEach(function(ep){
      var b=document.createElement("button"); b.className="pg-link"+(C===ep.id?" on":""); b.setAttribute("data-ep",ep.id); b.textContent=ep.m+" "+ep.path;
      b.addEventListener("click",function(){ selectEndpoint(ep.id); }); list.appendChild(b);
    });
  });
}
function fieldBox(p){
  var wrap=document.createElement("div");
  wrap.style.border="2px solid #3a3a3a"; wrap.style.padding="12px"; wrap.style.marginBottom="12px"; wrap.style.background="#121212";
  var lbl=document.createElement("label"); lbl.textContent=p.n;
  lbl.style.cssText="display:block;font-family:var(--font-mono);font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:var(--yellow);margin-bottom:6px";
  wrap.appendChild(lbl);
  var inp;
  if(p.t==="select"){
    inp=document.createElement("select");
    (p.opts||[]).forEach(function(o){ var oo=document.createElement("option"); oo.value=o; oo.textContent=o; inp.appendChild(oo); });
  } else {
    inp=document.createElement("input");
    inp.type=(p.t==="password"||p.t==="number")?p.t:"text";
    inp.placeholder=p.ph||"";
    inp.value=sampleFor(p.n);
  }
  inp.className="pg-input";
  inp.style.cssText="width:100%;background:#0c0c0c;border:2px solid #3a3a3a;color:#eee;font-family:var(--font-mono);font-size:.85rem;padding:9px 11px";
  inp.addEventListener("input",updateReq);
  inp.addEventListener("blur",function(){ inp.value=inp.value||sampleFor(p.n); updateReq(); });
  wrap.appendChild(inp);
  return wrap;
}
function renderParams(){
  var ep=findEp(C), box=$("paramBox"); box.innerHTML="";
  if(!ep) return;
  if(ep.needKey&&!S.key){
    box.innerHTML='<div style="border:2px solid #ff2a00;padding:12px;font-family:var(--font-mono);font-size:.75rem;color:#ff9a88">NO KEY YET → <a href="#getkey" style="color:#fff;text-decoration:underline">GET YOUR KEY</a> / CONFIG panel.</div>';
  }
  (ep.query||[]).forEach(function(p){ box.appendChild(fieldBox(p)); });
  (ep.params||[]).forEach(function(p){ box.appendChild(fieldBox(p)); });
  if((ep.query&&ep.query.length)||(ep.params&&ep.params.length)){
    var h=document.createElement("div");
    h.textContent="→ "+ep.desc;
    h.style.cssText="margin-top:12px;border-top:2px solid #2c2c2c;padding-top:10px;font-family:var(--font-mono);font-size:.68rem;color:#6d7272";
    box.appendChild(h);
  }
}
function pgVal(n){ var el=$("p-"+n); return el?el.value.trim():""; }
function buildUrl(){
  var ep=findEp(C), url=S.base+ep.path, qs=[];
  (ep.params||[]).forEach(function(p){ url=url.replace("<"+p.n+">",encodeURIComponent(pgVal(p.n)||p.ex||"")); });
  (ep.query||[]).forEach(function(p){ var v=pgVal(p.n); if(v) qs.push(p.n+"="+encodeURIComponent(v)); });
  if(qs.length) url+="?"+qs.join("&");
  return url;
}
function updateReq(){
  var ep=findEp(C); if(!ep) return;
  var url=S.base+ep.path, qs=[];
  (ep.params||[]).forEach(function(p){ url=url.replace("<"+p.n+">",encodeURIComponent(pgVal(p.n)||p.ex||"")); });
  (ep.query||[]).forEach(function(p){ var v=pgVal(p.n); if(v) qs.push(p.n+"="+encodeURIComponent(v)); });
  var label=esc(url.replace(/\?.*$/,""))+(qs.length?esc("?"+qs.join("&")):"");
  var hh=(ep.needKey&&S.key)?'<br><b style="color:#4ff07a">Authorization: Bearer </b>'+masked(S.key):'<br><span style="color:#6a7070">no key required</span>';
  $("reqUrl").innerHTML='<b style="color:var(--yellow)">'+esc(ep.m)+'</b> '+label+hh;
}
function setLoading(on){
  var b=$("btnRun"); b.disabled=on;
  b.textContent=on?"WAIT…":"RUN →";
  if(on){ b.style.background="#9aa0a0"; } else { b.style.background="var(--green,#46f06a)"; }
}
var lastOut="",lastHtml="";
async function run(){
  var ep=findEp(C); if(!ep) return;
  if(ep.needKey&&!S.key){ outPlain("// ERROR \u2014 set your API key in CONFIG (CONFIG button upor) age"); toast("Set your API key first"); return; }
  var t0=Date.now(); setLoading(true);
  var url=buildUrl(), opts={method:ep.m,headers:{}};
  if(ep.needKey) opts.headers["Authorization"]="Bearer "+S.key;
  if(ep.m==="POST"){ opts.headers["Content-Type"]="application/json"; opts.body=JSON.stringify({email:pgVal("email"),pass:pgVal("pass")}); }
  var meta=$("outMeta"); meta.textContent="FETCHING…";
  try{
    var res=await fetch(url,opts);
    var text=await res.text(), ms=Date.now()-t0;
    var pretty; try{ pretty=JSON.stringify(JSON.parse(text),null,2); }catch(e){ pretty=text; }
    meta.innerHTML=res.status+' <span class="sp '+(res.ok?"ok":"err")+'">'+(res.ok?"OK":"ERR")+'</span> · '+ms+"ms";
    outJson(pretty);
  }catch(err){
    meta.textContent="FAIL · "+(Date.now()-t0)+"ms";
    outPlain("// "+err.message);
  }finally{ setLoading(false); }
}
function outJson(txt){ lastOut=txt; $("outBody").innerHTML=highlightJson(txt); }
function outPlain(txt){ lastOut=txt; $("outBody").innerHTML=esc(txt); }

/* ---- FAQ ---- */
var FAQS = [
  ["Why an API key instead of email + password every time?","Sending your Gmail + App Password on every request is a security risk and a pain. Once we verify it, you get a key and only ever send the key. Simpler for you, safer for everyone."],
  ["Is my App Password stored?","Yes — because that\u2019s how the key works: the server opens IMAP for you. But it\u2019s AES-encrypted before it\u2019s written to Firebase, and only your key can decrypt it server-side. Revoking your key deletes it."],
  ["What if I don\u2019t have 2-Step Verification?","Google only issues App Passwords when 2-Step Verification is ON. Turn it on first, then create an App Password at myaccount.google.com/apppasswords."],
  ["Do the aliases really work?","Yes. Gmail treats you+anything@gmail.com and dotted y.ou@gmail.com as the same mailbox. Anything sent to an alias shows up when you read your base address."],
  ["How do I revoke my key?","Call GET /api/revoke with the key in the Authorization header. The key and your stored data are removed instantly."],
  ["Is this really free?","Yes — Vercel free tier + Firebase free tier. No credit card, no hidden quota."],
  ["How do I publish this template with MY key?","Open the CONFIG button (top-right single) and paste your key, or edit the TEMPLATE_CONFIG object at the top of app.js. Then drop the folder on any static host (Vercel / Netlify / GitHub Pages) — done."]
];
function renderFaq(){
  var box=$("faqList"); box.innerHTML="";
  FAQS.forEach(function(f,i){
    var item=document.createElement("div"); item.className="faq-item";
    item.style.cssText="border-top:var(--bw) solid var(--ink)";
    var q=document.createElement("button"); q.className="faq-q"; q.setAttribute("aria-expanded","false");
    q.style.cssText="width:100%;text-align:left;background:var(--bg);border:0;font:inherit;font-weight:700;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;gap:10px;cursor:pointer";
    var txt=document.createElement("span"); txt.textContent=f[0];
    var arr=document.createElement("span"); arr.textContent="+"; arr.className="q-arrow"; arr.style.cssText="font-family:var(--font-mono);border:2px solid var(--ink);width:30px;height:30px;display:grid;place-items:center;flex:none;transition:transform .12s linear";
    q.appendChild(txt); q.appendChild(arr);
    var a=document.createElement("div"); a.className="faq-a"; a.style.cssText="max-height:0;overflow:hidden;transition:max-height .2s linear";
    var inner=document.createElement("div"); inner.className="faq-a-inner"; inner.style.cssText="padding:0 20px 18px;font-size:.95rem;color:#2e2a23;max-width:840px"; inner.textContent=f[1];
    a.appendChild(inner);
    item.appendChild(q); item.appendChild(a); box.appendChild(item);
    q.addEventListener("click",function(){ var open=item.classList.toggle("open"); q.setAttribute("aria-expanded",open? "true":"false"); arr.textContent=open?"−":"+"; a.style.maxHeight=open?a.scrollHeight+"px":"0"; });
  });
}

/* ---- sample response ---- */
function renderSample(){
  var sample={
    "status": true,
    "message": "Messages appear",
    "Api_By": "@DevZeron",
    "Tg_Channel": "t.me/CodeDevZeron",
    "data": {"email":"you+netflix@gmail.com","count":1,"messages":[{"uid":"12345","from":"Netflix <info@netflix.com>","subject":"code 482913","body":"Use 482913 to verify.","attachments":[]}]}
  };
  $("sampleJson").innerHTML=highlightJson(JSON.stringify(sample,null,2));
}

/* ---- health check ---- */
function healthCheck(){
  var dot=$("statusDot"), txt=$("statusTxt");
  fetch(S.base+"/api/health",{method:"GET"}).then(function(res){ return res.json().catch(function(){return null;}); }).then(function(j){
    var ok=!!(j&&j.status);
    dot.className="status-dot"+(ok?" on":"");
    var fb=j&&j.data&&j.data.firebase?(j.data.firebase):"unknown";
    txt.textContent=ok?("SERVER ONLINE · "+fb):"SERVER RESPONDED BUT OFFLINE";
    txt.title=(j&&j.message)||"";
  }).catch(function(e){ dot.className="status-dot"; txt.textContent="CAN\u2019T REACH API — check base URL"; });
}

/* ---- register ---- */
function register(){
  var btn=$("regBtn"), msg=$("regMsg");
  btn.disabled=true; btn.textContent="VERIFYING…";
  msg.hidden=false; msg.className="register-msg"; msg.textContent="Connecting imap.gmail.com & verifying…";
  fetch(S.base+"/api/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$("regEmail").value.trim(),pass:$("regPass").value.replace(/ /g,"")})})
  .then(function(res){ return res.text().then(function(t){return {res:res,txt:t};}); })
  .then(function(r){
    var ok=false;
    try{ var j=JSON.parse(r.txt); ok=!!j.status; }catch(e){ j={message:r.txt}; }
    if(ok&&j.data&&j.data.key){
      store.key=j.data.key; persist(); S=stateNow(); refreshKeyUI();
      msg.className="register-msg ok"; msg.innerHTML='<b>KEY ISSUED ✓</b><br>'+esc(j.data.key)+'<br>Auto-saved to this website. Use it in the playground!';
      toast("Key saved");
    } else {
      msg.className="register-msg err"; msg.textContent="✗ "+(j&&j.message?j.message:r.txt);
    }
  })
  .catch(function(e){ msg.className="register-msg err"; msg.textContent="✗ Network error: "+e.message; })
  .finally(function(){ btn.disabled=false; btn.textContent="GET MY KEY"; });
}

/* ---- config drawer ---- */
function openCfg(){ $("config").classList.add("open"); $("cfgBackdrop").classList.add("show"); refreshKeyUI(); }
function closeCfg(){ $("config").classList.remove("open"); $("cfgBackdrop").classList.remove("show"); }
function saveCfg(){
  store.base=$("cfgBase").value.trim().replace(/\/+$/,"")||TEMPLATE_CONFIG.API_BASE.replace(/\/+$/,"");
  store.key=$("cfgKey").value.trim();
  persist(); S=stateNow();
  refreshKeyUI(); renderParams(); updateReq();
  healthCheck(); toast("CONFIG SAVED");
  closeCfg();
}

/* ---- init ---- */
function init(){
  renderMatrix(); renderPlaygroundSelects(); renderFaq(); renderSample();
  refreshKeyUI();
  selectEndpoint("mixed");
  healthCheck();
  $("btnRun").addEventListener("click",run);
  $("btnFill").addEventListener("click",function(){ renderParams(); updateReq(); });
  $("btnCopy").addEventListener("click",function(){ if(lastOut) copyTxt(lastOut); });
  $("btnConfig").addEventListener("click",openCfg);
  $("btnCloseCfg").addEventListener("click",closeCfg);
  $("cfgBackdrop").addEventListener("click",closeCfg);
  $("cfgSave").addEventListener("click",saveCfg);
  $("btnForgetKey").addEventListener("click",function(){ delete store.key; persist(); S=stateNow(); refreshKeyUI(); toast("Key removed"); });
  $("regForm").addEventListener("submit",function(e){ e.preventDefault(); register(); });
  $("scrollTop").addEventListener("click",function(){ window.scrollTo({top:0,behavior:"smooth"}); });
}
document.addEventListener("DOMContentLoaded",init);
