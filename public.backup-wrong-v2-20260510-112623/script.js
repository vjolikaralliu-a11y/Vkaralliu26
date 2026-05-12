const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
let state={width:1500,height:1600,layout:'single',opening:'left',systemType:'opening',series:'VLA625'};
const typologies=[
 ['transom3','wide'],['triple','wide'],['centerDoor','wide'],['double','wide'],
 ['double',''],['leftTransom',''],['rightTransom',''],['topBottom','tall'],
 ['topWide',''],['grid2',''],['tripleTall','wide'],['tripleMix','wide'],
 ['four','wide'],['five','wide'],['transom4','wide'],['transom3b','wide'],
 ['door','tall'],['doorBottom','tall'],['doubleTall','tall'],['singleTop','tall']
];
function go(name){$$('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===name)); if(name==='editor') drawEditor();}
$$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
function mini(layout,cls=''){
 const rows={transom3:[3,3],triple:[3],centerDoor:[3,3],double:[2],leftTransom:[2,2],rightTransom:[2,2],topBottom:[1,1],topWide:[1,2],grid2:[2,2],tripleTall:[3],tripleMix:[3,3],four:[4],five:[5],transom4:[4,4],transom3b:[3,3],door:[1],doorBottom:[1,1],doubleTall:[2],singleTop:[1,1],single:[1]}[layout]||[1];
 return `<div class="mini-window ${cls}">${rows.map((n,ri)=>`<div class="pane-row" style="grid-template-columns:repeat(${n},1fr);${ri===0&&rows.length>1?'height:28%':''}">${Array.from({length:n}).map((_,i)=>`<div class="pane ${ri===rows.length-1&&layout.includes('Bottom')?'blank':''}"></div>`).join('')}</div>`).join('')}</div>`;
}
function renderTypologies(){const box=$('[data-typology-groups]'); box.innerHTML=''; for(let i=0;i<typologies.length;i+=4){const row=document.createElement('div'); row.className='typo-row'; typologies.slice(i,i+4).forEach(([id,cls])=>{const b=document.createElement('button'); b.className='typo-btn'; b.innerHTML=mini(id,cls); b.onclick=()=>{state.layout=id; go('editor')}; row.appendChild(b)}); box.appendChild(row)} $('[data-big-preview]').innerHTML=mini('single','wide');}
renderTypologies();
$$('[data-layout]').forEach(b=>b.onclick=()=>{state.layout=b.dataset.layout; drawEditor();});
$$('[data-open]').forEach(b=>b.onclick=()=>{state.opening=b.dataset.open; drawEditor();});
$('[data-dim-form]').addEventListener('input',e=>{state[e.target.name]=['width','height'].includes(e.target.name)?Number(e.target.value):e.target.value; drawEditor();});
function drawEditor(){const svg=$('[data-editor-svg]'); if(!svg)return; const W=360,H=Math.max(120,Math.min(420,state.height/state.width*360)); const X=95,Y=130; let g=''; const rows={topWide:[1,2],topBottom:[1,1],transom3:[3,3],transom4:[4,4],transom3b:[3,3],grid2:[2,2],doorBottom:[1,1],singleTop:[1,1],triple:[3],double:[2],four:[4],five:[5],tripleTall:[3],tripleMix:[3,3],centerDoor:[3,3],leftTransom:[2,2],rightTransom:[2,2],doubleTall:[2],door:[1],single:[1]}[state.layout]||[1]; g+=`<rect class="frame" x="${X}" y="${Y}" width="${W}" height="${H}"/>`; const pad=18; let cy=Y+pad; rows.forEach((n,ri)=>{let rh=rows.length>1?(ri===0?H*.25:H*.75-pad*1.5):H-2*pad; const cw=(W-2*pad)/n; for(let i=0;i<n;i++){let x=X+pad+i*cw,y=cy,w=cw-4,h=rh-4; const blank=(ri>0&&(state.layout.includes('Bottom')||state.layout==='centerDoor')&&i===Math.floor(n/2)); g+=`<rect class="inner ${blank?'blank':''}" x="${x}" y="${y}" width="${w}" height="${h}"/>`; } cy+=rh+6;});
 const ox=X+pad, oy=Y+pad, ow=W-2*pad, oh=H-2*pad; if(state.opening==='left')g+=`<path class="open-line" d="M ${ox} ${oy} L ${ox} ${oy+oh} L ${ox+ow} ${oy+oh/2} Z"/>`; if(state.opening==='right')g+=`<path class="open-line" d="M ${ox+ow} ${oy} L ${ox+ow} ${oy+oh} L ${ox} ${oy+oh/2} Z"/>`; if(state.opening==='tilt')g+=`<path class="open-line" d="M ${ox} ${oy} L ${ox+ow} ${oy} L ${ox+ow/2} ${oy+oh} Z"/>`; g+=`<line class="dim" x1="${X}" y1="${Y+H+44}" x2="${X+W}" y2="${Y+H+44}"/><text class="dim-text" x="${X+W/2-36}" y="${Y+H+76}">${state.width}</text><line class="dim" x1="${X-50}" y1="${Y}" x2="${X-50}" y2="${Y+H}"/><text class="dim-text" transform="translate(${X-70} ${Y+H/2+35}) rotate(-90)">${state.height}</text>`; svg.innerHTML=g;}
$('[data-save-order]').onclick=()=>alert('Demo: këtu do ruhet porosia/projekti në databazë.');
drawEditor();
