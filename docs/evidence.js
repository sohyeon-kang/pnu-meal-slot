const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl = value => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };
export function evidenceBadge(r) {
  const status = r.studentEvidenceLevel || 'unknown';
  const label = {direct:'학생 이용 자료',weak:'간접 자료',unknown:'학생 이용 미확인'}[status];
  const special = r.lunchEligible === false ? '<span class="evidence-badge evening">점심 뽑기 제외</span>' : '';
  return special + `<span class="student-status ${status}">${label}</span>`;
}
export function evidenceMarkup(r) {
  const exclusion = r.lunchEligible === false ? `<p class="evidence-callout">${escape(r.drawExclusionReason || '점심 영업을 확인하지 못해 점심 뽑기에서는 제외했어요.')}</p>` : '';
  const location = r.locationNote ? `<p>${escape(r.locationNote)}</p>` : '';
  const student = r.studentEvidenceSummary || '학생들의 실제 방문 빈도는 확인하지 못했어요. 리뷰 수만으로 학생 인기 맛집이라고 판단하지 않습니다.';
  const links = (r.evidence || []).filter(e => safeUrl(e.url)).map(e => `<li><a href="${escape(safeUrl(e.url))}" target="_blank" rel="noopener noreferrer">${escape(e.title || '확인 자료')} ↗</a>${e.date ? ` <small>${escape(e.date)}</small>` : ''}<p>${escape(e.summary)}</p></li>`).join('');
  const checked = r.studentCheckedAt ? `<p class="evidence-date">학생 이용 자료 조사 · ${escape(r.studentCheckedAt)}<br>과거 이용 자료 포함 · 현재 인기 순위가 아닙니다.</p>` : '';
  return `<div class="restaurant-evidence">${exclusion}${location}${evidenceBadge(r)}<details><summary>학생 방문 근거와 출처</summary><p>${escape(student)}</p>${checked}${links ? `<ul>${links}</ul>` : ''}</details></div>`;
}
export function sourceMarkup(r, mapUrl, checkedAt) {
  const status = r.naverVerified
    ? `네이버 장소 정보 · ${escape(checkedAt)} 확인`
    : '네이버 별점·리뷰 수는 아직 미확인입니다. 메뉴·영업 참고 정보의 출처는 위에서 확인할 수 있어요.';
  return `<div class="result-source"><a href="${escape(mapUrl)}" target="_blank" rel="noopener noreferrer">네이버 지도·리뷰 보기 ↗</a><br>${status}<br>휴무·메뉴·정문 출발 도보 경로는 방문 전에 확인해주세요.</div>`;
}
