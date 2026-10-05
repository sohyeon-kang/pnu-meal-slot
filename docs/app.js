import { restaurants, DATA_DATE } from './data.js';
import { EMPTY_FILTERS, filterRestaurants, drawRestaurant, normalizeFilters, secureRandom, reviewVolume, hasStudentUseEvidence, isDrawEligible } from './engine.js';
import { pixelPaths } from './pixel-icons.js';
import { evidenceBadge, evidenceMarkup, sourceMarkup } from './evidence.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${pixelPaths[name]||pixelPaths.bowl}"/></svg>`;
const byId=new Map(restaurants.map(r=>[r.id,r]));
const storageKey='pnu-lucky-lunch-v1';
let saved={};try{saved=JSON.parse(localStorage.getItem(storageKey)||'{}')||{};}catch{}
let favorites=Array.isArray(saved.favorites)?[...new Set(saved.favorites.filter(id=>byId.has(id)))]:[];
let history=Array.isArray(saved.history)?saved.history.filter(h=>h&&byId.has(h.id)&&Number.isFinite(h.at)).slice(0,60):[];
let mealFilters=normalizeFilters(saved.filters&&typeof saved.filters==='object'?saved.filters:{});
let currentTab='draw',browseCuisine='전체',spinning=false,toastTimer,previousFocus,storageWarningShown=false;
let lastResult=null;
const cuisineIcons={한식:'bowl',양식:'fork',중식:'noodles',일식:'fish',아시안:'leaf',분식:'soup'};
const tasteIcons={매콤:'flame',달콤:'candy',담백:'leaf',진한:'soup'};
const mealIcons={밥:'bowl',면:'noodles',고기:'meat',빵:'bread',분식:'soup'};
const catalog=()=>restaurants;
const filters=()=>mealFilters;
const currentHistory=()=>history;
const label=()=>'점심';
const types=r=>[r.cuisine];
const art=r=>r.meals.includes('면')?'noodles':r.cuisine==='양식'&&r.meals.includes('빵')?'burger':'rice';
const mapUrl=r=>r.naverPlaceUrl||`https://map.naver.com/p/search/${encodeURIComponent(r.name+' 부산대')}`;
const candidates=()=>filterRestaurants(restaurants,filters(),favorites);
const mobileLayout=matchMedia('(max-width: 640px)');
function syncFilterLayout(){const panel=$('.filter-panel');if(mobileLayout.matches)$('#filter-sheet-content').append(panel);else{$('#filter-dialog').close();$('#filter-home').append(panel);}}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({favorites,history,filters:mealFilters}));}catch{if(!storageWarningShown){toast('저장 공간을 사용할 수 없어 이번 방문에서만 유지돼요.');storageWarningShown=true;}}}
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);}
function renderIcons(){ $$('[data-icon]').forEach(e=>e.outerHTML=icon(e.dataset.icon)); }
function ratingMarkup(r){
  if(!r.naverVerified)return '<span class="source-label">네이버 리뷰 미확인</span>';
  const stars=Number.isFinite(r.rating)?`<span class="naver-stars">${icon('star')} ${r.rating} <small>표시 별점</small></span>`:'';
  return stars+(Number.isInteger(r.reviewCount)?`<span class="naver-review">네이버 리뷰 <b>${r.reviewCount.toLocaleString('ko-KR')}</b>건</span>`:r.reviewCountText?`<span class="naver-review">네이버 리뷰 <b>${escape(r.reviewCountText)}</b></span>`:'<span class="source-label">네이버 지도에서 리뷰 확인</span>');
}
function renderFilterChips(){
  const f=filters();
  for(const [group,selector,options] of [['cuisines','#cuisine-chips',cuisineIcons],['tastes','#taste-chips',tasteIcons],['meals','#meal-chips',mealIcons]]){
    $(selector).innerHTML=Object.entries(options).map(([value,i])=>`<button class="chip ${(f[group]||[]).includes(value)?'selected':''}" data-filter="${group}" data-value="${value}" aria-pressed="${(f[group]||[]).includes(value)}">${icon(i)}${value}</button>`).join('');
  }
  $('#min-reviews').value=f.minReviews||0;
  $('#avoid-recent').checked=f.avoidRecent;$('#favorites-only').checked=f.favoritesOnly;$('#student-evidence-only').checked=f.studentEvidenceOnly;
}
function updateCount(){
  const count=candidates().length,f=filters();
  $('#candidate-count').textContent=count;$('.filter-summary').classList.toggle('empty',!count);
  $('#spin-button').disabled=spinning||!count;$('#lever').disabled=spinning||!count;
  if(!spinning){$('#spin-label').textContent=count?'맛집 뽑기!':'조건을 조금 바꿔볼까요?';$('#machine-status').innerHTML=count?`<span class="status-dot"></span>어떤 ${label()}을 만나게 될까요?`:'맞는 곳이 없어요. 필터를 줄이거나 초기화해주세요.';}
  $('#favorite-count').textContent=catalog().filter(r=>favorites.includes(r.id)).length;
  $('#launch-count').textContent=`${count}곳`;$('#apply-filters').textContent=`${count}곳에서 ${label()} 뽑기`;
  const selected=[...(f.cuisines||f.types||[]),...f.tastes,...(f.meals||[])];
  if(f.minReviews)selected.push(`리뷰 ${f.minReviews}건+`);if(f.studentEvidenceOnly)selected.push('학생 이용 자료');if(f.favoritesOnly)selected.push('찜한 곳만');
  $('#active-filter-summary').textContent=selected.length?selected.join(' · '):'아무거나 좋아!';
  $$('[data-total-count]').forEach(e=>e.textContent=catalog().length);$('#hero-counter').textContent=`${label()} ${catalog().filter(isDrawEligible).length}곳`;
}
function card(r){
  const isSaved=favorites.includes(r.id),tags=[...r.tastes,...r.meals];
  return `<article class="restaurant-card" data-id="${r.id}"><button class="favorite-button ${isSaved?'saved':''}" data-favorite="${r.id}" aria-label="${escape(r.name)} ${isSaved?'찜 취소':'찜하기'}" aria-pressed="${isSaved}">${icon('heart')}</button><button class="card-open" data-detail="${r.id}" aria-label="${escape(r.name)} 상세 보기"><span class="card-art ${art(r)==='noodles'?'green':art(r)==='rice'?'pink':''}"><img src="./assets/${art(r)}.svg" alt="" loading="lazy"></span><span class="card-content"><span class="card-category">${escape(types(r)[0])}<span>·</span>${escape(r.area)}</span><h3>${escape(r.name)}</h3><span class="card-menu">${escape(r.menu)}</span><span class="card-rating">${ratingMarkup(r)}</span></span></button><div class="card-tags">${evidenceBadge(r)}${tags.slice(0,3).map(t=>`<span class="tag ${t==='매콤'?'spicy':''}">#${escape(t)}</span>`).join('')}</div></article>`;
}
function toggleFavorite(id){
  if(!byId.has(id))return;const existed=favorites.includes(id);favorites=existed?favorites.filter(x=>x!==id):[...favorites,id];persist();updateCount();if(currentTab!=='draw')renderCollection();
  $$(`[data-favorite="${id}"]`).forEach(b=>{b.classList.toggle('saved',!existed);b.setAttribute('aria-pressed',String(!existed));b.setAttribute('aria-label',`${byId.get(id).name} ${existed?'찜하기':'찜 취소'}`);if(b.classList.contains('result-save'))b.innerHTML=icon('heart')+(existed?'찜하기':'찜했어요');});toast(existed?'찜 목록에서 지웠어요.':'찜 목록에 쏙 담았어요!');
}
function switchTab(tab,scroll=true){
  if(spinning)return;currentTab=['draw','browse','favorites'].includes(tab)?tab:'draw';document.body.dataset.view=currentTab;
  $$('.nav-item').forEach(b=>{b.classList.toggle('active',b.dataset.tab===currentTab);if(b.dataset.tab===currentTab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  $('#draw-view').classList.toggle('hidden',currentTab!=='draw');$('#browse-view').classList.toggle('hidden',currentTab==='draw');if(currentTab!=='draw')renderCollection();
  const hash=currentTab;if(location.hash!==`#${hash}`)window.history.replaceState(null,'',`#${hash}`);
  if(scroll){window.scrollTo({top:0,behavior:'smooth'});$('#collection-cards').scrollTop=0;}
}
function renderCollection(){
  const onlySaved=currentTab==='favorites';
  $('#collection-title').innerHTML=onlySaved?'찜한 맛집 모음<span>.</span>':'부산대 맛집 도감<span>.</span>';
  $('#collection-subtitle').textContent=`${catalog().length}곳 · ${label()} 뽑기 ${catalog().filter(isDrawEligible).length}곳. 학생 이용 근거는 상세에서 확인해요.`;
  const options=Object.keys(cuisineIcons);
  $('#browse-cuisines').innerHTML=['전체',...options].map(c=>`<button class="chip ${browseCuisine===c?'selected':''}" data-browse-cuisine="${c}" aria-pressed="${browseCuisine===c}">${c}</button>`).join('');
  const query=$('#search').value.replace(/\s/g,'').toLocaleLowerCase('ko');
  let list=catalog().filter(r=>(!onlySaved||favorites.includes(r.id))&&(browseCuisine==='전체'||types(r).includes(browseCuisine))&&(!$('#browse-student-only').checked||hasStudentUseEvidence(r))&&(!query||`${r.name} ${(r.aliases||[]).join(' ')} ${r.menu} ${types(r).join(' ')} ${r.tastes.join(' ')}`.replace(/\s/g,'').toLocaleLowerCase('ko').includes(query)));
  const sort=$('#sort').value;if(sort==='reviews')list.sort((a,b)=>(reviewVolume(b)??-1)-(reviewVolume(a)??-1));if(sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
  $('#collection-count').textContent=`${list.length}곳 ${onlySaved?'찜해두었어요':'모아두었어요'}`;$('#collection-cards').innerHTML=list.map(card).join('');$('#collection-empty').classList.toggle('hidden',list.length!==0);
  const hasSaved=catalog().some(r=>favorites.includes(r.id));$('#collection-empty p').textContent=onlySaved&&!hasSaved?'카드의 하트를 눌러 나만의 목록을 만들어봐요.':'검색어나 종류, 학생 이용 자료 조건을 바꿔보세요.';$('#empty-action').textContent=onlySaved&&!hasSaved?'도감 둘러보기':'검색 조건 지우기';
}
function defaultReels(){return [{image:'rice',label:'든든한 밥'},{image:'noodles',label:'후루룩 면'},{image:'burger',label:'행복한 한 입'}];}
function setReels(items=defaultReels()){$('#reels').innerHTML=items.map(x=>`<div class="reel"><div class="reel-content"><img src="./assets/${x.image}.svg" alt=""><span class="reel-label">${escape(x.label)}</span></div></div>`).join('');}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function spin(){
  if(spinning)return;const pool=candidates(),f=filters();const result=drawRestaurant(pool,currentHistory().slice(0,5).map(h=>h.id),f.avoidRecent,secureRandom);
  if(!result){toast('조건에 맞는 곳이 없어요. 필터를 바꿔주세요.');return;}
  spinning=true;$('#result-dialog').close();const locked=$$('.filter-panel button,.filter-panel input,.filter-panel select,.nav-item,#history-button,#open-filters');locked.forEach(x=>x.disabled=true);$('#spin-button').disabled=true;$('#lever').disabled=true;
  $('#spin-label').textContent='맛있는 운명 찾는 중…';$('#machine-status').textContent=`${pool.length}곳 중 오늘의 ${label()}을 고르고 있어요`;$('#machine').classList.add('spinning');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{
    const reelArt=defaultReels().map(r=>r.image);
    if(!reduced)for(let i=0;i<12;i++){setReels([0,1,2].map((_,j)=>({image:reelArt[(i+j)%3],label:['두근두근','맛있는 우연','오늘은 여기!'][(i+j)%3]})));await sleep(110+i*5);}else await sleep(100);
    const r=result.restaurant;$('#machine').classList.remove('spinning');setReels([{image:art(r),label:types(r)[0]},{image:art(r),label:r.tastes[0]},{image:art(r),label:r.meals[0]}]);
    history=[{id:r.id,at:Date.now()},...history].slice(0,60);lastResult=r;persist();await sleep(reduced?0:220);showDetail(r.id,true,result.recycled);if(!reduced)celebrate();
  }finally{spinning=false;$('#machine').classList.remove('spinning');locked.forEach(x=>x.disabled=false);updateCount();$('#machine-status').textContent=lastResult?`오늘의 ${label()}은 ${lastResult.name}!`:'다시 뽑아볼까요?';}
}
function showDialog(id){previousFocus=document.activeElement;$(id).showModal();}
function showDetail(id,fromDraw=false,recycled=false){
  const r=byId.get(id);if(!r)return;const isSaved=favorites.includes(id),tags=[r.cuisine,...r.tastes,...r.meals],hours=r.lunchHours;
  $('#result-content').innerHTML=`<button class="dialog-close" data-close="result-dialog" aria-label="닫기">×</button><div class="result-top"><p class="result-eyebrow">${fromDraw?'MISSION COMPLETE!':'FOOD PLANET DISCOVERED'}</p><img src="./assets/${art(r)}.svg" alt="음식을 든 귀여운 도트 원숭이"></div><div class="result-content"><p class="result-label">${fromDraw?'맛집 탐사 성공!':escape(r.area)}</p><h2 id="result-title">${escape(r.name)}</h2><p class="result-menu">${escape(r.menu)}</p><div class="result-rating">${ratingMarkup(r)}</div><div class="result-tags">${tags.map(t=>`<span class="tag">${escape(t)}</span>`).join('')}</div>${r.note?`<p class="result-note">${escape(r.note)}</p>`:''}<p class="result-address">${escape(r.address)}</p><p class="result-hours">${hours?`영업 참고 · ${escape(hours)}`:'영업시간은 네이버 지도에서 확인해주세요.'}</p>${r.menuEvidenceType==='review'?'<p class="result-hours">메뉴는 네이버 리뷰를 참고했어요.</p>':''}${recycled?'<p class="recycled-note">맞는 곳을 모두 최근에 뽑아서 전체 후보에서 다시 골랐어요.</p>':''}${evidenceMarkup(r)}${sourceMarkup(r,mapUrl(r),DATA_DATE)}<div class="result-actions"><a class="primary-button" href="${escape(mapUrl(r))}" target="_blank" rel="noopener noreferrer">${icon('pin')}네이버 지도에서 찾기</a><button class="secondary-button result-save ${isSaved?'saved':''}" data-favorite="${id}" aria-pressed="${isSaved}" aria-label="${escape(r.name)} ${isSaved?'찜 취소':'찜하기'}">${icon('heart')}${isSaved?'찜했어요':'찜하기'}</button></div><div class="result-bottom">${fromDraw?`<button class="text-button" id="spin-again">${icon('shuffle')}한 번 더 뽑기</button>`:''}<button class="text-button" data-close="result-dialog">${fromDraw?'좋아, 오늘은 여기!':'닫기'}</button></div></div>`;
  $('#result-dialog').setAttribute('aria-labelledby','result-title');if(!$('#result-dialog').open)showDialog('#result-dialog');
}
function celebrate(){const colors=['#ff96c5','#ffe68a','#c4ec89','#c5b1ee'];$('#confetti').innerHTML=Array.from({length:30},(_,i)=>`<i style="background:${colors[i%4]};--x:${(secureRandom()-.5)*750}px;--y:${100+secureRandom()*550}px;--r:${secureRandom()*900}deg;animation-delay:${secureRandom()*.2}s"></i>`).join('');setTimeout(()=>$('#confetti').replaceChildren(),2200);}
function showHistory(){
  const entries=currentHistory();$('#info-content').innerHTML=`<p class="eyebrow">FOOD EXPLORATION LOG</p><h2 id="info-title">최근 뽑은 ${label()}</h2>${entries.length?`<div class="history-list">${entries.map(h=>{const r=byId.get(h.id);return `<button class="history-row" data-history-detail="${r.id}"><img src="./assets/${art(r)}.svg" alt=""><span><strong>${escape(r.name)}</strong><small>${new Intl.DateTimeFormat('ko-KR',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'}).format(h.at)}</small></span></button>`;}).join('')}</div><button class="text-button" id="clear-history" style="margin-top:20px">${label()} 기록 지우기</button>`:'<p>아직 기록이 없어요. 슬롯으로 첫 번째 장소를 만나보세요!</p>'}`;$('#info-dialog').setAttribute('aria-labelledby','info-title');if(!$('#info-dialog').open)showDialog('#info-dialog');
}
function showAbout(){
  const verified=restaurants.filter(r=>r.naverVerified).length;
  $('#info-content').innerHTML=`<p class="eyebrow">FOOD PLANET GUIDE</p><h2 id="info-title">우리의 탐사 기준</h2><p>식당 도감 ${restaurants.length}곳, 점심 뽑기 ${restaurants.filter(isDrawEligible).length}곳입니다. 취향에 맞는 식당을 뽑고 마음에 드는 곳을 찜해두세요.</p><h3>부산대 정문 생활권</h3><p>정문 도보 7~10분 생활권을 목표로 모았습니다. 실제 개별 보행 시간은 미측정이며 역 방향 식당은 상세 화면에서 안내합니다. 저녁 영업과 점심 미확인 식당은 점심 뽑기에서 제외하고, 밥집오빠는 수록하지 않습니다.</p><h3>기존 식당도 학생 이용을 조사했어요</h3><p>식당별 학생 방문 후기·부산대 커뮤니티·학교 자료를 검토하고 확인일과 출처를 남겼습니다. ‘학생 이용 자료’는 학생 이용을 명시한 기록, ‘간접 자료’는 추천·제휴 등 보조 근거, ‘학생 이용 미확인’은 적절한 자료를 찾지 못한 경우예요. 미확인은 학생이 방문하지 않는다는 뜻이 아닙니다.</p><p>학생 이용 자료 필터는 명시적인 이용 근거가 있는 곳만 보여줍니다. 과거 자료도 포함하며 현재 방문 빈도나 인기 순위를 증명하지 않아요. 카드 상세에서 근거 날짜와 한계를 확인해주세요.</p><h3>네이버 별점과 리뷰</h3><p>기존 ${verified}곳은 네이버 장소 정보를 직접 확인했습니다. 미확인 식당의 별점·리뷰 수는 비워 두며 다른 플랫폼 값으로 대체하지 않습니다. 공개 메뉴·영업 자료와 학생 이용 출처는 상세 화면에 구분해서 표시합니다. 네이버 지도 링크를 열 때 API 요금은 발생하지 않아요.</p><p>리뷰 수는 평점·학생 인기 순위가 아니며 별점은 남아 있는 과거 표시값입니다. 1.1만 같은 건수는 표시를 유지하고 필터에 근삿값을 사용합니다. 리뷰 수 조건을 고르면 미확인 식당은 제외돼요.</p><h3>뽑기와 저장</h3><p>같은 항목 안에서는 하나라도, 서로 다른 항목에서는 모두 맞는 곳을 고릅니다. 후보별 뽑힐 확률은 같습니다. 최근 5곳 제외가 가능하고 모두 뽑았으면 전체 후보로 돌아갑니다. 찜·취향·최근 기록은 이 브라우저에 저장됩니다.</p>`;
  $('#info-dialog').setAttribute('aria-labelledby','info-title');showDialog('#info-dialog');
}
document.addEventListener('click',e=>{
  const button=e.target.closest('button,a');if(!button)return;
  if(button.dataset.close){$(`#${button.dataset.close}`).close();return;}
  if(button.dataset.favorite){toggleFavorite(button.dataset.favorite);return;}
  if(button.dataset.detail){showDetail(button.dataset.detail);return;}
  if(button.dataset.historyDetail){$('#info-dialog').close();showDetail(button.dataset.historyDetail);return;}
  if(button.dataset.tab){switchTab(button.dataset.tab);return;}
  if(button.classList.contains('brand')){e.preventDefault();switchTab('draw');return;}
  if(button.dataset.filter&&!spinning){const {filter,value}=button.dataset,f=filters();if(!Array.isArray(f[filter]))return;f[filter]=f[filter].includes(value)?f[filter].filter(x=>x!==value):[...f[filter],value];renderFilterChips();updateCount();persist();return;}
  if(button.dataset.browseCuisine){browseCuisine=button.dataset.browseCuisine;renderCollection();return;}
  switch(button.id){
    case 'open-filters':showDialog('#filter-dialog');break;
    case 'apply-filters':$('#filter-dialog').close();break;
    case 'reset-filters':mealFilters=normalizeFilters(EMPTY_FILTERS);renderFilterChips();updateCount();persist();toast(`${label()} 취향을 초기화했어요.`);break;
    case 'spin-button':case 'lever':case 'spin-again':void spin();break;
    case 'collection-draw':switchTab('draw');break;
    case 'history-button':showHistory();break;
    case 'about-button':showAbout();break;
    case 'clear-history':history=[];persist();showHistory();toast(`${label()} 기록을 지웠어요.`);break;
    case 'empty-action':$('#search').value='';browseCuisine='전체';$('#browse-student-only').checked=false;if(currentTab==='favorites'&&!catalog().some(r=>favorites.includes(r.id)))switchTab('browse');else renderCollection();break;
  }
});
$('#min-reviews').addEventListener('change',e=>{mealFilters.minReviews=Number(e.target.value);persist();updateCount();});
for(const [id,key] of [['avoid-recent','avoidRecent'],['favorites-only','favoritesOnly'],['student-evidence-only','studentEvidenceOnly']])$('#'+id).addEventListener('change',e=>{filters()[key]=e.target.checked;persist();updateCount();});
$('#search').addEventListener('input',renderCollection);$('#sort').addEventListener('change',renderCollection);$('#browse-student-only').addEventListener('change',renderCollection);
window.addEventListener('hashchange',()=>switchTab(location.hash.slice(1),false));
$$('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});d.addEventListener('close',()=>{if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});});});
renderIcons();syncFilterLayout();mobileLayout.addEventListener('change',syncFilterLayout);$$('.bulbs').forEach(e=>e.innerHTML='<i></i>'.repeat(12));renderFilterChips();setReels();updateCount();switchTab(location.hash.slice(1),false);
