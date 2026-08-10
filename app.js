/* ==================================================================
   ZERON TEMP MAIL — app.js
   Full temp-mail client. Server-side proxy (api/index.js | server.js |
   netlify/functions | functions/ | api.php) e env/config key thakle
   user ke kichu dite hoy na. Proxy chain: /api → /api.php → direct.
   ================================================================== */

var TEMPLATE_CONFIG = {
  API_BASE: "https://dev-zeron-temp-gmail-api-v1.vercel.app",
  API_KEY: "", // standalone use er jonno (deploy e irrelevant — proxy env var niye newe)
  // Same-origin proxy candidates, tried in order until one responds.
  // Vercel/Netlify/Cloudflare/Node server => /api · cPanel/PHP shared host => /api.php
  PROXY_PATHS: ["/api", "/api.php"]
};

var REFRESH_MS = 15000;

var store = { addr:"", seen:{}, known:{}, base:"", key:"", auto:true, sound:false };
try{
  var _raw = localStorage.getItem("zmail");
  if (_raw) store = Object.assign(store, JSON.parse(_raw));
}catch(e){}

function persist(){ try{ localStorage.setItem("zmail", JSON.stringify(store)); }catch(e){} }

function stateNow(){
  return {
    base: (store.base || TEMPLATE_CONFIG.API_BASE).replace(/\/+$/,""),
    key: store.key || TEMPLATE_CONFIG.API_KEY || ""
  };
}

function arr(key){ store[key][store.addr] = store[key][store.addr] || []; return store[key][store.addr]; }
function seen(){ return arr("seen"); }
function known(){ return arr("known"); }
function has(a,b){ return a.indexOf(b) >= 0; }

/* ---------------- utils ---------------- */
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

// API path e email plain @/+ e thakte hobe (encoded %40 server reject kore).
// So only truly unsafe chars encode, email chars (letters digits . _ @ + -) raw thakbe.
function pathEnc(s){ return String(s).replace(/[^A-Za-z0-9._@+\-]/g, function(c){ return encodeURIComponent(c); }); }

function $(id){ return document.getElementById(id); }

var READER_PH = $("readerPh") ? $("readerPh").outerHTML : "";

var toastTimer=null;
function toast(msg){
  var t=$("toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(function(){ t.classList.remove("show"); },2200);
}

function fmtWhen(s){
  if(!s) return "?";
  var d=new Date(s); if(isNaN(d)) return "?";
  var df=(Date.now()-d.getTime())/1000;
  if(df<60) return Math.max(0,Math.round(df))+"s";
  if(df<3600) return Math.round(df/60)+"m";
  if(df<86400) return Math.round(df/3600)+"h";
  if(df<604800) return Math.round(df/86400)+"d";
  return d.toLocaleDateString("en-GB",{day:"2-digit",month:"short"});
}
function fmtFull(s){
  if(!s) return "—";
  var d=new Date(s); if(isNaN(d)) return esc(s);
  return d.toLocaleString("en-GB",{weekday:"short",day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
}
function fromShort(f){
  if(!f) return "UNKNOWN SENDER";
  var m=String(f).replace(/['"]/g,"").match(/^([^<]+)<(.+)>$/);
  if(m) return m[1].trim() || m[2].trim();
  return String(f).trim();
}
function preview(m){
  var b=(m.body||"").replace(/\s+/g," ").trim();
  if(!b) return "<em style='opacity:.6;font-style:normal'>[NO PLAIN-TEXT PREVIEW — HTML MESSAGE]</em>";
  return b.length>110? b.slice(0,110)+"…" : b;
}

/* ---------------- API (proxy chain → direct fallback) ---------------- */
// Probes every same-origin proxy in order; a proxy that answers with
// real JSON is used. 404/405 OR a non-JSON answer (static host serving
// index.html) both count as "no proxy here" -> next candidate -> direct.
function noproxy(msg){ var e=new Error(msg||"noproxy"); e.code="NOPROXY"; return e; }

function attemptProxy(endpoint, path, query, bodyData){
  return fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: path, query: query||{}, data: (bodyData&&bodyData.data)||null, method: (bodyData&&bodyData.method)||"GET" })
  }).then(function(res){
    return res.text().then(function(t){
      var j = null; try{ j = JSON.parse(t); }catch(e){}
      if(!j || res.status===404 || res.status===405 || res.status===501) throw noproxy();
      if(!res.ok) throw new Error("API " + res.status + ((j&&j.message)?": "+j.message:""));
      if(j.status===false) throw new Error(j.message||("API error "+res.status));
      return j ? j.data : null;
    });
  }).catch(function(err){
    if(err && err.code==="NOPROXY") throw noproxy();
    throw err;
  });
}

function tryProxyChain(i, paths, path, query, bodyData){
  if(i >= paths.length) return Promise.reject(noproxy());
  return attemptProxy(paths[i], path, query, bodyData).catch(function(err){
    if(err && err.code==="NOPROXY") return tryProxyChain(i+1, paths, path, query, bodyData);
    throw err;
  });
}

function zapi(path, query, opts){
  var cfg = stateNow();
  var paths = TEMPLATE_CONFIG.PROXY_PATHS || ["/api"];
  return tryProxyChain(0, paths, path, query, opts||{}).catch(function(err){
    if(err && err.code==="NOPROXY") return directApi(path, query, cfg, opts||{});
    throw err;
  });
}

function directApi(path, query, cfg, opts){
  if(!cfg.key) throw new Error("No API key. Deploy korle proxy te env ZERON_API_KEY thake. Ar local/static file e CONFIG → STANDALONE KEY dite hoy.");
  var qs="";
  if(query){
    var p=new URLSearchParams();
    Object.keys(query).forEach(function(k){ var v=query[k]; if(v!==undefined&&v!==null&&v!=="") p.append(k,v); });
    qs=p.toString()? "?"+p.toString() : "";
  }
  return fetch(cfg.base+"/api/"+path+qs,{headers:{"Authorization":"Bearer "+cfg.key}})
    .then(function(res){ return res.text().then(function(t){
      var j=null; try{ j=JSON.parse(t); }catch(e){}
      if(!res.ok) throw new Error("API " + res.status + ((j&&j.message)?": "+j.message:""));
      if(j && j.status===false) throw new Error(j.message||("API error "+res.status));
      return j ? j.data : null;
    }); });
}

/* ---------------- sound ---------------- */
var AC=null;
function beep(){
  if(!store.sound) return;
  try{
    if(!AC){ AC=new (window.AudioContext||window.webkitAudioContext)(); }
    var o=AC.createOscillator(), g=AC.createGain();
    o.type="square"; o.frequency.value=920;
    g.gain.setValueAtTime(0.001,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.16,AC.currentTime+0.012);
    g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+0.28);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime+0.3);
  }catch(e){}
}

/* ---------------- state ---------------- */
var inbox = [];           // current visible list
var currentMsg = null;    // open msg object
var searchQ = "";
var busyNewGenerating = false;

function setListState(text){ $("listState").textContent = text; }
function setAddr(v, metaTxt){
  $("addrMail").textContent = v || "--";
  $("addrMeta").textContent = metaTxt || "";
}

function updateStats(){
  $("stTotal").textContent = inbox.length;
  $("stUnread").textContent = inbox.filter(function(m){ return !has(seen(), String(m.uid)); }).length;
  if(searchQ){ setListState("SEARCH: \"" + searchQ + "\" (" + inbox.length + ")"); }
}

/* ---------------- render inbox ---------------- */
function renderList(){
  var ul=$("msgList"); ul.innerHTML="";
  var wrap=$("listWrap");
  wrap.classList.remove("state-loading");
  wrap.classList.toggle("state-empty", inbox.length===0);

  inbox.forEach(function(m){
    var uid=String(m.uid);
    var unread = !has(seen(), uid);
    var isNew  = !has(known(), uid);
    var li=document.createElement("li");
    li.className="msg" + (unread?" unread":"");
    li.dataset.uid=uid;
    li.innerHTML =
      '<span class="msg-dot" aria-hidden="true"></span>' +
      '<div class="msg-main">' +
        '<div class="msg-from">' + esc(fromShort(m.from)) + '</div>' +
        '<div class="msg-subj">' + esc(m.subject||"(no subject)") + '</div>' +
        '<div class="msg-prev">' + preview(m) + '</div>' +
      '</div>' +
      '<div class="msg-side">' +
        '<span class="msg-time">' + fmtWhen(m.date) + '</span>' +
        (isNew? '<span class="msg-new">NEW</span>':'') +
        '<button class="msg-del" type="button" title="Delete" aria-label="Delete message">✕</button>' +
      '</div>';
    ul.appendChild(li);
  });
  updateStats();
}

function showLoading(){
  var wrap=$("listWrap");
  wrap.classList.remove("state-empty");
  wrap.classList.add("state-loading");
  setListState("LOADING…");
}

/* ---------------- inbox fetch ---------------- */
function refreshInbox(silent, opts){
  if(!store.addr){ return Promise.resolve(); }
  opts = opts || {};
  var path = searchQ ? "readby/" + pathEnc(store.addr) + "/" + pathEnc(searchQ)
                     : "read/" + pathEnc(store.addr);
  var query = { limit: "25" };
  if(!silent) showLoading();
  return zapi(path, query)
    .then(function(d){
      var msgs = (d && d.messages) ? d.messages : [];
      var newArrivals = [];
      msgs.forEach(function(m){
        var uid=String(m.uid);
        if(!has(known(), uid)){ known().push(uid); newArrivals.push(m); }
      });
      persist();
      inbox = msgs;
      renderList();
      if(!silent) setListState(searchQ? "SEARCH RESULT ("+msgs.length+")" : "LIVE · REFRESHED");
      return {msgs:msgs, fresh:newArrivals};
    })
    .then(function(r){
      if(r.fresh.length && silent && !opts.noBeep){
        beep();
        toast("NEW MAIL — " + r.fresh.length + " message" + (r.fresh.length>1?"s":""));
      }
    })
    .catch(function(err){
      if(!silent){
        setListState("ERROR");
        $("listWrap").classList.remove("state-loading");
        $("listWrap").classList.toggle("state-empty", inbox.length===0);
        toast(err.message||"API error");
      }
    });
}

/* ---------------- generate ---------------- */
function generateNew(){
  if(busyNewGenerating) return;
  busyNewGenerating=true;
  $("btnNew").disabled=true;
  setAddr("GENERATING…", "FETCHING A FRESH ALIAS…");
  setListState("GENERATING ADDRESS…");
  zapi("generate/mixed",{}).then(function(d){
    var addr = d && d.email;
    if(!addr) throw new Error("No email returned");
    store.addr = addr;
    store.seen[addr] = store.seen[addr] || [];
    store.known[addr] = store.known[addr] || [];
    persist();
    setAddr(addr, "CREATED " + new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}));
    inbox=[];
    renderList();
    return refreshInbox(true, {noBeep:true});
  }).then(function(){
    setListState(store.auto? "LIVE · AUTO-REFRESH "+(REFRESH_MS/1000)+"s" : "REFRESHED");
    toast("NEW ADDRESS READY");
  }).catch(function(err){
    toast(err.message||"Generate failed");
    setAddr("--", "FAILED — CHECK CONFIG / KEY");
    setListState("ERROR");
  }).finally(function(){
    busyNewGenerating=false;
    $("btnNew").disabled=false;
  });
}

/* ---------------- copy ---------------- */
function copyAddress(){
  var txt=$("addrMail").textContent;
  if(!txt || txt==="--") return;
  var done=function(){ toast("ADDRESS COPIED"); flash($("btnCopy"),"copied"); };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(done).catch(function(){ fallbackCopy(txt); done(); });
  } else { fallbackCopy(txt); done(); }
}
function fallbackCopy(t){
  var ta=document.createElement("textarea"); ta.value=t; ta.style.position="fixed"; ta.style.left="-9999px";
  document.body.appendChild(ta); ta.focus(); ta.select();
  try{ document.execCommand("copy"); }catch(e){}
  document.body.removeChild(ta);
}
function flash(el,cls){ el.classList.add(cls); setTimeout(function(){ el.classList.remove(cls); },900); }

/* ---------------- reader ---------------- */
function readerHTML(m){
  var unread = !has(seen(), String(m.uid));
  return '<div class="reader-head">' +
      '<span class="rtitle">MESSAGE</span>' +
      '<div class="reader-actions">' +
        '<button class="ract back-btn" data-act="back" type="button">← INBOX</button>' +
        '<button class="ract" data-act="unread" type="button">UNREAD</button>' +
        '<button class="ract" data-act="del" type="button" title="Delete">✕ DELETE</button>' +
      '</div>' +
    '</div>' +
    '<div class="reader-body">' +
      '<h2 class="reader-subj">' + esc(m.subject||"(NO SUBJECT)") + '</h2>' +
      '<div class="reader-meta">' +
        '<div><b>FROM</b> ' + esc(m.from) + '</div>' +
        (m.to? '<div><b>TO</b> ' + esc(m.to) + '</div>':'') +
        '<div><b>DATE</b> ' + fmtFull(m.date) + '</div>' +
        (m.uid? '<div><b>UID</b> ' + esc(m.uid) + '</div>':'') +
      '</div>' +
      (m.body && String(m.body).trim()
        ? '<div class="reader-bodytext">' + esc(m.body) + '</div>'
        : '<div class="reader-nobody">NO PLAIN-TEXT BODY FOR THIS MESSAGE.<br>HTML-ONLY EMAIL — CHECK IN YOUR MAIL APP.</div>') +
      (m.attachments && m.attachments.length ? '<div class="reader-nobody" style="margin-top:10px">ATTACHMENTS: ' + esc(m.attachments.join(", ")) + '</div>' : '') +
    '</div>';
}

function markLocalRead(m, read){
  var uid=String(m.uid), s=seen();
  var i=s.indexOf(uid);
  if(read && i<0){ s.push(uid); }
  if(!read && i>=0){ s.splice(i,1); }
  persist();
}

function openMsg(m){
  currentMsg = m;
  markLocalRead(m, true);
  // update list highlight + unread badge
  var lis=$("msgList").querySelectorAll(".msg");
  Array.prototype.forEach.call(lis, function(li){
    li.classList.toggle("unread", !has(seen(), li.dataset.uid));
    li.classList.toggle("sel", li.dataset.uid===String(m.uid));
  });
  updateStats();

  var html = readerHTML(m);
  var aside=$("reader"); aside.innerHTML=html;
  wireReader(aside, m);

  if(window.innerWidth < 880){
    var ovl=$("readerOvl"); ovl.innerHTML=html; ovl.hidden=false;
    wireReader(ovl, m);
    document.body.style.overflow="hidden";
  }
}

function wireReader(root, m){
  root.querySelector("[data-act=back]").addEventListener("click", closeReader);
  root.querySelector("[data-act=del]").addEventListener("click", function(){ delMsg(m); });
  root.querySelector("[data-act=unread]").addEventListener("click", function(){ markLocalRead(m,false); toast("MARKED UNREAD"); refreshInbox(true); });
}

function closeReader(){
  currentMsg=null;
  var ovl=$("readerOvl"); ovl.hidden=true; ovl.innerHTML="";
  document.body.style.overflow="";
  var aside=$("reader");
  aside.innerHTML=READER_PH;
  Array.prototype.forEach.call($("msgList").querySelectorAll(".msg.sel"), function(li){ li.classList.remove("sel"); });
}

function delMsg(m){
  if(!currentMsg || currentMsg.uid!==m.uid){ /* still allow */ }
  try{ zapi("delete/"+encodeURIComponent(m.uid),{}).catch(function(){}); }catch(e){}
  inbox = inbox.filter(function(x){ return String(x.uid)!==String(m.uid); });
  var s=seen(), i=s.indexOf(String(m.uid)); if(i>=0) s.splice(i,1);
  var k=known(), j=k.indexOf(String(m.uid)); if(j>=0) k.splice(j,1);
  persist();
  renderList();
  if(currentMsg && currentMsg.uid===m.uid){ toast("MESSAGE DELETED"); closeReader(); } else { toast("MESSAGE DELETED"); }
}

/* ---------------- search ---------------- */
function doSearch(){
  var v=$("searchInput").value.trim();
  if(!v){ clearSearch(); return; }
  searchQ=v;
  $("btnClear").hidden=false;
  refreshInbox(false);
}
function clearSearch(){
  if(!searchQ && $("btnClear").hidden) return;
  searchQ="";
  $("searchInput").value="";
  $("btnClear").hidden=true;
  refreshInbox(false);
}
$("searchInput").addEventListener("keydown", function(e){ if(e.key==="Enter") doSearch(); });
$("btnSearch").addEventListener("click", doSearch);
$("btnClear").addEventListener("click", clearSearch);

/* ---------------- auto refresh ---------------- */
var autoTimer=null;
function armAuto(){
  clearInterval(autoTimer);
  if(store.auto) autoTimer=setInterval(function(){ if(!busyNewGenerating) refreshInbox(true); }, REFRESH_MS);
}
$("btnAuto").addEventListener("click", function(){
  store.auto=!store.auto; persist();
  var b=$("btnAuto"); b.classList.toggle("on",store.auto); b.setAttribute("aria-pressed",store.auto?"true":"false"); b.textContent=store.auto?"ON":"OFF";
  armAuto();
  if(store.auto) refreshInbox(true);
});
$("btnSound").addEventListener("click", function(){
  store.sound=!store.sound; persist();
  var b=$("btnSound"); b.classList.toggle("on",store.sound); b.setAttribute("aria-pressed",store.sound?"true":"false"); b.textContent=store.sound?"ON":"OFF";
  beep();
});
$("btnRefresh").addEventListener("click", function(){
  var b=this; b.classList.add("busy");
  refreshInbox(false).finally(function(){ b.classList.remove("busy"); });
});
$("btnNew").addEventListener("click", generateNew);
$("btnCopy").addEventListener("click", copyAddress);

/* list click delegation */
$("msgList").addEventListener("click", function(e){
  var del=e.target.closest(".msg-del");
  if(del){ e.stopPropagation(); delMsg({uid:del.closest(".msg").dataset.uid}); return; }
  var li=e.target.closest(".msg");
  if(li){
    var m=inbox.find(function(x){ return String(x.uid)===li.dataset.uid; });
    if(m) openMsg(m);
  }
});

/* ---------------- config drawer ---------------- */
function openCfg(){
  $("cfgBase").value = store.base || TEMPLATE_CONFIG.API_BASE;
  $("cfgKey").value = store.key || "";
  renderKeyState();
  $("config").classList.add("open");
  $("cfgBackdrop").classList.add("show");
  document.body.style.overflow="hidden";
}
function closeCfg(){
  $("config").classList.remove("open");
  $("cfgBackdrop").classList.remove("show");
  document.body.style.overflow="";
}
function renderKeyState(){
  var ks=$("keyState");
  var cfg=stateNow();
  ks.classList.remove("ok","no");
  if(!cfg.key){
    ks.classList.add("ok");
    ks.innerHTML='<span class="dot"></span><span>MODE: PROXY — key in host env var. User key dekhbe na.</span>';
  } else {
    ks.classList.add("ok");
    ks.innerHTML='<span class="dot"></span><span>MODE: STANDALONE — local key active.</span>';
  }
}
$("btnConfig").addEventListener("click", openCfg);
$("btnCfgClose").addEventListener("click", closeCfg);
$("cfgBackdrop").addEventListener("click", closeCfg);
$("btnSaveCfg").addEventListener("click", function(){
  store.base=$("cfgBase").value.trim().replace(/\/+$/,"");
  store.key=$("cfgKey").value.trim();
  persist();
  renderKeyState();
  toast("CONFIG SAVED");
});
$("btnTestCfg").addEventListener("click", function(){
  var log=$("cfgLog");
  log.classList.add("show");
  log.classList.remove("err");
  log.textContent="health check…";
  zapi("health",{}).then(function(d){
    log.className="cfg-log show";
    log.textContent="HEALTH: " + ((d&&d.status)||"ok") + "\nTIME: " + ((d&&d.time)||"—") + "\nFIREBASE: " + ((d&&d.firebase)||"—");
  }).catch(function(err){
    log.classList.add("err");
    log.textContent="FAILED: " + err.message;
  });
});

/* ---------------- system status ---------------- */
function healthCheck(){
  zapi("health",{}).then(function(d){
    var pill=$("sysPill"); pill.style.display="inline-flex";
    pill.classList.add("ok"); pill.classList.remove("no");
    $("sysTxt").textContent="API ONLINE";
  }).catch(function(){
    var pill=$("sysPill"); pill.style.display="inline-flex";
    pill.classList.add("no"); pill.classList.remove("ok");
    $("sysTxt").textContent="API OFFLINE";
  });
}

/* ---------------- init ---------------- */
function init(){
  $("btnAuto").textContent = store.auto?"ON":"OFF";
  $("btnAuto").classList.toggle("on",store.auto);
  $("btnSound").textContent = store.sound?"ON":"OFF";
  $("btnSound").classList.toggle("on",store.sound);
  armAuto();
  healthCheck();
  if(store.addr){
    setAddr(store.addr, "LOADING…");
    refreshInbox(false);
  } else {
    generateNew();
  }
}

document.addEventListener("DOMContentLoaded", init);