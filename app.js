const PARTS = [
  {
    id: "head",
    label: "Head",
    fill: "#ffc72c",
    target: { x: 50, y: 21.67 },
    size: { w: 26.2, h: 17.55 },
    z: 7,
  },
  {
    id: "neck",
    label: "Neck",
    fill: "#ffc72c",
    target: { x: 50, y: 28.2 },
    size: { w: 12.8, h: 6.5 },
    z: 5,
  },
  {
    id: "torso",
    label: "Torso",
    fill: "#d80c17",
    target: { x: 50, y: 38.2 },
    size: { w: 35.5, h: 18.2 },
    z: 6,
  },
  {
    id: "left-arm",
    label: "Left Arm",
    fill: "#d80c17",
    target: { x: 36.9, y: 38.8 },
    size: { w: 11.8, h: 24.8 },
    z: 8,
  },
  {
    id: "right-arm",
    label: "Right Arm",
    fill: "#d80c17",
    target: { x: 63.1, y: 38.8 },
    size: { w: 11.8, h: 24.8 },
    z: 8,
  },
  {
    id: "left-hand",
    label: "Left Hand",
    fill: "#ffc72c",
    target: { x: 35.2, y: 48.7 },
    size: { w: 11.2, h: 9.8 },
    z: 9,
  },
  {
    id: "right-hand",
    label: "Right Hand",
    fill: "#ffc72c",
    target: { x: 64.8, y: 48.7 },
    size: { w: 11.2, h: 9.8 },
    z: 9,
  },
  {
    id: "hips",
    label: "Hips",
    fill: "#1f5ca8",
    target: { x: 50, y: 51.2 },
    size: { w: 35.5, h: 9.2 },
    z: 2,
  },
  {
    id: "left-leg",
    label: "Left Leg",
    fill: "#1f5ca8",
    target: { x: 43.4, y: 62.9 },
    size: { w: 13.2, h: 20.8 },
    z: 1,
  },
  {
    id: "right-leg",
    label: "Right Leg",
    fill: "#1f5ca8",
    target: { x: 56.6, y: 62.9 },
    size: { w: 13.2, h: 20.8 },
    z: 1,
  },
];

const SUGGESTED_ORDER = PARTS.map((part) => part.id);
const SNAP_RADIUS = 58;

const state = {
  placed: new Set(),
  drag: null,
  lastPlacedId: null,
  surfaceRect: null,
};

const buildSurface = document.querySelector("#build-surface");
const ghostLayer = document.querySelector("#ghost-layer");
const placedLayer = document.querySelector("#placed-layer");
const binGrid = document.querySelector("#bin-grid");
const progressText = document.querySelector("#progress-text");
const progressFill = document.querySelector("#progress-fill");
const hintText = document.querySelector("#hint-text");
const celebrationBanner = document.querySelector("#celebration-banner");
const resetButton = document.querySelector("#reset-button");

function init() {
  renderBins();
  renderGhostLayer();
  renderPlacedPieces();
  updateProgress();
  window.addEventListener("resize", onResize);
  resetButton.addEventListener("click", resetBuild);
}

function onResize() {
  state.surfaceRect = buildSurface.getBoundingClientRect();
  renderGhostLayer();
  renderPlacedPieces();
}

function resetBuild() {
  state.placed.clear();
  state.lastPlacedId = null;
  celebrationBanner.classList.remove("is-visible");
  if (state.drag) {
    state.drag.node.remove();
    state.drag = null;
  }
  renderBins();
  renderGhostLayer();
  renderPlacedPieces();
  updateProgress();
}

function renderBins() {
  binGrid.innerHTML = "";
  PARTS.forEach((part) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "bin-card";
    card.dataset.partId = part.id;
    if (state.placed.has(part.id)) {
      card.classList.add("is-placed");
      card.disabled = true;
    } else {
      card.addEventListener("pointerdown", (event) => startDrag(event, part));
    }

    const preview = document.createElement("div");
    preview.className = "bin-preview";
    preview.appendChild(createPieceSvg(part.id, part.fill));

    const label = document.createElement("div");
    label.className = "bin-card-label";
    label.textContent = part.label;

    const status = document.createElement("div");
    status.className = "bin-card-status";
    status.textContent = state.placed.has(part.id) ? "Placed" : "Drag to board";

    card.append(preview, label, status);
    binGrid.appendChild(card);
  });
}

function renderGhostLayer() {
  ghostLayer.innerHTML = "";
  state.surfaceRect = buildSurface.getBoundingClientRect();
  const suggestedId = SUGGESTED_ORDER.find((partId) => !state.placed.has(partId));

  PARTS.forEach((part) => {
    const node = document.createElement("div");
    node.className = "ghost-piece";
    node.dataset.partId = part.id;
    if (suggestedId === part.id) {
      node.classList.add("is-suggested");
    }
    positionNode(node, part);
    node.appendChild(createPieceSvg(part.id, "rgba(52, 73, 94, 0.16)", true));
    if (state.placed.has(part.id)) {
      node.style.opacity = "0.12";
    }
    ghostLayer.appendChild(node);
  });
}

function renderPlacedPieces() {
  placedLayer.innerHTML = "";
  PARTS.filter((part) => state.placed.has(part.id)).forEach((part) => {
    const node = document.createElement("div");
    node.className = "placed-piece";
    positionNode(node, part);
    node.appendChild(createPieceSvg(part.id, part.fill));
    placedLayer.appendChild(node);
    if (state.lastPlacedId === part.id) {
      requestAnimationFrame(() => node.classList.add("just-snapped"));
    }
  });
  state.lastPlacedId = null;
}

function positionNode(node, part) {
  node.style.width = `${part.size.w}%`;
  node.style.height = `${part.size.h}%`;
  node.style.left = `${part.target.x - part.size.w / 2}%`;
  node.style.top = `${part.target.y - part.size.h / 2}%`;
  node.style.zIndex = String(part.z ?? 1);
}

function startDrag(event, part) {
  if (state.drag || state.placed.has(part.id)) {
    return;
  }

  event.preventDefault();
  state.surfaceRect = buildSurface.getBoundingClientRect();

  const dragNode = document.createElement("div");
  dragNode.className = "drag-piece";
  dragNode.style.width = `${Math.max(74, state.surfaceRect.width * (part.size.w / 100))}px`;
  dragNode.style.height = `${Math.max(74, state.surfaceRect.height * (part.size.h / 100))}px`;
  dragNode.appendChild(createPieceSvg(part.id, part.fill));
  document.body.appendChild(dragNode);

  const dragRect = dragNode.getBoundingClientRect();
  state.drag = {
    id: part.id,
    node: dragNode,
    width: dragRect.width,
    height: dragRect.height,
    offsetX: dragRect.width / 2,
    offsetY: dragRect.height / 2,
  };

  moveDrag(event.clientX, event.clientY);

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp, { once: true });
}

function onPointerMove(event) {
  if (!state.drag) {
    return;
  }
  moveDrag(event.clientX, event.clientY);
}

function moveDrag(clientX, clientY) {
  if (!state.drag) {
    return;
  }

  const { node, offsetX, offsetY } = state.drag;
  node.style.left = `${clientX - offsetX}px`;
  node.style.top = `${clientY - offsetY}px`;
  highlightSuggestedTarget(clientX, clientY);
}

function onPointerUp(event) {
  window.removeEventListener("pointermove", onPointerMove);
  clearGhostHighlights();

  if (!state.drag) {
    return;
  }

  const part = PARTS.find((item) => item.id === state.drag.id);
  const targetCenter = getTargetCenter(part);
  const dragCenter = {
    x: event.clientX,
    y: event.clientY,
  };
  const distance = Math.hypot(dragCenter.x - targetCenter.x, dragCenter.y - targetCenter.y);
  const threshold = Math.max(
    SNAP_RADIUS,
    Math.min(state.surfaceRect.width, state.surfaceRect.height) * 0.08
  );

  state.drag.node.remove();
  state.drag = null;

  if (distance <= threshold) {
    state.placed.add(part.id);
    state.lastPlacedId = part.id;
    renderBins();
    renderGhostLayer();
    renderPlacedPieces();
    updateProgress();
    if (state.placed.size === PARTS.length) {
      celebrationBanner.classList.add("is-visible");
    }
  }
}

function getTargetCenter(part) {
  return {
    x: state.surfaceRect.left + (part.target.x / 100) * state.surfaceRect.width,
    y: state.surfaceRect.top + (part.target.y / 100) * state.surfaceRect.height,
  };
}

function highlightSuggestedTarget(clientX, clientY) {
  clearGhostHighlights();
  const partId = state.drag?.id;
  if (!partId) {
    return;
  }

  const ghost = ghostLayer.querySelector(`[data-part-id="${partId}"]`);
  if (!ghost || state.placed.has(partId)) {
    return;
  }

  const part = PARTS.find((item) => item.id === partId);
  const targetCenter = getTargetCenter(part);
  const distance = Math.hypot(clientX - targetCenter.x, clientY - targetCenter.y);
  const threshold = Math.max(
    SNAP_RADIUS,
    Math.min(state.surfaceRect.width, state.surfaceRect.height) * 0.09
  );

  if (distance <= threshold * 1.2) {
    ghost.classList.add("is-suggested");
  }
}

function clearGhostHighlights() {
  ghostLayer.querySelectorAll(".ghost-piece").forEach((node) => {
    const suggestedId = SUGGESTED_ORDER.find((partId) => !state.placed.has(partId));
    node.classList.toggle("is-suggested", node.dataset.partId === suggestedId);
  });
}

function updateProgress() {
  const placedCount = state.placed.size;
  const suggestedId = SUGGESTED_ORDER.find((partId) => !state.placed.has(partId));
  const suggestedPart = PARTS.find((part) => part.id === suggestedId);
  progressText.textContent = `${placedCount} / ${PARTS.length} pieces placed`;
  progressFill.style.width = `${(placedCount / PARTS.length) * 100}%`;
  hintText.textContent = suggestedPart
    ? `Suggested next piece: ${suggestedPart.label}`
    : "Every piece is in place. Nice work.";
}

function createPieceSvg(partId, fill, isGhost = false) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = partSvgMarkup(partId, fill, isGhost).trim();
  return wrapper.firstElementChild;
}

function partSvgMarkup(partId, fill, isGhost) {
  const stroke = isGhost ? "rgba(31, 36, 48, 0.15)" : "rgba(12, 18, 32, 0.08)";
  switch (partId) {
    case "head":
      return `
        <svg class="piece-svg" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="headGrad" x1="12%" y1="8%" x2="88%" y2="100%">
              <stop offset="0%" stop-color="#ffe37a" />
              <stop offset="52%" stop-color="#ffc72c" />
              <stop offset="100%" stop-color="#e1a000" />
            </linearGradient>
            <radialGradient id="headGlow" cx="34%" cy="22%" r="64%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.62" />
              <stop offset="58%" stop-color="#ffffff" stop-opacity="0.12" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
            </radialGradient>
            <linearGradient id="headEdgeShade" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stop-color="#000000" stop-opacity="0.02" />
              <stop offset="72%" stop-color="#000000" stop-opacity="0" />
              <stop offset="100%" stop-color="#000000" stop-opacity="0.12" />
            </linearGradient>
          </defs>
          <rect x="17" y="12" width="66" height="72" rx="14" fill="${isGhost ? fill : "url(#headGrad)"}" stroke="${stroke}" />
          <rect x="34" y="1" width="32" height="14" rx="4.5" fill="${isGhost ? fill : "url(#headGrad)"}" stroke="${stroke}" />
          ${isGhost ? "" : '<rect x="17" y="12" width="66" height="72" rx="14" fill="url(#headEdgeShade)" /><rect x="34" y="1" width="32" height="14" rx="4.5" fill="rgba(255,255,255,0.14)" /><ellipse cx="40" cy="28" rx="20" ry="14" fill="url(#headGlow)" /><ellipse cx="51" cy="78" rx="25" ry="6" fill="rgba(175,116,0,0.18)" /><path d="M21 70 Q50 82 79 70" fill="rgba(0,0,0,0.05)" />'}
          ${isGhost ? "" : '<circle cx="39" cy="42" r="5.4" fill="#1f2430" /><circle cx="61" cy="42" r="5.4" fill="#1f2430" /><path d="M36 58 Q50 64.5 64 58" stroke="#1f2430" stroke-width="4.2" stroke-linecap="round" fill="none" />'}
        </svg>
      `;
    case "neck":
      return `
        <svg class="piece-svg" viewBox="0 0 100 50" aria-hidden="true">
          <defs>
            <linearGradient id="neckGrad" x1="12%" y1="0%" x2="88%" y2="100%">
              <stop offset="0%" stop-color="#ffe07a" />
              <stop offset="55%" stop-color="#ffc72c" />
              <stop offset="100%" stop-color="#e6a300" />
            </linearGradient>
          </defs>
          <rect x="10" y="0" width="80" height="50" rx="11" fill="${isGhost ? fill : "url(#neckGrad)"}" stroke="${stroke}" />
          ${isGhost ? "" : '<rect x="20" y="7" width="60" height="6" rx="3" fill="rgba(255,255,255,0.17)" /><rect x="16" y="35" width="68" height="9" rx="4.5" fill="rgba(173,111,0,0.18)" /><path d="M24 0 V50" stroke="rgba(255,255,255,0.06)" stroke-width="2" /><path d="M76 0 V50" stroke="rgba(0,0,0,0.05)" stroke-width="2" />'}
        </svg>
      `;
    case "torso":
      return `
        <svg class="piece-svg" viewBox="0 0 120 100" aria-hidden="true">
          <defs>
            <linearGradient id="torsoGrad" x1="14%" y1="6%" x2="86%" y2="100%">
              <stop offset="0%" stop-color="#ff3140" />
              <stop offset="52%" stop-color="#e30713" />
              <stop offset="100%" stop-color="#b70610" />
            </linearGradient>
            <linearGradient id="torsoSideShade" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stop-color="#000000" stop-opacity="0.1" />
              <stop offset="16%" stop-color="#000000" stop-opacity="0" />
              <stop offset="82%" stop-color="#000000" stop-opacity="0" />
              <stop offset="100%" stop-color="#000000" stop-opacity="0.12" />
            </linearGradient>
          </defs>
          <path d="M22 0 H98 L108 100 H12 Z" fill="${isGhost ? fill : "url(#torsoGrad)"}" stroke="${stroke}" />
          ${isGhost ? "" : '<path d="M22 0 H98 L108 100 H12 Z" fill="url(#torsoSideShade)" /><path d="M28 7 H92 L88 17 H32 Z" fill="rgba(255,255,255,0.14)" /><path d="M23 8 Q26 42 22 95" stroke="rgba(0,0,0,0.09)" stroke-width="2.6" fill="none" /><path d="M97 8 Q94 42 98 95" stroke="rgba(0,0,0,0.1)" stroke-width="2.6" fill="none" /><path d="M29 16 Q60 11 91 16" stroke="rgba(255,255,255,0.08)" stroke-width="2.4" fill="none" stroke-linecap="round" />'}
        </svg>
      `;
    case "left-arm":
      return `
        <svg class="piece-svg" viewBox="0 0 90 180" aria-hidden="true">
          <defs>
            <linearGradient id="armLeftGrad" x1="12%" y1="10%" x2="88%" y2="100%">
              <stop offset="0%" stop-color="#ff3d49" />
              <stop offset="58%" stop-color="#e30713" />
              <stop offset="100%" stop-color="#ac000b" />
            </linearGradient>
          </defs>
          <path d="M65 4 C47 4 27 24 22 46 L16 144 C15 157 21 170 33 173 L51 176 C61 178 69 170 72 159 L78 38 C79 18 74 4 65 4 Z" fill="${isGhost ? fill : "url(#armLeftGrad)"}" stroke="${stroke}" />
          ${isGhost ? "" : '<path d="M61 16 C46 20 32 39 28 63" stroke="rgba(255,255,255,0.16)" stroke-width="6" fill="none" stroke-linecap="round" /><path d="M74 18 C69 47 66 97 66 152" stroke="rgba(0,0,0,0.09)" stroke-width="3" fill="none" stroke-linecap="round" /><path d="M24 132 Q30 157 45 170" stroke="rgba(0,0,0,0.05)" stroke-width="5" fill="none" stroke-linecap="round" />'}
        </svg>
      `;
    case "right-arm":
      return `
        <svg class="piece-svg" viewBox="0 0 90 180" aria-hidden="true">
          <defs>
            <linearGradient id="armRightGrad" x1="88%" y1="10%" x2="12%" y2="100%">
              <stop offset="0%" stop-color="#ff3d49" />
              <stop offset="58%" stop-color="#e30713" />
              <stop offset="100%" stop-color="#ac000b" />
            </linearGradient>
          </defs>
          <path d="M25 4 C43 4 63 24 68 46 L74 144 C75 157 69 170 57 173 L39 176 C29 178 21 170 18 159 L12 38 C11 18 16 4 25 4 Z" fill="${isGhost ? fill : "url(#armRightGrad)"}" stroke="${stroke}" />
          ${isGhost ? "" : '<path d="M29 16 C44 20 58 39 62 63" stroke="rgba(255,255,255,0.16)" stroke-width="6" fill="none" stroke-linecap="round" /><path d="M16 18 C21 47 24 97 24 152" stroke="rgba(0,0,0,0.09)" stroke-width="3" fill="none" stroke-linecap="round" /><path d="M66 132 Q60 157 45 170" stroke="rgba(0,0,0,0.05)" stroke-width="5" fill="none" stroke-linecap="round" />'}
        </svg>
      `;
    case "left-hand":
      return `
        <svg class="piece-svg" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="handLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffe07a" />
              <stop offset="58%" stop-color="#ffc72c" />
              <stop offset="100%" stop-color="#e3a100" />
            </linearGradient>
          </defs>
          <g transform="rotate(9 54 42)">
            <rect x="43" y="18" width="28" height="24" rx="10" fill="${isGhost ? fill : "url(#handLeftGrad)"}" stroke="${stroke}" />
            <path d="M57 36 L57 54" stroke="${isGhost ? fill : "url(#handLeftGrad)"}" stroke-width="16" stroke-linecap="round" fill="none" />
            <circle cx="57" cy="52" r="8.5" fill="${isGhost ? fill : "url(#handLeftGrad)"}" stroke="${stroke}" />
            <path d="M57 34 Q44 44 40 72" stroke="${isGhost ? fill : "url(#handLeftGrad)"}" stroke-width="14" stroke-linecap="round" fill="none" />
            <path d="M57 34 Q71 42 76 68" stroke="${isGhost ? fill : "url(#handLeftGrad)"}" stroke-width="14" stroke-linecap="round" fill="none" />
            ${isGhost ? "" : '<path d="M57 22 L57 36" stroke="rgba(255,255,255,0.18)" stroke-width="5" stroke-linecap="round" fill="none" /><path d="M55 36 Q45 46 41 70" stroke="rgba(0,0,0,0.08)" stroke-width="3.2" stroke-linecap="round" fill="none" /><path d="M58 36 Q70 43 74 67" stroke="rgba(255,255,255,0.08)" stroke-width="2.8" stroke-linecap="round" fill="none" />'}
          </g>
        </svg>
      `;
    case "right-hand":
      return `
        <svg class="piece-svg" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="handRightGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#ffe07a" />
              <stop offset="58%" stop-color="#ffc72c" />
              <stop offset="100%" stop-color="#e3a100" />
            </linearGradient>
          </defs>
          <g transform="rotate(-9 46 42)">
            <rect x="29" y="18" width="28" height="24" rx="10" fill="${isGhost ? fill : "url(#handRightGrad)"}" stroke="${stroke}" />
            <path d="M43 36 L43 54" stroke="${isGhost ? fill : "url(#handRightGrad)"}" stroke-width="16" stroke-linecap="round" fill="none" />
            <circle cx="43" cy="52" r="8.5" fill="${isGhost ? fill : "url(#handRightGrad)"}" stroke="${stroke}" />
            <path d="M43 34 Q29 42 24 68" stroke="${isGhost ? fill : "url(#handRightGrad)"}" stroke-width="14" stroke-linecap="round" fill="none" />
            <path d="M43 34 Q56 44 60 72" stroke="${isGhost ? fill : "url(#handRightGrad)"}" stroke-width="14" stroke-linecap="round" fill="none" />
            ${isGhost ? "" : '<path d="M43 22 L43 36" stroke="rgba(255,255,255,0.18)" stroke-width="5" stroke-linecap="round" fill="none" /><path d="M45 36 Q55 46 59 70" stroke="rgba(0,0,0,0.08)" stroke-width="3.2" stroke-linecap="round" fill="none" /><path d="M42 36 Q30 43 26 67" stroke="rgba(255,255,255,0.08)" stroke-width="2.8" stroke-linecap="round" fill="none" />'}
          </g>
        </svg>
      `;
    case "hips":
      return `
        <svg class="piece-svg" viewBox="0 0 140 80" aria-hidden="true">
          <defs>
            <linearGradient id="hipsGrad" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stop-color="#4279c4" />
              <stop offset="58%" stop-color="#1f5ca8" />
              <stop offset="100%" stop-color="#154883" />
            </linearGradient>
          </defs>
          <path d="M0 0 H140 V80 H0 Z" fill="${isGhost ? fill : "url(#hipsGrad)"}" stroke="${stroke}" />
          ${isGhost ? "" : '<rect x="14" y="8" width="112" height="10" rx="3" fill="rgba(255,255,255,0.16)" /><rect x="0" y="52" width="140" height="18" fill="rgba(0,0,0,0.07)" /><path d="M70 8 V78" stroke="rgba(16,36,68,0.22)" stroke-width="2" /><path d="M0 40 H140" stroke="rgba(12,36,82,0.11)" stroke-width="2" /><path d="M56 80 V52 Q56 44 62 42 H78 Q84 44 84 52 V80" fill="rgba(0,0,0,0.08)" />'}
        </svg>
      `;
    case "left-leg":
      return `
        <svg class="piece-svg" viewBox="0 0 90 170" aria-hidden="true">
          <defs>
            <linearGradient id="legLeftGrad" x1="12%" y1="0%" x2="88%" y2="100%">
              <stop offset="0%" stop-color="#4279c4" />
              <stop offset="55%" stop-color="#1f5ca8" />
              <stop offset="100%" stop-color="#174883" />
            </linearGradient>
          </defs>
          <path d="M16 0 H80 V160 H16 Z" fill="${isGhost ? fill : "url(#legLeftGrad)"}" stroke="${stroke}" />
          ${isGhost ? "" : '<rect x="20" y="40" width="56" height="11" fill="rgba(255,255,255,0.13)" /><rect x="16" y="128" width="64" height="13" fill="rgba(0,0,0,0.08)" /><path d="M78 0 V160" stroke="rgba(0,0,0,0.09)" stroke-width="2.2" /><path d="M18 10 V160" stroke="rgba(255,255,255,0.05)" stroke-width="2" />'}
        </svg>
      `;
    case "right-leg":
      return `
        <svg class="piece-svg" viewBox="0 0 90 170" aria-hidden="true">
          <defs>
            <linearGradient id="legRightGrad" x1="88%" y1="0%" x2="12%" y2="100%">
              <stop offset="0%" stop-color="#4279c4" />
              <stop offset="55%" stop-color="#1f5ca8" />
              <stop offset="100%" stop-color="#174883" />
            </linearGradient>
          </defs>
          <path d="M10 0 H74 V160 H10 Z" fill="${isGhost ? fill : "url(#legRightGrad)"}" stroke="${stroke}" />
          ${isGhost ? "" : '<rect x="14" y="40" width="56" height="11" fill="rgba(255,255,255,0.13)" /><rect x="10" y="128" width="64" height="13" fill="rgba(0,0,0,0.08)" /><path d="M12 0 V160" stroke="rgba(0,0,0,0.09)" stroke-width="2.2" /><path d="M72 10 V160" stroke="rgba(255,255,255,0.05)" stroke-width="2" />'}
        </svg>
      `;
    default:
      return `
        <svg class="piece-svg" viewBox="0 0 100 100" aria-hidden="true">
          <rect x="20" y="20" width="60" height="60" rx="18" fill="${fill}" stroke="${stroke}" />
        </svg>
      `;
  }
}

init();
