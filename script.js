const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const openSaveBtn = document.getElementById('openSaveBtn');
const modal = document.getElementById('exportModal');
const modalContent = document.getElementById('exportModalContent');
const watermarkLink = document.getElementById('watermarkLink');
const helperText = document.getElementById('helperText');
const themeLabel = document.getElementById('themeLabel');
const engineVersion = document.getElementById('engineVersion');

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const levels = ['GREAT', 'GOOD', 'OKAY', 'MEH', 'BAD', 'HORRIBLE'];

let theme = { bg: '#121212', grid: 'rgba(255, 255, 255, 0.05)', line: '#30a1f1', fill: 'rgba(48, 161, 241, 0.15)', text: '#888888', roughness: 1.5, points: '#ffffff' };
let width, height;
let points = [];
let draggingPoint = null;
let dpr = window.devicePixelRatio || 1;
const LERP_FACTOR = 0.2;

function setTheme(type) {
    const body = document.body;
    const container = document.getElementById('container');
    const btns = document.querySelectorAll('.theme-tag');
    
    btns.forEach(b => {
        b.classList.remove('active-preset');
        b.classList.add('inactive-preset');
    });

    const b169 = document.getElementById('btn169');
    const b43 = document.getElementById('btn43');
    const b11 = document.getElementById('btn11');
    const mCancel = document.getElementById('modalCancel');
    const saveBtn = document.getElementById('openSaveBtn');
    const clearBtn = document.getElementById('resetBtn');

    switch(type) {
        case 'blueprint':
            theme = { bg: '#1a3a6c', grid: 'rgba(255,255,255,0.1)', line: '#ffffff', fill: 'rgba(255, 255, 255, 0.1)', text: '#a0c4ff', roughness: 1.2, points: '#ffffff' };
            body.style.color = '#ffffff'; 
            watermarkLink.style.color = '#a0c4ff';
            helperText.style.color = '#a0c4ff';
            themeLabel.style.color = '#a0c4ff';
            engineVersion.style.color = '#a0c4ff';
            saveBtn.style.color = '#ffffff';
            clearBtn.style.color = '#ffffff'; 
            modalContent.style.backgroundColor = '#244b8a';
            modalContent.style.borderColor = 'rgba(255,255,255,0.2)';
            modalContent.style.color = '#ffffff';
            mCancel.style.color = '#ffffff';
            b169.className = b43.className = b11.className = "w-full py-2.5 border border-white/30 text-white hover:bg-white/10 font-bold rounded-full hover:scale-105 transition-all text-sm";
            break;
        case 'sketch':
            theme = { bg: '#f4f1ea', grid: 'rgba(0,0,0,0.05)', line: '#2d2d2d', fill: 'rgba(0, 0, 0, 0.05)', text: '#666666', roughness: 2.2, points: '#000000' };
            body.style.color = '#2d2d2d';
            watermarkLink.style.color = '#666666';
            helperText.style.color = '#2d2d2d';
            themeLabel.style.color = '#666666';
            engineVersion.style.color = '#666666';
            saveBtn.style.color = '#2d2d2d';
            clearBtn.style.color = '#2d2d2d'; 
            modalContent.style.backgroundColor = '#eeebe3';
            modalContent.style.borderColor = 'rgba(0,0,0,0.1)';
            modalContent.style.color = '#2d2d2d';
            mCancel.style.color = '#2d2d2d';
            b169.className = b43.className = b11.className = "w-full py-2.5 border border-black/20 text-black hover:bg-black/5 font-bold rounded-full hover:scale-105 transition-all text-sm";
            break;
        case 'light':
            theme = { bg: '#ffffff', grid: '#f0f0f0', line: '#000000', fill: 'rgba(0, 0, 0, 0.03)', text: '#999999', roughness: 0.8, points: '#000000' };
            body.style.color = '#000000';
            watermarkLink.style.color = '#999999';
            helperText.style.color = '#333333';
            themeLabel.style.color = '#999999';
            engineVersion.style.color = '#999999';
            saveBtn.style.color = '#000000';
            clearBtn.style.color = '#000000'; 
            modalContent.style.backgroundColor = '#f9f9f9';
            modalContent.style.borderColor = 'rgba(0,0,0,0.1)';
            modalContent.style.color = '#000000';
            mCancel.style.color = '#000000';
            b169.className = b43.className = b11.className = "w-full py-2.5 border border-black/20 text-black hover:bg-black/5 font-bold rounded-full hover:scale-105 transition-all text-sm";
            break;
        default: // noir/dark
            theme = { bg: '#121212', grid: 'rgba(255, 255, 255, 0.05)', line: '#30a1f1', fill: 'rgba(48, 161, 241, 0.15)', text: '#888888', roughness: 1.5, points: '#ffffff' };
            body.style.color = '#ffffff';
            watermarkLink.style.color = '#888888';
            helperText.style.color = '#888888';
            themeLabel.style.color = '#888888';
            engineVersion.style.color = '#888888';
            saveBtn.style.color = '#ffffff';
            clearBtn.style.color = '#ffffff'; 
            modalContent.style.backgroundColor = '#1a1a1a';
            modalContent.style.borderColor = 'rgba(255,255,255,0.2)';
            modalContent.style.color = '#ffffff';
            mCancel.style.color = '#ffffff';
            b169.className = b43.className = b11.className = "w-full py-2.5 border border-white/30 text-white hover:bg-white/10 font-bold rounded-full hover:scale-105 transition-all text-sm";
    }

    btns.forEach(b => {
        b.style.color = theme.text;
    });

    const targetBtn = document.getElementById('btn-' + type);
    if (targetBtn) {
        targetBtn.classList.remove('inactive-preset');
        targetBtn.classList.add('active-preset');
    }

    body.style.backgroundColor = theme.bg;
    container.style.backgroundColor = theme.bg;
    draw();
}

function sketchLine(targetCtx, x1, y1, x2, y2, color, lineWidth = 1, roughness = 1, scale = 1) {
    targetCtx.beginPath();
    targetCtx.strokeStyle = color;
    targetCtx.lineWidth = lineWidth;
    const dx = x2 - x1, dy = y2 - y1;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    // Normalize segment length based on screen scale
    const segments = Math.max(2, Math.floor(distance / (10 * scale)));
    const seed = (Math.abs(x1 * 12.3) + Math.abs(y1 * 45.6) + Math.abs(x2 * 78.9) + Math.abs(y2 * 32.1)) % 1000;
    
    targetCtx.moveTo(x1, y1);
    for(let i = 1; i <= segments; i++) {
        const t = i / segments;
        // Jitter amount is now proportional to scale
        const rx = (Math.sin(seed + i * 1.5) + Math.cos(seed * 0.7 + i * 2.1)) * 0.5 * roughness * scale;
        const ry = (Math.cos(seed + i * 1.3) + Math.sin(seed * 0.8 + i * 2.5)) * 0.5 * roughness * scale;
        targetCtx.lineTo(x1 + dx * t + rx, y1 + dy * t + ry);
    }
    targetCtx.stroke();
}

function resize() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth - (parseFloat(getComputedStyle(container).paddingLeft) * 2);
    width = containerWidth;
    const isDesktop = window.innerWidth >= 768; 
    const aspectRatio = isDesktop ? (9/16) : (3/4);
    const calculatedHeight = width * aspectRatio;
    const maxHeight = window.innerHeight * 0.6; 
    height = Math.max(300, Math.min(calculatedHeight, maxHeight));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
}

function createInitialPoints() {
    points = [];
    for (let i = 0; i < months.length; i++) {
        points.push({ index: i, month: months[i], val: 0.6, targetVal: 0.6 });
    }
}

function getLayout(w, h) {
    const scale = w / 1000;
    const isSmall = scale < 0.5;
    const padding = { 
        top: Math.max(110, 160 * scale), 
        right: Math.max(30, 60 * scale), 
        bottom: Math.max(isSmall ? 85 : 45, 90 * scale),
        left: Math.max(70, 130 * scale) 
    };
    const plotWidth = w - padding.left - padding.right;
    const plotHeight = h - padding.top - padding.bottom;
    return { scale, padding, plotWidth, plotHeight };
}

function render(targetCtx, w, h, isExport = false) {
    const { scale, padding, plotWidth, plotHeight } = getLayout(w, h);
    targetCtx.fillStyle = theme.bg;
    targetCtx.fillRect(0, 0, w, h);

    const axisWidth = Math.max(1.5, 3 * scale);
    // Pass scale to maintain proportional randomness
    sketchLine(targetCtx, padding.left, padding.top - 20, padding.left, h - padding.bottom, theme.text, axisWidth, 1, scale);
    sketchLine(targetCtx, padding.left, h - padding.bottom, w - padding.right + 20, h - padding.bottom, theme.text, axisWidth, 1, scale);

    const headerY = Math.max(55, 65 * scale);
    targetCtx.fillStyle = theme.text;
    targetCtx.font = `bold ${Math.max(16, 32 * scale)}px "Architects Daughter"`;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'top';
    targetCtx.fillText("HOW HAS YOUR YEAR BEEN?", w / 2, headerY);

    let markTotal = 0;
    points.forEach(p => markTotal += p.val);
    const mark = (markTotal / points.length * 10).toFixed(1);

    const ratingY = headerY + Math.max(25, 45 * scale);
    targetCtx.fillStyle = theme.line;
    targetCtx.font = `bold ${Math.max(20, 36 * scale)}px "Architects Daughter"`;
    targetCtx.textAlign = 'right';
    targetCtx.fillText(mark, w - padding.right, ratingY + Math.max(15, 20 * scale));
    targetCtx.font = `${Math.max(8, 12 * scale)}px "Architects Daughter"`;
    targetCtx.fillStyle = theme.text;
    targetCtx.fillText("MARK OUT OF 10", w - padding.right, ratingY);

    const gridWidth = Math.max(0.5, 1.5 * scale);
    levels.forEach((level, i) => {
        const y = padding.top + (i * (plotHeight / (levels.length - 1)));
        if (i !== levels.length -1) {
           sketchLine(targetCtx, padding.left, y, w - padding.right, y, theme.grid, gridWidth, 0.5, scale);
        }
        targetCtx.fillStyle = theme.text;
        targetCtx.font = `${Math.max(9, 14 * scale)}px "Architects Daughter"`;
        targetCtx.textAlign = 'right';
        targetCtx.textBaseline = 'middle';
        targetCtx.fillText(level, padding.left - (15 * scale + 5), y);
    });

    months.forEach((month, i) => {
        const x = padding.left + (i * (plotWidth / (months.length - 1)));
        targetCtx.fillStyle = theme.text;
        targetCtx.font = `${Math.max(10, 14 * scale)}px "Architects Daughter"`;
        let yBase = h - padding.bottom + (20 * scale + 5);
        if (scale < 0.5) {
            targetCtx.save();
            targetCtx.translate(x, yBase);
            targetCtx.rotate(-Math.PI / 2);
            targetCtx.textAlign = 'right';
            targetCtx.textBaseline = 'middle';
            targetCtx.fillText(month, 0, 0);
            targetCtx.restore();
        } else {
            targetCtx.textAlign = 'center';
            targetCtx.textBaseline = 'top';
            targetCtx.fillText(month, x, yBase);
        }
    });

    const pts = points.map(p => ({
        x: padding.left + (p.index * (plotWidth / (months.length - 1))),
        y: padding.top + (1 - p.val) * plotHeight
    }));

    if (pts.length >= 2) {
        let splinePoints = [];
        for (let i = 0; i < pts.length - 1; i++) {
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const cpOffset = (p2.x - p1.x) / 2;
            const seedCurve = (i * 123);
            for(let t = 0; t <= 1; t += 1/20) {
                const invT = 1 - t;
                const b0 = invT * invT * invT;
                const b1 = 3 * invT * invT * t;
                const b2 = 3 * invT * t * t;
                const b3 = t * t * t;
                const x = b0 * p1.x + b1 * (p1.x + cpOffset) + b2 * (p2.x - cpOffset) + b3 * p2.x;
                const y = b0 * p1.y + b1 * p1.y + b2 * p2.y + b3 * p2.y;
                // Scale spline roughness
                const rx = (Math.sin(seedCurve + t * 10) * 0.5) * theme.roughness * scale;
                const ry = (Math.cos(seedCurve + t * 10) * 0.5) * theme.roughness * scale;
                splinePoints.push({x: x + rx, y: y + ry});
            }
        }
        targetCtx.save();
        targetCtx.beginPath();
        targetCtx.moveTo(pts[0].x, pts[0].y);
        splinePoints.forEach(p => targetCtx.lineTo(p.x, p.y));
        targetCtx.lineTo(pts[pts.length - 1].x, h - padding.bottom);
        targetCtx.lineTo(pts[0].x, h - padding.bottom);
        targetCtx.closePath();
        targetCtx.fillStyle = theme.fill;
        targetCtx.fill();
        targetCtx.restore();

        targetCtx.beginPath();
        targetCtx.strokeStyle = theme.line;
        targetCtx.lineWidth = Math.max(2, 4 * scale);
        targetCtx.lineCap = 'round';
        targetCtx.moveTo(splinePoints[0].x, splinePoints[0].y);
        splinePoints.forEach(p => targetCtx.lineTo(p.x, p.y));
        targetCtx.stroke();
    }

    const dotSize = Math.max(3, 5 * scale);
    pts.forEach((p, idx) => {
        targetCtx.save();
        targetCtx.translate(p.x, p.y);
        targetCtx.beginPath();
        targetCtx.arc(0, 0, dotSize * 0.6, 0, Math.PI * 2);
        targetCtx.fillStyle = theme.points;
        targetCtx.fill();
        targetCtx.restore();
    });

    if (isExport) {
        targetCtx.fillStyle = theme.text;
        targetCtx.font = `${Math.max(12, 16 * scale)}px "Architects Daughter"`;
        targetCtx.textAlign = 'right';
        targetCtx.textBaseline = 'bottom';
        targetCtx.fillText("github.com/meneon114", w - 20, h - 20);
    }
}

function draw() {
    let needsRedraw = false;
    points.forEach(p => {
        const diff = p.targetVal - p.val;
        if (Math.abs(diff) > 0.001) {
            p.val += diff * LERP_FACTOR;
            needsRedraw = true;
        } else {
            p.val = p.targetVal;
        }
    });
    render(ctx, width, height, false);
    if (needsRedraw) requestAnimationFrame(draw);
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
    const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
    return {
        x: (clientX - rect.left) * (width / rect.width),
        y: (clientY - rect.top) * (height / rect.height)
    };
}

function startDragging(e) {
    const pos = getMousePos(e);
    const { padding, plotWidth } = getLayout(width, height);
    if (pos.y < padding.top - 15 || pos.y > height - padding.bottom + 15) return; 

    let closestPoint = null;
    let minHorizontalDist = Infinity;
    const columnWidth = plotWidth / (months.length - 1);
    const horizontalThreshold = columnWidth * 0.55; 
    
    points.forEach(p => {
        const pX = padding.left + (p.index * columnWidth);
        const dx = Math.abs(pX - pos.x);
        if (dx < horizontalThreshold) {
            if (dx < minHorizontalDist) {
                minHorizontalDist = dx;
                closestPoint = p;
            }
        }
    });
    if (closestPoint) {
        draggingPoint = closestPoint;
        if (e.touches && e.cancelable) e.preventDefault();
    }
}

const handleInput = (e) => {
    if (!draggingPoint) return;
    if (e.cancelable) e.preventDefault();
    const pos = getMousePos(e);
    const { padding, plotHeight } = getLayout(width, height);
    let val = 1 - (pos.y - padding.top) / plotHeight;
    val = Math.max(0, Math.min(1, val));
    draggingPoint.targetVal = Math.round(val * 5) / 5;
    draw();
};

canvas.addEventListener('mousedown', startDragging);
canvas.addEventListener('touchstart', startDragging, { passive: false });
window.addEventListener('mousemove', handleInput);
window.addEventListener('touchmove', handleInput, { passive: false });
window.addEventListener('mouseup', () => draggingPoint = null);
window.addEventListener('touchend', () => draggingPoint = null);

resetBtn.addEventListener('click', () => { 
    createInitialPoints(); 
    draw(); 
});

openSaveBtn.addEventListener('click', () => modal.style.display = 'flex');
function closeModal() { modal.style.display = 'none'; }

function exportGraph(w, h, ratioName) {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w; exportCanvas.height = h;
    render(exportCanvas.getContext('2d'), w, h, true);
    const link = document.createElement('a');
    link.download = `sketch-my-year-${ratioName}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
    closeModal();
}

window.addEventListener('resize', () => { resize(); draw(); });
window.onload = () => { resize(); createInitialPoints(); setTheme('sketch'); };