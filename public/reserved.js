const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const LS_AUTH = 'alumin_reserved_auth_user';
const LS_ORDERS = 'alumin_reserved_orders_v2';
const LS_DRAFT_PREFIX = 'alumin_reserved_draft_v2_';
const LS_ACTIVE_ITEM_PREFIX = 'alumin_reserved_active_item_v2_';
const LS_USERS = 'alumin_reserved_users_v2';
const LS_PENDING = 'alumin_reserved_pending_users_v2';
const today = new Date().toISOString().slice(0,10);
const SYSTEM_SERIES = { opening: ['TERMIK VLA625', 'TERMIK775', 'Tjetër'], sliding: ['S350', 'S560', 'Tjetër'] };
const SERIES_VALUE = { 'TERMIK VLA625': 'VLA625', 'TERMIK775': 'VLA775', 'Tjetër': 'other' };
const COLOR_SWATCHES = {
  RAL9016: {label:'RAL9016 (Bardhë)', img:'./assets/ral9016.svg'},
  RAL9016_TEXTURE: {label:'RAL9016 Texture', img:'./assets/ral9016-texture.svg'},
  RAL9005: {label:'RAL9005 (Zezë)', img:'./assets/ral9005.svg'},
  RAL7016_MAT: {label:'RAL7016 (Mat)', img:'./assets/ral7016-mat.svg'},
  RAL7016_TEX: {label:'RAL7016 (TEX)', img:'./assets/ral7016-tex.svg'},
  OTHER: {label:'TJETËR', img:''}
};

const CATEGORY_TYPES = {
  window: [
    ['single','1 kanat'],
    ['double','2 kanate'],
    ['triple','3 kanate'],
    ['other','Tjetër']
  ],
  door: [
    ['door_single','1 Kanate'],
    ['door_single_top_fixed','1 Kanate + Fikse sipër'],
    ['door_single_side_fixed','1 Kanate + Fikse anësore'],
    ['door_double','2 Kanata'],
    ['door_double_fixed','2 Kanata + Fikse'],
    ['door_double_both_fixed','2 Kanata + Fikse nga të 2 anët'],
    ['other','Tjetër']
  ],
  facade: [
    ['other','Tjetër']
  ]
};

const ADMIN_EMAIL = 'admin@alumin.al';

let users = load(LS_USERS, null) || [{ id:'admin', role:'admin', status:'approved', name:'Admin Alumin', email:ADMIN_EMAIL, password:'demo', phone:'', city:'', residence:'', location:'' }];
let pendingUsers = load(LS_PENDING, []);
let orders = load(LS_ORDERS, []);
let currentUser = null;
let activeOrder = blankOrder();
let activeItemId = activeOrder.items[0].id;
let currentView = 'new';

saveUsers();

function load(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
function saveUsers(){ localStorage.setItem(LS_USERS, JSON.stringify(users)); }
function savePending(){ localStorage.setItem(LS_PENDING, JSON.stringify(pendingUsers)); }
function saveOrders(){ localStorage.setItem(LS_ORDERS, JSON.stringify(orders)); }
function uuid(){ return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()); }
function blankItem(n=1){ return {id:uuid(), name:`Dritare ${n}`, category:'window', quantity:1, width:1200, height:1400, systemType:'opening', systemSeries:'VLA625', type:'single', opening:'left', color:'RAL9016', glass:'', shutterBox:'no', shutterHeight:195, shutterType:'', details:''}; }
function blankOrder(){ return {id:uuid(), ownerEmail:'', createdAt:new Date().toISOString(), orderNo:'', client:'', project:'Porosi e re', location:'', apartmentNo:'', floor:'', latitude:'', longitude:'', date:today, phone:'', measuredBy:'', notes:'', items:[blankItem()]}; }
function activeItem(){ return activeOrder.items.find(i=>i.id===activeItemId) || activeOrder.items[0]; }
function isAdmin(){ return currentUser?.role === 'admin'; }
function userOrders(){ return isAdmin() ? orders : orders.filter(o => o.ownerEmail === currentUser?.email); }
function normalizeColor(item){
 const map = {'RAL 9016':'RAL9016','RAL9016':'RAL9016','RAL9016 Texture':'RAL9016_TEXTURE','RAL 9016 Texture':'RAL9016_TEXTURE','RAL9005':'RAL9005','RAL 9005':'RAL9005','RAL7016':'RAL7016_MAT','RAL 7016':'RAL7016_MAT','RAL7016(Mat)':'RAL7016_MAT','RAL7016(TEX)':'RAL7016_TEX','RAL 7016 TEX':'RAL7016_TEX','Tjetër':'OTHER','TJETER':'OTHER','TJETËR':'OTHER'};
 item.color = map[item.color] || (COLOR_SWATCHES[item.color] ? item.color : 'OTHER');
}
function draftKey(){ return LS_DRAFT_PREFIX + (currentUser?.email || 'guest'); }
function activeItemKey(){ return LS_ACTIVE_ITEM_PREFIX + (currentUser?.email || 'guest'); }
function saveDraft(){ if(!currentUser || !activeOrder) return; activeOrder.ownerEmail = currentUser.email; activeOrder.updatedAt = new Date().toISOString(); localStorage.setItem(draftKey(), JSON.stringify(activeOrder)); if(activeItemId) localStorage.setItem(activeItemKey(), activeItemId); }
function loadDraftForUser(user){ const draft = load(LS_DRAFT_PREFIX + user.email, null); if(draft?.items?.length){ draft.items.forEach((it, idx) => { if(!it.id) it.id = uuid(); if(!it.category) it.category = 'window'; if(!it.quantity) it.quantity = 1; if(!it.shutterHeight) it.shutterHeight = 195; if(!it.shutterBox) it.shutterBox = 'no'; if(it.systemSeries === 'VLA755') it.systemSeries = 'VLA775'; normalizeColor(it); }); return draft; } const fresh = blankOrder(); fresh.ownerEmail = user.email; fresh.measuredBy = user.name; return fresh; }
function clientInitials(name=''){
 const parts = String(name).trim().split(/\s+/).filter(Boolean);
 if(parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
 const compact = String(name).replace(/[^a-zA-ZÇËçë]/g,'').toUpperCase();
 return (compact.slice(0,2) || 'XX').padEnd(2,'X');
}
function orderMonth(order=activeOrder){
 const d = order?.date ? new Date(order.date) : new Date();
 const m = Number.isFinite(d.getTime()) ? d.getMonth()+1 : new Date().getMonth()+1;
 return String(m).padStart(2,'0');
}
function makeOrderPrefix(order=activeOrder){ return `${clientInitials(order?.client)}${orderMonth(order)}`; }
function nextOrderSequence(prefix, currentId){
 let max = 0;
 orders.forEach(o => {
   if(o.id === currentId) return;
   const m = String(o.orderNo || '').match(new RegExp('^'+prefix+'-(\\d+)$'));
   if(m) max = Math.max(max, Number(m[1]));
 });
 return max + 1;
}
function updateOrderNumber(force=false){
 if(!activeOrder) return;
 if(!String(activeOrder.client||'').trim()) { activeOrder.orderNo = ''; return; }
 const prefix = makeOrderPrefix(activeOrder);
 const current = String(activeOrder.orderNo || '');
 if(force || !current || !current.startsWith(prefix+'-')) activeOrder.orderNo = `${prefix}-${nextOrderSequence(prefix, activeOrder.id)}`;
 const f = $('[data-order-form]'); if(f?.elements.orderNo) f.elements.orderNo.value = activeOrder.orderNo;
}

function showApp(){ $('[data-login-screen]').hidden=true; $('[data-app]').hidden=false; renderAll(); }
function showLogin(){ $('[data-login-screen]').hidden=false; $('[data-app]').hidden=true; }
function setMessage(form, text, kind='info'){
  $('.form-message', form)?.remove();
  const el = document.createElement('small');
  el.className = `form-message ${kind}`;
  el.textContent = text;
  form.appendChild(el);
}

$$('[data-auth-tab]').forEach(btn => btn.addEventListener('click', () => {
  $$('[data-auth-tab]').forEach(b => b.classList.toggle('active', b === btn));
  $$('.auth-panel').forEach(p => p.classList.toggle('active', p.dataset.loginForm !== undefined ? btn.dataset.authTab === 'login' : btn.dataset.authTab === 'register'));
}));

$('[data-login-form]').addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const email = String(fd.get('email') || '').trim().toLowerCase();
  const pass = String(fd.get('password') || '').trim();
  const user = users.find(u => u.email.toLowerCase() === email && u.password === pass && u.status === 'approved');
  const pending = pendingUsers.find(u => u.email.toLowerCase() === email);
  if(user){
    currentUser = user;
    localStorage.setItem(LS_AUTH, user.email);
    activeOrder = loadDraftForUser(user);
    activeItemId = localStorage.getItem(LS_ACTIVE_ITEM_PREFIX + user.email) || activeOrder.items[0].id;
    currentView = 'new';
    showApp();
  } else if(pending){
    setMessage(e.target, 'Kërkesa jote është ende në pritje të aprovimit nga admin.', 'warn');
  } else {
    setMessage(e.target, 'Email ose password gabim, ose përdoruesi nuk është aprovuar.', 'error');
  }
});

$('[data-register-form]').addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = Object.fromEntries(fd.entries());
  data.email = String(data.email || '').trim().toLowerCase();
  data.password = String(data.password || '').trim();
  if(data.password.length < 4) return setMessage(e.target, 'Password duhet të ketë minimumi 4 karaktere.', 'error');
  if(users.some(u => u.email.toLowerCase() === data.email)) return setMessage(e.target, 'Ky email është tashmë i regjistruar.', 'error');
  if(pendingUsers.some(u => u.email.toLowerCase() === data.email)) return setMessage(e.target, 'Kërkesa për këtë email është tashmë në pritje.', 'warn');
  pendingUsers.unshift({ id:uuid(), role:'user', status:'pending', requestedAt:new Date().toISOString(), ...data });
  savePending();
  e.target.reset();
  setMessage(e.target, 'Kërkesa u dërgua. Admini duhet ta aprovojë para se të hysh.', 'success');
});

$('[data-logout]').addEventListener('click', () => { localStorage.removeItem(LS_AUTH); currentUser=null; showLogin(); });

$$('[data-view]').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
function switchView(view){
  if(view === 'approvals' && !isAdmin()) view = 'orders';
  currentView = view;
  $$('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $$('[data-panel]').forEach(p => p.classList.toggle('active', p.dataset.panel === view));
  const titles = {new:'Porosi e re', orders:'Porositë', approvals:'Aprovim përdoruesish'};
  $('[data-page-title]').textContent = titles[view] || 'Reserved Area';
  $('[data-kicker]').textContent = view === 'new' ? 'Porosi e re' : 'Zona e rezervuar';
  renderAll();
}

function renderAll(){
  if(!currentUser) return;
  $('[data-admin-box]').hidden = !isAdmin();
  $('[data-user-box]').innerHTML = `<strong>${escapeHtml(currentUser.name)}</strong><span>${escapeHtml(currentUser.email)}</span>`;
  renderOrderForm(); renderItems(); renderOrderSummary(); renderItemForm(); draw(); renderOrders(); renderApprovals();
}
function renderCoordinates(){
 const lat = activeOrder.latitude; const lng = activeOrder.longitude;
 const text = lat && lng ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : 'Pa koordinata';
 $('[data-coordinates]').textContent = text;
 const mapText = $('[data-map-coordinates]'); if(mapText) mapText.textContent = text;
}
function renderOrderForm(){ updateOrderNumber(false); const f=$('[data-order-form]'); ['orderNo','client','project','location','apartmentNo','floor','latitude','longitude','date','phone','measuredBy','notes'].forEach(k=>{ if(f.elements[k]) f.elements[k].value=activeOrder[k]||''; }); renderCoordinates(); }
function renderItems(){ const box=$('[data-item-list]'); box.innerHTML=''; activeOrder.items.forEach((i, idx)=>{ const b=document.createElement('div'); b.className='item-btn'+(i.id===activeItemId?' active':''); b.tabIndex=0; b.setAttribute('role','button'); b.innerHTML=`<div class="item-main-row"><span class="item-summary"><span class="pos-box"><em>Pos.${idx+1}</em></span><strong>${escapeHtml(i.name||'Dritare '+(idx+1))}</strong></span><span class="item-controls"><b class="nom-mini">${itemNomination(i)}</b><span class="move-row"><button type="button" class="move-item" title="Lëviz lart" aria-label="Lëviz lart" data-move-item="${i.id}" data-dir="up" ${idx===0?'disabled':''}>↑</button><button type="button" class="move-item" title="Lëviz poshtë" aria-label="Lëviz poshtë" data-move-item="${i.id}" data-dir="down" ${idx===activeOrder.items.length-1?'disabled':''}>↓</button><button type="button" class="delete-item" title="Fshi nga porosia" aria-label="Fshi ${escapeHtml(i.name||'elementin')}" data-delete-item="${i.id}">🗑</button></span></span></div><span class="quick-size"><label>Gjerësi<input data-quick-size="width" data-item-id="${i.id}" type="number" min="200" step="10" value="${i.width||0}"></label><label>Lartësi<input data-quick-size="height" data-item-id="${i.id}" type="number" min="200" step="10" value="${i.height||0}"></label></span>`; b.onclick=(ev)=>{ if(ev.target.closest('[data-delete-item],[data-move-item],[data-quick-size]')) return; activeItemId=i.id; saveDraft(); renderAll();}; b.onkeydown=(ev)=>{ if(ev.key==='Enter' || ev.key===' '){ ev.preventDefault(); activeItemId=i.id; saveDraft(); renderAll(); } }; box.appendChild(b); }); }
function renderOrderSummary(){
 const totalPieces = activeOrder.items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
 const totalArea = activeOrder.items.reduce((sum, it) => {
   const q = Number(it.quantity) || 1;
   const w = Number(it.width) || 0;
   const h = Number(it.height) || 0;
   return sum + (q * w * h / 1000000);
 }, 0);
 const piecesEl = $('[data-total-pieces]');
 const areaEl = $('[data-total-area]');
 if(piecesEl) piecesEl.textContent = totalPieces;
 if(areaEl) areaEl.textContent = totalArea.toFixed(2);
}
function renderItemForm(){
 const i=activeItem(); const f=$('[data-item-form]'); if(!i) return;
 const posIndex = activeOrder.items.findIndex(x => x.id === i.id) + 1;
 const posBadge = $('[data-position-badge]'); if(posBadge) posBadge.textContent = `Pos.${posIndex}`;
 renderCategoryState(i);
 renderNominationBadge(i);
 i.systemType = i.systemType || 'opening'; if((i.category||'window') === 'door' && i.systemType === 'sliding') i.systemType = 'opening'; i.systemSeries = i.systemSeries || (i.systemType === 'sliding' ? 'S350' : 'VLA625'); normalizeColor(i); syncSystemTypeOptions(i);
 if(f.elements.systemType) f.elements.systemType.value=i.systemType;
 syncSeriesOptions(i);
 ['category','name','quantity','width','height','systemSeries','type','opening','color','glass','shutterBox','shutterHeight','shutterType','details'].forEach(k=>{ if(f.elements[k]) f.elements[k].value=i[k]||''; });
 renderMeasureNote();
 renderColorPreview();
}
function categoryLabel(v){ return {window:'Dritare', door:'Derë', facade:'Vetratë'}[v] || 'Dritare'; }
function itemNomination(item){
 const category = item.category || 'window';
 if(category === 'door') return ({door_single:'D1K',door_single_top_fixed:'D1K+FS',door_single_side_fixed:'D1K+FA',door_double:'D2K',door_double_fixed:'D2K+F',door_double_both_fixed:'D2K+2F',other:'DER-T'}[item.type] || 'DER');
 if(category === 'facade') return 'VET';
 const n = {single:'1', double:'2', triple:'3', other:'T'}[item.type] || '1';
 const prefix = Number(item.height) > 1700 ? 'DB' : 'DR';
 return `${prefix}${n}K`;
}
function renderNominationBadge(item){
 let badge = $('[data-nomination-badge]');
 if(!badge){
   const pos = $('[data-position-badge]');
   if(!pos) return;
   badge = document.createElement('div');
   badge.className = 'nomination-badge';
   badge.dataset.nominationBadge = 'yes';
   pos.insertAdjacentElement('afterend', badge);
 }
 const isBalconyExit = (item.category || 'window') === 'window' && Number(item.height) > 1700;
 badge.textContent = isBalconyExit ? `${itemNomination(item)} = Dalje Ballkon` : itemNomination(item);
 badge.classList.toggle('balcony', isBalconyExit);
}
function renderCategoryState(item){
 const f=$('[data-item-form]'); if(!f || !item) return;
 const category = item.category || 'window';
 if(category === 'door' && item.systemType === 'sliding') item.systemType = 'opening';
 syncSystemTypeOptions(item);
 syncTypeOptions(item);
 const note=$('[data-category-note]');
 if(note){
   if(category === 'window') note.textContent = 'Modelet 1 kanat / 2 kanate / 3 kanate vlejnë për Dritare.';
   else if(category === 'door') note.textContent = 'Tipologjitë e Derës janë të ndara nga Dritaret.';
   else note.textContent = 'Vetrata është kategori e rezervuar; modelet do t’i krijojmë më vonë.';
 }
 if(f.elements.opening) f.elements.opening.disabled = category === 'facade';
 if(f.elements.type) f.elements.type.disabled = false;
}
function syncSystemTypeOptions(item){
 const f=$('[data-item-form]'); if(!f?.elements.systemType || !item) return;
 const category = item.category || 'window';
 const options = category === 'door'
   ? [['opening','Me hapje']]
   : [['opening','Me hapje'], ['sliding','Me rrëshkitje']];
 const values = options.map(([v]) => v);
 if(!values.includes(item.systemType)) item.systemType = values[0];
 f.elements.systemType.innerHTML = options.map(([v,label]) => `<option value="${v}">${label}</option>`).join('');
 f.elements.systemType.value = item.systemType;
}
function syncTypeOptions(item){
 const f=$('[data-item-form]'); if(!f?.elements.type || !item) return;
 const category = item.category || 'window';
 const options = CATEGORY_TYPES[category] || CATEGORY_TYPES.window;
 const values = options.map(([v]) => v);
 if(!values.includes(item.type)) item.type = values[0];
 f.elements.type.innerHTML = options.map(([v,label]) => `<option value="${v}">${label}</option>`).join('');
 f.elements.type.value = item.type;
}
function renderColorPreview(){
 const i=activeItem();
 const box=$('[data-color-preview]');
 if(!i || !box) return;
 const data = COLOR_SWATCHES[i.color] || COLOR_SWATCHES.OTHER;
 if(data.img){
   box.innerHTML = `<img src="${data.img}" alt="${escapeHtml(data.label)}"><b>${escapeHtml(data.label)}</b>`;
 } else {
   box.innerHTML = '<span class="other-swatch">?</span><b>TJETËR</b>';
 }
}
function renderMeasureNote(){
 const i=activeItem();
 const note=$('[data-measure-note]');
 if(!i || !note) return;
 const shutter = i.shutterBox === 'yes' ? ([195,220].includes(Number(i.shutterHeight)) ? Number(i.shutterHeight) : 195) : 0;
 if(shutter){
   const total = Number(i.height) || 0;
   const real = total ? Math.max(0, total - shutter) : 0;
   note.textContent = `Shënim: lartësia reale e dritares = lartësia totale ${total || '—'} mm − kutia e grilës ${shutter} mm${total ? ` = ${real} mm` : ''}.`;
 } else {
   note.textContent = 'Shënim: kur ka kuti grile, lartësia reale e dritares = lartësia totale − lartësia e kutisë së grilës.';
 }
}
function renderOrders(){
 const box=$('[data-orders-list]'); if(!box) return; const list=userOrders();
 if(!list.length){ box.innerHTML='<p class="empty">Nuk ka ende porosi të regjistruara.</p>'; return; }
 box.innerHTML='';
 list.forEach(o=>{ const card=document.createElement('article'); card.className='order-card'; const totalQty = o.items.reduce((sum,it)=>sum+(Number(it.quantity)||1),0); card.innerHTML=`<div><strong>${escapeHtml(o.client || 'Pa klient')}</strong><span>${escapeHtml(o.project || 'Projekt')} • ${escapeHtml(o.location || '')}</span><small>${escapeHtml(o.date || '')} • ${totalQty} copë / ${o.items.length} element(e)${isAdmin()?` • ${escapeHtml(o.ownerEmail)}`:''}</small></div><div class="order-actions"><button type="button" data-open-order="${o.id}">Hap</button></div>`; box.appendChild(card); });
 $$('[data-open-order]', box).forEach(btn => btn.onclick = () => { const o=orders.find(x=>x.id===btn.dataset.openOrder); if(!o) return; activeOrder=structuredClone(o); activeOrder.items.forEach((it, idx) => { if(!it.category) it.category = 'window'; if(!it.quantity) it.quantity = 1; if(!it.id) it.id = uuid(); }); activeItemId=activeOrder.items[0]?.id; saveDraft(); switchView('new'); });
}
function renderApprovals(){
 const box=$('[data-approvals-list]'); if(!box || !isAdmin()) return;
 if(!pendingUsers.length){ box.innerHTML='<p class="empty">Nuk ka kërkesa në pritje.</p>'; return; }
 box.innerHTML='';
 pendingUsers.forEach(u=>{ const card=document.createElement('article'); card.className='approval-card'; card.innerHTML=`<div><strong>${escapeHtml(u.name)}</strong><span>${escapeHtml(u.email)} • ${escapeHtml(u.phone || '')}</span><small>${escapeHtml(u.city || '')} / ${escapeHtml(u.residence || '')} / ${escapeHtml(u.location || '')}</small></div><div class="order-actions"><button type="button" data-approve="${u.id}">Aprovo</button><button type="button" class="danger" data-reject="${u.id}">Refuzo</button></div>`; box.appendChild(card); });
 $$('[data-approve]', box).forEach(btn => btn.onclick = () => approveUser(btn.dataset.approve));
 $$('[data-reject]', box).forEach(btn => btn.onclick = () => rejectUser(btn.dataset.reject));
}
function approveUser(id){ const idx=pendingUsers.findIndex(u=>u.id===id); if(idx<0) return; const u=pendingUsers.splice(idx,1)[0]; users.push({...u, status:'approved'}); savePending(); saveUsers(); renderAll(); }
function rejectUser(id){ pendingUsers = pendingUsers.filter(u=>u.id!==id); savePending(); renderAll(); }

$('[data-order-form]').addEventListener('input', e=>{ activeOrder[e.target.name]=e.target.value; if(['client','date'].includes(e.target.name)) updateOrderNumber(true); saveDraft(); });
$('[data-item-form]').addEventListener('input', e=>{
 const i=activeItem(); if(!i) return;
 i[e.target.name]=['width','height','quantity','shutterHeight'].includes(e.target.name)?Number(e.target.value):e.target.value;
 if(e.target.name === 'quantity' && (!i.quantity || i.quantity < 1)) i.quantity = 1;
 if(e.target.name === 'category'){ const opts = CATEGORY_TYPES[i.category] || CATEGORY_TYPES.window; if(!opts.map(([v])=>v).includes(i.type)) i.type = opts[0][0]; if(i.category === 'door') i.systemType = 'opening'; renderCategoryState(i); }
 saveDraft();
 if(e.target.name === 'systemType'){
   syncSeriesOptions(i); i.systemSeries = $('[data-item-form]').elements.systemSeries.value;
   if(i.systemType === 'sliding' && i.opening !== 'sliding') i.opening = 'sliding';
   if($('[data-item-form]').elements.opening) $('[data-item-form]').elements.opening.value = i.opening;
   saveDraft();
 }
 renderItems(); renderOrderSummary(); renderCategoryState(i); renderNominationBadge(i); renderMeasureNote(); renderColorPreview(); draw();
});
$('[data-add-item]').onclick=()=>{ const it=blankItem(activeOrder.items.length+1); activeOrder.items.push(it); activeItemId=it.id; saveDraft(); renderAll(); };
$('[data-item-list]').addEventListener('input', e => {
  const quick = e.target.closest('[data-quick-size]');
  if(!quick) return;
  const item = activeOrder.items.find(i => i.id === quick.dataset.itemId);
  if(!item) return;
  item[quick.dataset.quickSize] = Math.max(200, Number(quick.value) || 200);
  activeItemId = item.id;
  saveDraft();
  renderOrderSummary();
  renderItemForm();
  draw();
});
$('[data-item-list]').addEventListener('click', e => {
  if(e.target.closest('[data-quick-size]')) return;
  const move = e.target.closest('[data-move-item]');
  if(move){
    const id = move.dataset.moveItem;
    const idx = activeOrder.items.findIndex(i => i.id === id);
    if(idx < 0) return;
    const next = move.dataset.dir === 'up' ? idx - 1 : idx + 1;
    if(next < 0 || next >= activeOrder.items.length) return;
    [activeOrder.items[idx], activeOrder.items[next]] = [activeOrder.items[next], activeOrder.items[idx]];
    activeItemId = id;
    saveDraft();
    renderAll();
    return;
  }
  const del = e.target.closest('[data-delete-item]');
  if(!del) return;
  const id = del.dataset.deleteItem;
  if(activeOrder.items.length <= 1){
    alert('Porosia duhet të ketë të paktën një element.');
    return;
  }
  activeOrder.items = activeOrder.items.filter(i => i.id !== id);
  if(activeItemId === id) activeItemId = activeOrder.items[0]?.id;
  saveDraft();
  renderAll();
});
$('[data-save-order]').onclick=()=>{
  activeOrder.ownerEmail = currentUser.email;
  updateOrderNumber(false);
  activeOrder.updatedAt = new Date().toISOString();
  const idx = orders.findIndex(o => o.id === activeOrder.id);
  if(idx >= 0) orders[idx] = structuredClone(activeOrder); else orders.unshift(structuredClone(activeOrder));
  saveOrders();
  saveDraft();
  alert('Porosia u ruajt te ORDERS.');
  switchView('orders');
};

let orderMap = null;
let orderMarker = null;
function ensureMap(){
  if(!window.L) return alert('Harta nuk u ngarkua. Kontrollo internetin dhe provo përsëri.');
  const lat = Number(activeOrder.latitude) || 40.4661;
  const lng = Number(activeOrder.longitude) || 19.4914;
  if(!orderMap){
    orderMap = L.map('order-map').setView([lat,lng], activeOrder.latitude ? 16 : 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(orderMap);
    orderMap.on('click', e => setMapPin(e.latlng.lat, e.latlng.lng));
  } else {
    orderMap.setView([lat,lng], activeOrder.latitude ? 16 : 12);
    setTimeout(()=>orderMap.invalidateSize(), 80);
  }
  if(activeOrder.latitude && activeOrder.longitude) setMapPin(lat,lng,false);
  setTimeout(()=>orderMap.invalidateSize(), 120);
}
function setMapPin(lat,lng,save=true){
  activeOrder.latitude = Number(lat).toFixed(6);
  activeOrder.longitude = Number(lng).toFixed(6);
  if($('[data-order-form]').elements.latitude) $('[data-order-form]').elements.latitude.value = activeOrder.latitude;
  if($('[data-order-form]').elements.longitude) $('[data-order-form]').elements.longitude.value = activeOrder.longitude;
  const point=[Number(activeOrder.latitude),Number(activeOrder.longitude)];
  if(orderMarker) orderMarker.setLatLng(point); else orderMarker = L.marker(point).addTo(orderMap);
  renderCoordinates();
  if(save) saveDraft();
}
$('[data-open-map]').addEventListener('click', () => { $('[data-map-modal]').hidden=false; ensureMap(); });
$('[data-close-map]').addEventListener('click', () => { $('[data-map-modal]').hidden=true; });
$('[data-confirm-map]').addEventListener('click', () => { saveDraft(); $('[data-map-modal]').hidden=true; });
$('[data-use-my-location]').addEventListener('click', () => {
  if(!navigator.geolocation) return alert('Browser-i nuk suporton vendndodhjen aktuale.');
  navigator.geolocation.getCurrentPosition(pos => {
    setMapPin(pos.coords.latitude, pos.coords.longitude);
    orderMap.setView([pos.coords.latitude,pos.coords.longitude], 17);
  }, () => alert('Nuk u mor vendndodhja aktuale. Mund ta vendosësh pin-in manualisht në hartë.'));
});


function isMobileLayout(){ return window.matchMedia('(max-width: 899px)').matches; }
function setMobileFocusMode(on=true){
  document.body.classList.toggle('mobile-focus-elements', Boolean(on) && isMobileLayout());
  document.body.classList.remove('mobile-menu-open');
  if(on && isMobileLayout()) $('[data-panel="new"] .configurator')?.scrollIntoView({behavior:'smooth', block:'start'});
}
function showMobileOrderData(){
  document.body.classList.remove('mobile-focus-elements');
  document.body.classList.remove('mobile-menu-open');
  $('[data-order-form]')?.scrollIntoView({behavior:'smooth', block:'start'});
}
function toggleMobileMenu(){
  document.body.classList.toggle('mobile-menu-open');
  document.body.classList.remove('mobile-focus-elements');
}
$('[data-continue-elements]')?.addEventListener('click', () => setMobileFocusMode(true));
$('[data-focus-elements]')?.addEventListener('click', () => setMobileFocusMode(true));
$('[data-show-order-data]')?.addEventListener('click', showMobileOrderData);
$('[data-toggle-mobile-menu]')?.addEventListener('click', toggleMobileMenu);
window.addEventListener('resize', () => { if(!isMobileLayout()) document.body.classList.remove('mobile-focus-elements','mobile-menu-open'); });

function colorLabel(v){ return (COLOR_SWATCHES[v]?.label || v || ''); }
function areaM2(item){ return ((Number(item.width)||0) * (Number(item.height)||0) * (Number(item.quantity)||1) / 1000000); }
function formatDateSq(v){ if(!v) return ''; const d=new Date(v); return Number.isFinite(d.getTime()) ? d.toLocaleDateString('sq-AL') : v; }
function printMiniSvg(item, pos){
 const w=Number(item.width)||1200, h=Number(item.height)||1400;
 const hasShutter=item.shutterBox==='yes';
 const shutter=hasShutter ? Number(item.shutterHeight)||195 : 0;
 const bodyH=Math.max(200,h-shutter);
 const scale=Math.min(170/w,120/h);
 const W=Math.max(70,Math.round(w*scale)), H=Math.max(55,Math.round(bodyH*scale)), SH=hasShutter?Math.max(14,Math.round(shutter*scale)):0;
 const X=Math.round((210-W)/2), Y=20+SH;
 const type=item.type||'single';
 const cols=type==='triple'?3:(type==='double'||type.startsWith('door_double')?2:1);
 let mullions=''; for(let n=1;n<cols;n++){ const mx=X+W*n/cols; mullions+=`<line x1="${mx}" y1="${Y}" x2="${mx}" y2="${Y+H}" class="pm"/>`; }
 return `<svg class="print-svg" viewBox="0 0 210 170" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="210" height="170" fill="#fff"/>
  <text x="8" y="14" class="pt">Pos.${pos} ${itemNomination(item)}</text>
  ${hasShutter?`<rect x="${X}" y="${Y-SH-3}" width="${W}" height="${SH}" class="psh"/><text x="${X+4}" y="${Y-SH/2+2}" class="pn">Kuti ${shutter}mm</text>`:''}
  <rect x="${X}" y="${Y}" width="${W}" height="${H}" class="pf"/>
  <rect x="${X+9}" y="${Y+9}" width="${W-18}" height="${H-18}" class="pg"/>
  ${mullions}
  <text x="105" y="${Y+H+18}" text-anchor="middle" class="pd">${w} × ${h} mm</text>
 </svg>`;
}
function buildPrintReport(){
 updateOrderNumber(false);
 const totalQty=activeOrder.items.reduce((s,i)=>s+(Number(i.quantity)||1),0);
 const totalArea=activeOrder.items.reduce((s,i)=>s+areaM2(i),0);
 const coords=activeOrder.latitude&&activeOrder.longitude ? `${activeOrder.latitude}, ${activeOrder.longitude}` : '';
 const rows=activeOrder.items.map((it,idx)=>`
  <section class="print-pos">
    <div class="print-img">${printMiniSvg(it,idx+1)}</div>
    <div class="print-info">
      <h3>Pozicioni ${idx+1} <span>${itemNomination(it)}</span></h3>
      <p class="print-name">${escapeHtml(it.name||'')}</p>
      <dl>
        <dt>Sistemi</dt><dd>${escapeHtml(normalizedSeriesLabel(it.systemSeries))}</dd>
        <dt>Tipologjia</dt><dd>${escapeHtml(labelType(it.type))}</dd>
        <dt>Përmasa (Gjerësi x Lartësi)</dt><dd>${Number(it.width)||0} x ${Number(it.height)||0} mm</dd>
        <dt>Ngjyra e profileve</dt><dd>${escapeHtml(colorLabel(it.color))}</dd>
        <dt>Xhami / Mbushja</dt><dd>${escapeHtml(it.glass || '-')}</dd>
        <dt>Kutia e grilës</dt><dd>${it.shutterBox==='yes' ? `${it.shutterHeight} mm ${it.shutterType||''}` : 'Jo'}</dd>
        <dt>Sipërfaqe</dt><dd>${areaM2(it).toFixed(2)} m²</dd>
        <dt>Sasia</dt><dd>x ${Number(it.quantity)||1}</dd>
        <dt>Shënime</dt><dd>${escapeHtml(it.details || '-')}</dd>
      </dl>
    </div>
  </section>`).join('');
 $('[data-print-report]').innerHTML=`
  <div class="print-page">
    <header class="print-header">
      <div><img src="./assets/vloralumin-logo-header.png" alt="Vlora Alumin"><p>Pamje e tipologjisë nga brenda</p></div>
      <div class="print-meta"><strong>Oferta ${escapeHtml(activeOrder.orderNo||'')}</strong><span>Datë ${formatDateSq(activeOrder.date)}</span></div>
    </header>
    <section class="print-client">
      <div><b>Klienti</b><strong>${escapeHtml(activeOrder.client||'Pa klient')}</strong><span>${escapeHtml(activeOrder.phone||'')}</span></div>
      <div><b>Objekti</b><span>${escapeHtml([activeOrder.location, activeOrder.apartmentNo, activeOrder.floor].filter(Boolean).join(' • '))}</span><small>${escapeHtml(coords)}</small></div>
      <div><b>Porosia</b><span>${escapeHtml(activeOrder.project||'')}</span><small>${escapeHtml(activeOrder.notes||'')}</small></div>
    </section>
    ${rows}
    <footer class="print-total"><span>Copë total: <b>${totalQty}</b></span><span>Sipërfaqe totale: <b>${totalArea.toFixed(2)} m²</b></span></footer>
  </div>`;
}
function exportExcel(){
 updateOrderNumber(false);
 const headers=['Nr Porosie','Klienti','Data','Pozicioni','Kodi','Kategoria','Emërtimi','Sistemi','Tipologjia','Hapja','Ngjyra','Xhami','Kutia e grilës','Sasia','Gjerësi mm','Lartësi mm','m²','Vendodhja','Apartamenti','Kati','Koordinata','Shënime'];
 const rows=activeOrder.items.map((it,idx)=>[activeOrder.orderNo,activeOrder.client,activeOrder.date,idx+1,itemNomination(it),categoryLabel(it.category),it.name,normalizedSeriesLabel(it.systemSeries),labelType(it.type),it.opening,colorLabel(it.color),it.glass,it.shutterBox==='yes'?`${it.shutterHeight} ${it.shutterType||''}`:'Jo',Number(it.quantity)||1,Number(it.width)||0,Number(it.height)||0,areaM2(it).toFixed(2),activeOrder.location,activeOrder.apartmentNo,activeOrder.floor,(activeOrder.latitude&&activeOrder.longitude?`${activeOrder.latitude}, ${activeOrder.longitude}`:''),it.details]);
 const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const html=`<html><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
 const blob=new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'});
 const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${activeOrder.orderNo||'alumin-orders'}.xls`; a.click(); URL.revokeObjectURL(a.href);
}

function buildCompactPrintReport(){
 updateOrderNumber(false);
 const totalQty=activeOrder.items.reduce((s,i)=>s+(Number(i.quantity)||1),0);
 const totalArea=activeOrder.items.reduce((s,i)=>s+areaM2(i),0);
 const cards=activeOrder.items.map((it,idx)=>`
   <article class="compact-pos">
     <div class="compact-sketch">${printMiniSvg(it,idx+1)}</div>
     <div class="compact-data">
       <strong>Poz.${idx+1} — ${itemNomination(it)}</strong>
       <span>${escapeHtml(it.name||'')}</span>
       <b>${Number(it.width)||0} × ${Number(it.height)||0} mm</b>
       <em>Sasia: ${Number(it.quantity)||1} copë</em>
     </div>
   </article>`).join('');
 $('[data-print-report]').innerHTML=`
  <div class="print-page compact-print">
    <header class="print-header compact-header">
      <div><img src="./assets/vloralumin-logo-header.png" alt="Vlora Alumin"><p>Format kompakt</p></div>
      <div class="print-meta"><strong>Oferta ${escapeHtml(activeOrder.orderNo||'')}</strong><span>${escapeHtml(activeOrder.client||'')}</span><span>Datë ${formatDateSq(activeOrder.date)}</span></div>
    </header>
    <section class="compact-grid">${cards}</section>
    <footer class="print-total compact-total"><span>Copë total: <b>${totalQty}</b></span><span>Sipërfaqe totale: <b>${totalArea.toFixed(2)} m²</b></span></footer>
  </div>`;
}

$('[data-export]').onclick=exportExcel;
$('[data-print-full]').onclick=()=>{ buildPrintReport(); window.print(); };
$('[data-print-compact]').onclick=()=>{ buildCompactPrintReport(); window.print(); };


function labelType(t){ return {single:'1 kanat',double:'2 kanate',triple:'3 kanate',door_single:'1 Kanate',door_single_top_fixed:'1 Kanate + Fikse sipër',door_single_side_fixed:'1 Kanate + Fikse anësore',door_double:'2 Kanata',door_double_fixed:'2 Kanata + Fikse',door_double_both_fixed:'2 Kanata + Fikse nga të 2 anët',other:'Tjetër'}[t]||t; }
function labelSystem(t){ return t === 'sliding' ? 'Me rrëshkitje' : 'Me hapje'; }
function normalizedSeriesLabel(v){ return {VLA625:'TERMIK VLA625', VLA775:'TERMIK775', VLA755:'TERMIK775', other:'Tjetër'}[v] || v || ''; }
function syncSeriesOptions(item){
 const f=$('[data-item-form]'); if(!f) return; const systemType = item?.systemType || f.elements.systemType?.value || 'opening'; const seriesSelect = f.elements.systemSeries; if(!seriesSelect) return;
 const current = item?.systemSeries || seriesSelect.value; const options = SYSTEM_SERIES[systemType] || SYSTEM_SERIES.opening;
 seriesSelect.innerHTML = options.map(label => `<option value="${SERIES_VALUE[label] || label}">${label}</option>`).join('');
 const values = options.map(label => SERIES_VALUE[label] || label); seriesSelect.value = values.includes(current) ? current : values[0]; if(item) item.systemSeries = seriesSelect.value;
}
function escapeHtml(v=''){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function draw(){
 const i=activeItem(); if(!i) return;
 $('[data-preview-title]').textContent=`${itemNomination(i)} • ${i.name||'Tipologji'} • ${labelSystem(i.systemType)} ${normalizedSeriesLabel(i.systemSeries)}`;
 $('[data-preview-size]').textContent=`${i.width||0} × ${i.height||0} mm${i.shutterBox==='yes' ? ' total (me kuti)' : ''}`;
 const svg=$('[data-window-svg]');
 svg.setAttribute('viewBox','0 0 620 420');
 const rawType=i.type||'single';
 const type=(rawType.startsWith('door_double')?'double':rawType.startsWith('door_')?'door':rawType);
 const opening=i.opening||'left';
 const mmW=Math.max(200, Number(i.width)||1200), totalH=Math.max(200, Number(i.height)||1400);
 const hasShutter = i.shutterBox === 'yes';
 const shutterMm = hasShutter ? ([195,220].includes(Number(i.shutterHeight)) ? Number(i.shutterHeight) : 195) : 0;
 const windowMmH = Math.max(200, totalH - shutterMm);
 const scale=Math.min(430/mmW, 285/totalH);
 const W=Math.max(115, Math.round(mmW*scale));
 const H=Math.max(115, Math.round(windowMmH*scale));
 const SH=hasShutter?Math.max(28,Math.round(shutterMm*scale)):0;
 const X=Math.round((620-W)/2)+18;
 const topY=Math.round((335-(H+SH))/2)+42;
 const Y=topY+SH;
 const profile=Math.max(14, Math.min(24, Math.round(Math.min(W,H)*0.085)));
 const sash=Math.max(9, Math.round(profile*.58));
 const inner=profile+sash;
 const defs=`<defs>
  <linearGradient id="romchiAl" x1="0" x2="1"><stop offset="0" stop-color="#d6dde6"/><stop offset=".18" stop-color="#ffffff"/><stop offset=".48" stop-color="#9aa7b8"/><stop offset=".74" stop-color="#f8fafc"/><stop offset="1" stop-color="#7b8794"/></linearGradient>
  <linearGradient id="romchiDarkAl" x1="0" x2="1"><stop stop-color="#7d8794"/><stop offset=".5" stop-color="#e5e7eb"/><stop offset="1" stop-color="#687484"/></linearGradient>
  <linearGradient id="romchiGlass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dff7ff"/><stop offset=".45" stop-color="#8bd6f6"/><stop offset="1" stop-color="#2f9ed6"/></linearGradient>
  <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="5" dy="7" stdDeviation="5" flood-color="#020617" flood-opacity=".24"/></filter>
  <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#334155"/></marker>
 </defs>`;
 const rect=(x,y,w,h,c,extra='')=>`<rect class="${c}" x="${x}" y="${y}" width="${Math.max(1,w)}" height="${Math.max(1,h)}" ${extra}/>`;
 const line=(x1,y1,x2,y2,c='romchi-line')=>`<line class="${c}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
 const glass=(x,y,w,h)=>`${rect(x,y,w,h,'romchi-glass','rx="2"')}<path class="glass-shine" d="M ${x+8} ${y+8} L ${x+w-18} ${y+8} L ${x+18} ${y+h-12} L ${x+8} ${y+h-12} Z"/>`;
 const profileBox=(x,y,w,h)=>{
   const p=profile, s=sash;
   return `<g filter="url(#softShadow)">
    ${rect(x,y,w,h,'romchi-profile','rx="4"')}
    ${rect(x+p*.42,y+p*.42,w-p*.84,h-p*.84,'romchi-profile-inner','rx="3"')}
    ${rect(x+p,y+p,w-2*p,h-2*p,'romchi-cavity','rx="2"')}
    ${rect(x+p+s,y+p+s,w-2*(p+s),h-2*(p+s),'romchi-glass-slot','rx="2"')}
   </g>`;
 };
 const sashPanel=(x,y,w,h,kind='single')=>{
   const p=sash;
   return `<g>
    ${rect(x,y,w,h,'romchi-sash','rx="3"')}
    ${rect(x+p,y+p,w-2*p,h-2*p,'romchi-sash-inner','rx="2"')}
    ${glass(x+p*1.7,y+p*1.7,w-3.4*p,h-3.4*p)}
    ${kind==='door'?`<circle class="romchi-handle" cx="${x+w-p*2.1}" cy="${y+h/2}" r="5"/>`:''}
   </g>`;
 };
 let out=`<rect class="romchi-paper" x="0" y="0" width="620" height="420" rx="12"/>`;
 out+=`<text class="romchi-title" x="24" y="28">${itemNomination(i)} • ${labelType(i.type)} • profil alumini</text>`;
 if(hasShutter){
   out+=`<g filter="url(#softShadow)">${rect(X,Y-SH-8,W,SH,'romchi-shutter','rx="3"')}<path class="romchi-shutter-ribs" d="${Array.from({length:Math.max(3,Math.floor(SH/9))},(_,n)=>`M ${X+8} ${Y-SH-2+n*8} H ${X+W-8}`).join(' ')}"/><text class="romchi-shutter-text" x="${X+12}" y="${Y-SH/2-2}">Kutia e grilës ${shutterMm} mm</text></g>`;
 }
 out+=profileBox(X,Y,W,H);
 const sashX=X+profile, sashY=Y+profile, sashW=W-2*profile, sashH=H-2*profile;
 if(type==='double'){
   const gap=Math.max(12, profile*.75), each=(sashW-gap)/2;
   out+=sashPanel(sashX,sashY,each,sashH);
   out+=rect(sashX+each,sashY,gap,sashH,'romchi-mullion','rx="3"');
   out+=sashPanel(sashX+each+gap,sashY,each,sashH);
 } else if(type==='triple'){
   const gap=Math.max(10, profile*.62), each=(sashW-2*gap)/3;
   for(let n=0;n<3;n++){
     if(n>0) out+=rect(sashX+n*each+(n-1)*gap,sashY,gap,sashH,'romchi-mullion','rx="3"');
     out+=sashPanel(sashX+n*(each+gap),sashY,each,sashH);
   }
 } else if(type==='door'){
   out+=sashPanel(sashX,sashY,sashW,sashH,'door');
 } else {
   out+=sashPanel(sashX,sashY,sashW,sashH);
 }
 // Opening direction, like mobile configurator technical drawings.
 const triArea=(()=>{
   if(type==='double'){
     const gap=Math.max(12, profile*.75), each=(sashW-gap)/2;
     return opening==='right'?{x:sashX+each+gap+sash, y:sashY+sash, w:each-2*sash, h:sashH-2*sash}:{x:sashX+sash, y:sashY+sash, w:each-2*sash, h:sashH-2*sash};
   }
   if(type==='triple'){
     const gap=Math.max(10, profile*.62), each=(sashW-2*gap)/3;
     const base=opening==='right'?sashX+2*(each+gap):sashX;
     return {x:base+sash, y:sashY+sash, w:each-2*sash, h:sashH-2*sash};
   }
   return {x:sashX+sash, y:sashY+sash, w:sashW-2*sash, h:sashH-2*sash};
 })();
 const t=triArea;
 if(opening==='left') out+=`<path class="romchi-opening" d="M ${t.x} ${t.y} L ${t.x} ${t.y+t.h} L ${t.x+t.w} ${t.y+t.h/2} Z"/>`;
 if(opening==='right') out+=`<path class="romchi-opening" d="M ${t.x+t.w} ${t.y} L ${t.x+t.w} ${t.y+t.h} L ${t.x} ${t.y+t.h/2} Z"/>`;
 if(opening==='tilt') out+=`<path class="romchi-opening" d="M ${t.x} ${t.y} L ${t.x+t.w} ${t.y} L ${t.x+t.w/2} ${t.y+t.h} Z"/>`;
 if(opening==='sliding') out+=`<path class="romchi-slide" d="M ${X+W*.18} ${Y+H+30} H ${X+W*.82}"/><path class="romchi-slide" d="M ${X+W*.82-16} ${Y+H+20} L ${X+W*.82} ${Y+H+30} L ${X+W*.82-16} ${Y+H+40}"/>`;
 const dimTop=hasShutter ? Y-SH-8 : Y;
 const dimY=Math.min(388,Y+H+34), dimTextY=Math.min(410,Y+H+58), dimX=Math.max(34,X-48);
 out+=line(X,dimY,X+W,dimY,'romchi-dim')+`<text class="romchi-dim-text" x="${X+W/2}" y="${dimTextY}" text-anchor="middle">${mmW} mm</text>`;
 out+=line(dimX,dimTop,dimX,Y+H,'romchi-dim')+`<text class="romchi-dim-text" transform="translate(${dimX-18} ${dimTop+(Y+H-dimTop)/2}) rotate(-90)" text-anchor="middle">${totalH} mm</text>`;
 if(hasShutter) out+=`<text class="romchi-note" x="${X+W+14}" y="${Y-SH/2-4}">grile</text><text class="romchi-note" x="${X+W+14}" y="${Y+18}">dritare ${windowMmH} mm</text>`;
 out+=`<text class="romchi-scale" x="24" y="398">Vizatim teknik proporcional • profile alumini • xham</text>`;
 svg.innerHTML=defs+out;
}

const remembered = localStorage.getItem(LS_AUTH);
if(remembered){ const u=users.find(x=>x.email===remembered && x.status==='approved'); if(u){ currentUser=u; activeOrder=loadDraftForUser(u); activeItemId = localStorage.getItem(LS_ACTIVE_ITEM_PREFIX + u.email) || activeOrder.items[0].id; showApp(); } else showLogin(); }
else showLogin();
