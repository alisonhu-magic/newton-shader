/* ---------- init ---------- */
(function bootFromQuery(){
  const q = new URLSearchParams(location.search);
  if(q.get('embed') === '1') document.body.classList.add('embed');
    const w = parseInt(q.get('w'), 10), h = parseInt(q.get('h'), 10);
    if(Number.isFinite(w) && w > 0) S.canvasW = clampDim(w);
    if(Number.isFinite(h) && h > 0) S.canvasH = clampDim(h);
    if(q.get('pause') === '1') S.paused = 1;
    const brand = q.get('brand');
    if(brand) applyBrand(brand, { resetColors:true });
})();
applyRatioScale();
syncSliders(); renderPalette(); applyMask(); meta(); initGridLogo(); initText(); syncMaskToAlign();
bakeFieldThumbs();
if(S.paused) setPaused(true);
