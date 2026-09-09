const nav = document.querySelector('.nav');
const toggle = document.querySelector('.menu-button');
const links = document.querySelectorAll('nav a');
const closeMenu = () => {
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
};

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});

links.forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', event => {
  if (nav.classList.contains('open') && !event.target.closest('.nav')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) closeMenu();
});

const scrollTargets = document.querySelectorAll('main section > *, main section article, footer > *');
scrollTargets.forEach(element => {
  element.classList.add('scroll-animated');
  const siblingIndex = [...element.parentElement.children].indexOf(element);
  element.style.setProperty('--scroll-delay', `${Math.min(siblingIndex, 5) * 70}ms`);
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const active = entry.isIntersecting;
    entry.target.classList.toggle('visible', active);
    entry.target.classList.toggle('is-visible', active);
  });
}, { threshold: 0.12, rootMargin: '-8% 0px -8% 0px' });
document.querySelectorAll('.reveal, .scroll-animated').forEach(el => observer.observe(el));

const sections = [...document.querySelectorAll('main section')];
window.addEventListener('scroll', () => {
  const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 16;
  const current = atBottom ? sections[sections.length - 1].id
    : sections.findLast(section => window.scrollY >= section.offsetTop - 160)?.id || 'home';
  links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
}, { passive: true });

window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelector('.loader').classList.add('done');
    document.body.classList.add('page-ready');
  }, 1700);
  setTimeout(startEntranceDrop, 1950);
});

(function () {
  const wrap = document.querySelector('.eyebrow .type-wrap');
  if (!wrap) return;
  const target = wrap.querySelector('.type-text');
  const cursor = wrap.querySelector('.type-cursor');
  if (!target || !cursor) return;
  const full = target.dataset.text || target.textContent.trim();
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const probe = target.cloneNode(false);
  probe.style.cssText = 'position:absolute;visibility:hidden;left:0;top:0;width:auto;white-space:nowrap';
  wrap.appendChild(probe);
  const widths = [0];
  for (let i = 1; i <= full.length; i++) {
    probe.textContent = full.slice(0, i);
    widths.push(probe.getBoundingClientRect().width);
  }
  const reserved = widths[widths.length - 1];
  wrap.removeChild(probe);
  wrap.style.minWidth = (reserved + cursor.offsetWidth + 2) + 'px';
  if (reduced) return;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const setWidth = w => { target.style.width = w + 'px'; };
  const cycle = async () => {
    target.style.width = '0px';
    wrap.classList.remove('typed');
    wrap.classList.add('typing');
    for (let i = 1; i < widths.length; i++) {
      if (document.hidden) return;
      setWidth(widths[i]);
      await sleep(70);
    }
    wrap.classList.remove('typing');
    wrap.classList.add('typed');
    await sleep(2000);
    if (document.hidden) return;
    for (let i = widths.length - 2; i >= 0; i--) {
      if (document.hidden) return;
      setWidth(widths[i]);
      await sleep(45);
    }
    await sleep(600);
    if (document.hidden) return;
    cycle();
  };
  setTimeout(cycle, 3000);
})();

document.querySelectorAll('.project').forEach(project => {
  project.addEventListener('pointermove', event => {
    const box = project.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - .5;
    const y = (event.clientY - box.top) / box.height - .5;
    project.style.transform = `perspective(700px) rotateY(${x * 4}deg) rotateX(${y * -4}deg)`;
  });
  project.addEventListener('pointerleave', () => project.style.transform = '');
});

const idCard = document.querySelector('.id-card');
const lanyard = document.querySelector('.lanyard');
const lanyardStage = document.querySelector('.portrait');
const cardHole = document.querySelector('.card-hole');
const lanyardPin = document.querySelector('.lanyard-pin');
const lanyardCanvas = document.querySelector('.lanyard-canvas');
const lanyardContext = lanyardCanvas.getContext('2d');
const lanyardPhoto = new Image();
lanyardPhoto.src = 'images/lanyard-fhin-vertical.png';
lanyardCanvas.addEventListener('pointerdown', event => {
  event.preventDefault();
  event.stopPropagation();
});
document.addEventListener('click', event => {
  if (!event.target.closest('a[href="#home"]')) return;
  const canvasBox = lanyardCanvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - canvasBox.left) * lanyardCanvas.width / canvasBox.width);
  const y = Math.floor((event.clientY - canvasBox.top) * lanyardCanvas.height / canvasBox.height);
  if (x < 0 || y < 0 || x >= lanyardCanvas.width || y >= lanyardCanvas.height) return;
  if (lanyardContext.getImageData(x, y, 1, 1).data[3] > 0) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);
let draggingCard = false;
let pointerStart = { x: 0, y: 0 };
let lanyardAnchor;
let lanyardAnimationFrame;
let targetAngle = 0;
let targetLength = 320;
let renderedAngle = 0;
let renderedLength = 315;
let angularVelocity = 0;
let lengthVelocity = 0;
let pointerVelocity = { x: 0, y: 0 };
let lastPointerSample;
let idleSwingFrame;
let idleSwingTime = 0;
let cardReturning = false;
let flipEnabled = true;
let pointerDragged = false;
let hoverTarget = { x: 0, y: 0 };
let hoverCurrent = { x: 0, y: 0 };
let cardFree = { x: 0, y: 0 };
let dragStartOffset = { x: 0, y: 0 };
let returnVX = 0;
let returnVY = 0;
let pendulumTime = 0;
const prefersReducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
let entranceActive = false;
let entranceFrameRef = 0;
let dropY = 0;
let dropVy = 0;
let entranceTime = 0;
let entranceWobble = 0;

function renderLanyard() {
  // A lightly damped spring lets the strap trail the card instead of moving as a rigid line.
  angularVelocity = (angularVelocity + (targetAngle - renderedAngle) * .12) * .82;
  lengthVelocity = (lengthVelocity + (targetLength - renderedLength) * .09) * .8;
  renderedAngle += angularVelocity;
  renderedLength += lengthVelocity;
  lanyard.style.setProperty('--lanyard-height', `${renderedLength}px`);
  const tension = Math.max(0, Math.min(1, (renderedLength - 220) / 150));
  const slack = Math.max(0, Math.min(1, (315 - renderedLength) / 110));
  lanyard.style.setProperty('--lanyard-tension', tension.toFixed(3));
  lanyard.style.setProperty('--lanyard-scale', (1 - tension * .08).toFixed(3));
  lanyard.style.setProperty('--lanyard-fold', slack.toFixed(3));
  lanyard.style.setProperty('--lanyard-fold-offset', `${(renderedLength * -.32).toFixed(1)}px`);
  lanyard.style.setProperty('--lanyard-slack', `${Math.max(-7, Math.min(7, angularVelocity * -.42 + (315 - renderedLength) * .025)).toFixed(2)}deg`);
  lanyard.style.transform = `rotate(${renderedAngle}deg)`;
  syncLanyardCurve();
  syncLanyardPin();

  const resting = Math.abs(targetAngle - renderedAngle) < .03 && Math.abs(targetLength - renderedLength) < .08 && Math.abs(angularVelocity) < .02 && Math.abs(lengthVelocity) < .03;
  if (!resting || draggingCard || cardReturning) {
    lanyardAnimationFrame = requestAnimationFrame(renderLanyard);
  } else {
    lanyardAnimationFrame = undefined;
  }
}

function animateLanyard() {
  if (!lanyardAnimationFrame) lanyardAnimationFrame = requestAnimationFrame(renderLanyard);
}

function drawLobsterClasp(cx, cy, angle) {
  // Metallic lobster clasp drawn at the card hole. angle = strap angle, local +x points
  // toward the hole, so the body hangs up along the strap and the hook ring sits at the hole.
  lanyardContext.save();
  lanyardContext.translate(cx, cy);
  lanyardContext.rotate(angle);
  const silver = (x0, y0, x1, y1) => {
    const gradient = lanyardContext.createLinearGradient(x0, y0, x1, y1);
    gradient.addColorStop(0, '#f5f5f8');
    gradient.addColorStop(.34, '#c7c8cf');
    gradient.addColorStop(.6, '#8e8f96');
    gradient.addColorStop(1, '#67686f');
    return gradient;
  };
  // top loop the strap threads through
  lanyardContext.lineWidth = 3.4;
  lanyardContext.strokeStyle = '#3a3b40';
  lanyardContext.beginPath();
  lanyardContext.arc(-25.5, 0, 3.4, 0, Math.PI * 2);
  lanyardContext.stroke();
  lanyardContext.lineWidth = 1.6;
  lanyardContext.strokeStyle = '#e0e1e6';
  lanyardContext.beginPath();
  lanyardContext.arc(-25.5, 0, 3.4, 0, Math.PI * 2);
  lanyardContext.stroke();
  // claw body (teardrop hanging above the hook)
  lanyardContext.beginPath();
  lanyardContext.moveTo(-7, 0);
  lanyardContext.bezierCurveTo(-8.2, 5.6, -12.8, 6.9, -18.6, 6.2);
  lanyardContext.quadraticCurveTo(-21.4, 2.4, -21.2, 0);
  lanyardContext.quadraticCurveTo(-21.4, -2.4, -18.6, -6.2);
  lanyardContext.bezierCurveTo(-12.8, -6.9, -8.2, -5.6, -7, 0);
  lanyardContext.closePath();
  lanyardContext.fillStyle = silver(-22, -6, -7, 6);
  lanyardContext.fill();
  lanyardContext.lineWidth = 1;
  lanyardContext.strokeStyle = '#3a3b40';
  lanyardContext.stroke();
  // clasp hinge seam
  lanyardContext.beginPath();
  lanyardContext.moveTo(-20.4, 0);
  lanyardContext.lineTo(-8.2, 0);
  lanyardContext.strokeStyle = 'rgba(58,60,66,.55)';
  lanyardContext.lineWidth = .9;
  lanyardContext.stroke();
  // side trigger lever silhouette
  lanyardContext.beginPath();
  lanyardContext.arc(-14.6, 6.6, 3.1, -Math.PI / 2, Math.PI / 2);
  lanyardContext.strokeStyle = silver(-17.7, 6.6, -11.5, 6.6);
  lanyardContext.lineWidth = 1.4;
  lanyardContext.stroke();
  // bottom loop joining the hook
  lanyardContext.lineWidth = 2.1;
  lanyardContext.strokeStyle = '#393a40';
  lanyardContext.beginPath();
  lanyardContext.arc(-4.4, 0, 2.1, 0, Math.PI * 2);
  lanyardContext.stroke();
  lanyardContext.lineWidth = 1.1;
  lanyardContext.strokeStyle = '#dadbdf';
  lanyardContext.beginPath();
  lanyardContext.arc(-4.4, 0, 2.1, 0, Math.PI * 2);
  lanyardContext.stroke();
  // hook ring passing through the badge hole
  lanyardContext.lineWidth = 3.7;
  lanyardContext.strokeStyle = '#3a3b40';
  lanyardContext.beginPath();
  lanyardContext.arc(0, 0, 4.6, 0, Math.PI * 2);
  lanyardContext.stroke();
  lanyardContext.lineWidth = 2;
  lanyardContext.strokeStyle = silver(-4.6, -4.6, 4.6, 4.6);
  lanyardContext.beginPath();
  lanyardContext.arc(0, 0, 4.6, 0, Math.PI * 2);
  lanyardContext.stroke();
  lanyardContext.restore();
}

const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

function applyFluidAssembly() {
  if (!isMobile()) return;
  // Card width is a fluid fraction of the container, never a fixed device value.
  const stageWidth = lanyardStage.getBoundingClientRect().width || window.innerWidth;
  const cardWidth = Math.min(stageWidth * 0.7, 280);
  const gap = Math.max(24, Math.min(96, stageWidth * 0.18));
  // Strap sits on top of the portrait box (already below the CTA buttons in flex
  // flow), letting it hang down to the card with zero overlap of the buttons.
  lanyardStage.style.setProperty('--card-width', `${cardWidth}px`);
  lanyardStage.style.setProperty('--card-gap', `${gap}px`);
  lanyardStage.style.setProperty('--lanyard-top', '0px');
}

function syncLanyardToCard() {
  applyFluidAssembly();
  const hole = cardHole.getBoundingClientRect();
  if (!lanyardAnchor) {
    const strap = lanyard.getBoundingClientRect();
    lanyardAnchor = {
      x: strap.left + strap.width / 2,
      documentY: strap.top + window.scrollY
    };
  }
  const stage = lanyardStage.getBoundingClientRect();
  const scaleX = stage.width / lanyardStage.offsetWidth;
  const scaleY = stage.height / lanyardStage.offsetHeight;
  const anchorY = lanyardAnchor.documentY - window.scrollY;
  const dx = (hole.left + hole.width / 2 - lanyardAnchor.x) / scaleX;
  const dy = (hole.top + hole.height / 2 - anchorY) / scaleY;
  const dist = Math.hypot(dx, dy);
  if (isMobile()) {
    // Mobile: the origin sits atop the portrait (below the CTA buttons in flow);
    // the string is short, so the rest-length tracks the real anchor->hole gap.
    targetLength = Math.max(24, Math.min(dist + 260, dist + 3));
  } else {
    // Desktop keeps its tuned stall-band so the strap reads full-length.
    targetLength = Math.max(320, Math.min(900, dist + 3));
  }
  targetAngle = -Math.atan2(dx, dy) * 180 / Math.PI;
  animateLanyard();
}

function syncLanyardCurve() {
  if (!lanyardAnchor) return;
  const stage = lanyardStage.getBoundingClientRect();
  const hole = cardHole.getBoundingClientRect();
  const anchorX = lanyardAnchor.x;
  const anchorY = lanyardAnchor.documentY - window.scrollY;
  const holeCX = hole.left + hole.width / 2;
  const holeCY = hole.top + hole.height / 2;
  const pad = 64;
  const boxLeft = Math.min(anchorX, holeCX) - pad;
  const boxTop = Math.min(anchorY, holeCY) - pad;
  const boxRight = Math.max(anchorX, holeCX) + pad;
  const boxBottom = Math.max(anchorY, holeCY) + pad;
  const boxWidth = Math.max(2, boxRight - boxLeft);
  const boxHeight = Math.max(2, boxBottom - boxTop);
  lanyardCanvas.style.left = `${boxLeft - stage.left}px`;
  lanyardCanvas.style.top = `${boxTop - stage.top}px`;
  lanyardCanvas.style.width = `${boxWidth}px`;
  lanyardCanvas.style.height = `${boxHeight}px`;
  const pixelRatio = window.devicePixelRatio || 1;
  const canvasWidth = Math.round(boxWidth * pixelRatio);
  const canvasHeight = Math.round(boxHeight * pixelRatio);
  if (lanyardCanvas.width !== canvasWidth || lanyardCanvas.height !== canvasHeight) {
    lanyardCanvas.width = canvasWidth;
    lanyardCanvas.height = canvasHeight;
    lanyardContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }
  lanyardContext.clearRect(0, 0, boxWidth, boxHeight);
  const startX = anchorX - boxLeft;
  const startY = anchorY - boxTop;
  const endX = holeCX - boxLeft;
  const endY = holeCY - boxTop;
  const distance = Math.hypot(endX - startX, endY - startY);
  const slack = Math.max(0, Math.min(1, (315 - distance) / 130));
  const controlOne = { x: startX + (endX - startX) * .25, y: startY + (endY - startY) * .25 };
  const controlTwo = { x: startX + (endX - startX) * .75, y: startY + (endY - startY) * .75 };
  const pointAt = t => ({
    x: (1 - t) ** 3 * startX + 3 * (1 - t) ** 2 * t * controlOne.x + 3 * (1 - t) * t ** 2 * controlTwo.x + t ** 3 * endX,
    y: (1 - t) ** 3 * startY + 3 * (1 - t) ** 2 * t * controlOne.y + 3 * (1 - t) * t ** 2 * controlTwo.y + t ** 3 * endY
  });

  const segments = 42;
  const drawPath = (lineWidth, strokeStyle, offsetX, offsetY, dash, tEnd) => {
    lanyardContext.beginPath();
    if (dash) lanyardContext.setLineDash(dash);
    const terminator = tEnd === undefined ? 1 : tEnd;
    for (let index = 0; index <= segments; index += 1) {
      const point = pointAt((index / segments) * terminator);
      if (index === 0) lanyardContext.moveTo(point.x + offsetX, point.y + offsetY);
      else lanyardContext.lineTo(point.x + offsetX, point.y + offsetY);
    }
    lanyardContext.lineWidth = lineWidth;
    lanyardContext.lineCap = 'round';
    lanyardContext.strokeStyle = strokeStyle;
    lanyardContext.stroke();
    if (dash) lanyardContext.setLineDash([]);
  };
  const strapT = Math.max(.14, Math.min(1, 1 - 26 / distance));
  drawPath(30, 'rgba(0,0,0,.45)', 1, 2, undefined, strapT);
  drawPath(27, '#0e0e11', 0, 0, undefined, strapT);
  drawPath(1, 'rgba(255,255,255,.045)', -12.5, 0, [2, 5], strapT);
  drawPath(1, 'rgba(255,255,255,.045)', 12.5, 0, [2, 5], strapT);

  const strapAngle = Math.atan2(endY - startY, endX - startX);
  const strapDirX = Math.cos(strapAngle);
  const strapDirY = Math.sin(strapAngle);
  // collar swivel: short metallic shank plus a thin ring the strap hangs from
  lanyardContext.save();
  lanyardContext.lineCap = 'round';
  lanyardContext.strokeStyle = 'rgba(40,41,46,.9)';
  lanyardContext.lineWidth = 9;
  lanyardContext.beginPath();
  lanyardContext.moveTo(startX + strapDirX * 12, startY + strapDirY * 12);
  lanyardContext.lineTo(startX - strapDirX * 6, startY - strapDirY * 6);
  lanyardContext.stroke();
  lanyardContext.strokeStyle = '#d6d7dc';
  lanyardContext.lineWidth = 4;
  lanyardContext.beginPath();
  lanyardContext.moveTo(startX + strapDirX * 12, startY + strapDirY * 12);
  lanyardContext.lineTo(startX - strapDirX * 6, startY - strapDirY * 6);
  lanyardContext.stroke();
  lanyardContext.strokeStyle = 'rgba(42,43,48,.95)';
  lanyardContext.lineWidth = 4.4;
  lanyardContext.beginPath();
  lanyardContext.arc(startX - strapDirX * 9.5, startY - strapDirY * 9.5, 3.5, 0, Math.PI * 2);
  lanyardContext.stroke();
  lanyardContext.strokeStyle = '#ececf1';
  lanyardContext.lineWidth = 1.7;
  lanyardContext.beginPath();
  lanyardContext.arc(startX - strapDirX * 9.5, startY - strapDirY * 9.5, 3.5, 0, Math.PI * 2);
  lanyardContext.stroke();
  lanyardContext.restore();
  drawLobsterClasp(endX, endY, strapAngle);
  lanyard.style.setProperty('--lanyard-fold', slack.toFixed(3));
}

lanyardPhoto.addEventListener('load', syncLanyardCurve);

function syncLanyardPin() {
  const hole = cardHole.getBoundingClientRect();
  // Start from the real string anchor (top of the portrait/stage) so the connector
  // runs anchor->hole exactly like the canvas strap — independent of the decorative
  // fiber length, which is scale- and viewport-dependent.
  if (!lanyardAnchor) return;
  const startX = lanyardAnchor.x;
  const startY = lanyardAnchor.documentY - window.scrollY;
  const endX = hole.left + hole.width / 2;
  const endY = hole.top + hole.height / 2;
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.hypot(dx, dy) + 2;
  const angle = -Math.atan2(dx, dy) * 180 / Math.PI;
  lanyardPin.style.left = `${startX - 4}px`;
  lanyardPin.style.top = `${startY}px`;
  lanyardPin.style.height = `${length}px`;
  lanyardPin.style.transform = `rotate(${angle}deg)`;
}
idCard.addEventListener('pointerdown', event => {
  event.preventDefault(); draggingCard = true;
  pointerDragged = false;
  dragStartOffset = { x: cardFree.x, y: cardFree.y };
  pointerStart = { x: event.clientX, y: event.clientY };
  pointerVelocity = { x: 0, y: 0 };
  lastPointerSample = { x: event.clientX, y: event.clientY, time: performance.now() };
  idCard.setPointerCapture(event.pointerId); idCard.classList.add('dragging');
  lanyard.classList.add('tracking');
});
idCard.addEventListener('pointermove', event => {
  if (!draggingCard) return;
  const now = performance.now();
  const elapsed = Math.max(16, now - lastPointerSample.time);
  pointerVelocity = {
    x: (event.clientX - lastPointerSample.x) / elapsed,
    y: (event.clientY - lastPointerSample.y) / elapsed
  };
  lastPointerSample = { x: event.clientX, y: event.clientY, time: now };
  if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 6) pointerDragged = true;
  cardFree.x = dragStartOffset.x + event.clientX - pointerStart.x;
  cardFree.y = dragStartOffset.y + event.clientY - pointerStart.y;
  const xRange = Math.max(160, lanyardStage.clientWidth * .42);
  const cardTilt = Math.max(-24, Math.min(24, (event.clientX - pointerStart.x) / xRange * 22));
  idCard.style.transform = `translate(${cardFree.x}px, ${cardFree.y}px) rotate(${-3 + cardTilt}deg)`;
  syncLanyardToCard();
  // Fast movements transfer momentum to the strap instead of making it track rigidly.
  angularVelocity += Math.max(-2.4, Math.min(2.4, pointerVelocity.x * .22));
  lengthVelocity += Math.max(-1.8, Math.min(1.8, pointerVelocity.y * .12));
});
function releaseCard(event) {
  draggingCard = false;
  if (event?.pointerId !== undefined && idCard.hasPointerCapture(event.pointerId)) idCard.releasePointerCapture(event.pointerId);
  if (event?.type === 'pointerup') event.preventDefault();
  idCard.classList.remove('dragging');
  lanyard.classList.add('tracking');
  angularVelocity += Math.max(-4.5, Math.min(4.5, pointerVelocity.x * .48));
  lengthVelocity += Math.max(-3, Math.min(3, pointerVelocity.y * .2));
  animateLanyard();
  if (prefersReducedMotion) {
    cardFree.x = 0;
    cardFree.y = 0;
    returnVX = 0;
    returnVY = 0;
  } else {
    returnVX = pointerVelocity.x * 350;
    returnVY = pointerVelocity.y * 350;
    pendulumTime = performance.now();
    cardReturning = true;
  }
}
idCard.addEventListener('click', event => {
  if (!flipEnabled || pointerDragged) return;
  idCard.classList.toggle('flipped');
});

function startEntranceDrop() {
  if (entranceActive || draggingCard || prefersReducedMotion || document.hidden) return;
  entranceActive = true;
  dropY = -(window.innerHeight + 220);
  dropVy = 0;
  entranceTime = 0;
  entranceWobble = 0;
  idCard.style.transition = 'none';
  entranceStep();
}

function entranceStep() {
  entranceFrameRef = requestAnimationFrame(entranceStep);
  if (!entranceActive || document.hidden || draggingCard) {
    endEntranceDrop();
    return;
  }
  dropVy += 1.2;
  dropY += dropVy;
  entranceTime += .16;
  if (dropY >= 0) {
    dropY = 0;
    if (Math.abs(dropVy) > 3.2) {
      entranceWobble = Math.min(16, Math.abs(dropVy) * .13);
      dropVy *= -.42;
    } else {
      dropVy = 0;
      endEntranceDrop();
      return;
    }
  }
  entranceWobble *= .95;
  const rot = -3 + (dropY >= 0 ? entranceWobble * Math.sin(entranceTime * 8) : 0);
  idCard.style.transform = `translate(${cardFree.x}px, ${cardFree.y}px) translateY(${dropY.toFixed(1)}px) rotate(${rot.toFixed(3)}deg)`;
  syncLanyardToCard();
}

function endEntranceDrop() {
  if (!entranceActive) return;
  entranceActive = false;
  cancelAnimationFrame(entranceFrameRef);
  idCard.style.transition = '';
  idCard.style.transform = `translate(${cardFree.x}px, ${cardFree.y}px)`;
  idleSwingTime = 0;
}

function idleSwing() {
  idleSwingFrame = requestAnimationFrame(idleSwing);
  if (draggingCard || entranceActive || document.hidden) return;
  if (cardReturning) {
    const now = performance.now();
    const dt = Math.min(.06, (now - pendulumTime) / 1000);
    pendulumTime = now;
    const damping = Math.exp(-1.5 * dt);
    returnVX += -cardFree.x * 30 * dt;
    returnVY += -cardFree.y * 30 * dt;
    returnVX *= damping;
    returnVY *= damping;
    cardFree.x += returnVX * dt;
    cardFree.y += returnVY * dt;
    if (Math.abs(cardFree.x) < .8 && Math.abs(cardFree.y) < .8 && Math.hypot(returnVX, returnVY) < 12) {
      cardFree.x = 0;
      cardFree.y = 0;
      returnVX = 0;
      returnVY = 0;
      cardReturning = false;
      if (!draggingCard) lanyard.classList.remove('tracking');
    }
  }
  const cardBox = idCard.getBoundingClientRect();
  if (cardBox.bottom < 0 || cardBox.top > window.innerHeight) return;
  hoverCurrent.x += (hoverTarget.x - hoverCurrent.x) * .14;
  hoverCurrent.y += (hoverTarget.y - hoverCurrent.y) * .14;
  idleSwingTime += 16;
  const t = idleSwingTime / 1000;
  const sway = -3 + Math.sin(t * 1.4) * 2.2;
  const bob = Math.sin(t * 1.4 + 1.1) * 6;
  const hoverTilt = hoverCurrent.x * 6;
  const hoverLift = hoverCurrent.y * 10;
  const hoverSpin = hoverCurrent.x * 26;
  idCard.style.transform = `translate(${cardFree.x}px, ${cardFree.y}px) rotate(${(sway + hoverTilt).toFixed(3)}deg) rotateY(${hoverSpin.toFixed(2)}deg) translateY(${(bob + hoverLift).toFixed(3)}px)`;
  syncLanyardToCard();
}
if (!prefersReducedMotion) idleSwing();

idCard.addEventListener('pointerleave', () => {
  hoverTarget = { x: 0, y: 0 };
});
idCard.addEventListener('pointermove', event => {
  if (draggingCard) return;
  const box = idCard.getBoundingClientRect();
  if (!box.width || !box.height) return;
  hoverTarget.x = (event.clientX - box.left) / box.width - .5;
  hoverTarget.y = (event.clientY - box.top) / box.height - .5;
});
idCard.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    if (!flipEnabled) return;
    idCard.classList.toggle('flipped');
    event.preventDefault();
  }
});

idCard.addEventListener('transitionend', event => {
  if (event.propertyName === 'transform' && !draggingCard) syncLanyardToCard();
});
idCard.addEventListener('pointerup', releaseCard);
idCard.addEventListener('pointercancel', releaseCard);
window.addEventListener('load', () => requestAnimationFrame(syncLanyardToCard));
window.addEventListener('resize', () => {
  lanyardAnchor = undefined;
  requestAnimationFrame(syncLanyardToCard);
});
window.addEventListener('scroll', () => requestAnimationFrame(syncLanyardPin), { passive: true });

const portfolioTabs = document.querySelectorAll('.portfolio-tab');
const portfolioPanels = document.querySelectorAll('.portfolio-panel');

portfolioTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const activePanelId = tab.getAttribute('aria-controls');
    portfolioTabs.forEach(item => {
      const isActive = item === tab;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', isActive);
    });
    portfolioPanels.forEach(panel => {
      const isActive = panel.id === activePanelId;
      panel.hidden = !isActive;
      panel.classList.toggle('active', isActive);
    });
  });
});

// --- Certificate preview modal ---
const certificateModal = document.getElementById('certificate-modal');
const certificateCards = document.querySelectorAll('.certificate-card');

if (certificateModal && certificateCards.length) {
  const certificateModalImage = certificateModal.querySelector('.certificate-modal-image');
  const certificateModalCategory = certificateModal.querySelector('.certificate-modal-category');
  const certificateModalTitle = certificateModal.querySelector('.certificate-modal-title');
  const certificateModalYear = certificateModal.querySelector('.certificate-modal-year');
  const certificateModalOpen = certificateModal.querySelector('.certificate-modal-open');
  let lastFocusedCertificate = null;

  const openCertificateModal = card => {
    const image = card.querySelector('.certificate-photo');
    const category = card.querySelector('p');
    const title = card.querySelector('h3');
    const year = card.querySelector('.certificate-year');
    certificateModalImage.src = image.getAttribute('src');
    certificateModalImage.alt = `Sertifikat ${title.textContent}`;
    certificateModalCategory.textContent = category.textContent;
    certificateModalTitle.textContent = title.textContent;
    certificateModalYear.textContent = year.textContent;
    certificateModalOpen.href = certificateModalImage.src;
    lastFocusedCertificate = card;
    certificateModal.classList.add('open');
    document.body.classList.add('modal-open');
    certificateModal.querySelector('.certificate-modal-close').focus();
  };

  const closeCertificateModal = () => {
    certificateModal.classList.remove('open');
    document.body.classList.remove('modal-open');
    certificateModal.addEventListener('transitionend', () => {
      certificateModalImage.removeAttribute('src');
    }, { once: true });
    if (lastFocusedCertificate) lastFocusedCertificate.focus();
    lastFocusedCertificate = null;
  };

  certificateCards.forEach(card => {
    card.addEventListener('click', () => openCertificateModal(card));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openCertificateModal(card);
      }
    });
  });

  certificateModal.querySelectorAll('[data-cert-close]').forEach(el => el.addEventListener('click', closeCertificateModal));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && certificateModal.classList.contains('open')) closeCertificateModal();
  });
}
