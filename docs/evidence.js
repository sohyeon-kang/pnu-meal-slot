const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function evidenceBadge(r) {
  return r.lunchEligible === false ? '<span class="evidence-badge evening">점심 뽑기 제외</span>' : '';
}
export function evidenceMarkup(r) {
  const exclusion = r.lunchEligible === false ? `<p class="evidence-callout">${escape(r.drawExclusionReason || '점심 영업을 확인하지 못해 점심 뽑기에서는 제외했어요.')}</p>` : '';
  const location = r.locationNote ? `<p>${escape(r.locationNote)}</p>` : '';
  return exclusion || location ? `<div class="restaurant-evidence">${exclusion}${location}</div>` : '';
}
export function sourceMarkup(mapUrl) {
  return `<div class="result-source"><a href="${escape(mapUrl)}" target="_blank" rel="noopener noreferrer">네이버 지도·리뷰 보기 ↗</a></div>`;
}
export function hoursMarkup(hours) {
  if (!hours) return '영업시간은 네이버 지도에서 확인해주세요.';
  const lines = String(hours)
    .replace(/안내된/g,'표기된').replace(/안내에서/g,'자료에서').replace(/안내와/g,'표기와').replace(/안내가/g,'표기가').replace(/\s*안내/g,'')
    .split(/\s+\/\s+|[;\n]+|\.\s+(?=\S)/)
    .map(line=>line.trim().replace(/[.。]+$/,'').trim()).filter(Boolean);
  return lines.map((line,i)=>`<span class="hours-line">${i===0?'영업 참고 · ':''}${escape(line)}</span>`).join('');
}
