// =========================================
// KONFIGURASI & STATE
// =========================================
let state = { count: 0, photos: [], limit: 0, shooting: false, filter: 'none' };

// DOM ELEMENTS
const dom = {
    home: document.getElementById('scene-home'),
    cam: document.getElementById('scene-cam'),
    video: document.getElementById('video-feed'),
    canvas: document.getElementById('canvas-proc'),
    countdown: document.getElementById('countdown'),
    gallery: document.getElementById('gallery-scroll'),
    btnSnap: document.getElementById('btn-snap'),
    btnBack: document.getElementById('btn-back'),
    btnSave: document.getElementById('btn-save'),
    badge: document.getElementById('counter'),
    flash: document.getElementById('flash-overlay'),
    audio: document.getElementById('shutter-sound'),
    confettiBox: document.getElementById('confetti-container')
};
const ctx = dom.canvas.getContext('2d');

// =========================================
// 1. SETUP KAMERA (UNIVERSAL HP/LAPTOP)
// =========================================
async function init() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: "user", // Prioritas kamera depan (HP)
                width: { ideal: 1280 }, 
                height: { ideal: 720 } 
            }, 
            audio: false
        });
        dom.video.srcObject = stream;
    } catch(e) { 
        console.log(e); 
        alert("Gagal akses kamera. Pastikan izin diberikan! 📸"); 
    }
}
init();

// =========================================
// 2. NAVIGASI & FILTER
// =========================================
function startBooth(n) {
    state.limit = n; state.count = 0; state.photos = [];
    dom.badge.innerText = `0/${n}`;
    dom.gallery.innerHTML = '<div class="empty-state">Siap bergaya? ✨</div>';
    
    dom.home.classList.remove('active'); dom.home.classList.add('hidden');
    dom.cam.classList.remove('hidden'); dom.cam.classList.add('active');
    
    dom.btnSnap.classList.remove('hidden'); dom.btnSnap.disabled = false;
    dom.btnSave.classList.add('hidden'); dom.btnBack.classList.add('hidden');
}

function goHome() {
    dom.cam.classList.remove('active'); dom.cam.classList.add('hidden');
    dom.home.classList.remove('hidden'); dom.home.classList.add('active');
}

function setFilter(name) {
    state.filter = name;
    // Ubah class video agar user melihat preview filter secara realtime
    dom.video.className = name;
    
    // Update tampilan tombol aktif
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// =========================================
// 3. LOGIKA FOTO & SEQUENCE
// =========================================
async function startSequence() {
    state.shooting = true;
    dom.btnSnap.disabled = true; dom.btnBack.classList.add('hidden');
    dom.gallery.innerHTML = '';

    for(let i=1; i<=state.limit; i++) {
        // Countdown
        for(let c=3; c>0; c--) {
            dom.countdown.innerText = c;
            await sleep(1000);
        }
        dom.countdown.innerText = "📸";
        
        // Efek Capture
        dom.flash.classList.add('flash');
        dom.audio.currentTime = 0; dom.audio.play().catch(()=>{});
        
        // Ambil Data Gambar
        const imgData = captureWithFilter();
        state.photos.push(imgData);
        addThumb(imgData);
        dom.badge.innerText = `${i}/${state.limit}`;
        
        // Reset Efek
        await sleep(200);
        dom.flash.classList.remove('flash');
        dom.countdown.innerText = "";
        
        // Jeda antar foto
        if(i < state.limit) await sleep(1500);
    }
    
    finish();
}

function captureWithFilter() {
    dom.canvas.width = dom.video.videoWidth;
    dom.canvas.height = dom.video.videoHeight;
    
    // Terapkan Filter Pilihan ke Canvas
    ctx.filter = getCanvasFilter(state.filter);
    
    // Mirroring (Membalik gambar agar seperti cermin)
    ctx.translate(dom.canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(dom.video, 0, 0);
    
    // Reset Canvas untuk proses berikutnya
    ctx.setTransform(1,0,0,1,0,0); 
    ctx.filter = 'none'; 
    
    return dom.canvas.toDataURL('image/jpeg', 0.95);
}

function getCanvasFilter(name) {
    if(name === 'soft') return 'contrast(90%) brightness(110%) saturate(120%)';
    if(name === 'vintage') return 'sepia(40%) contrast(110%)';
    if(name === 'mono') return 'grayscale(100%)';
    return 'none';
}

function addThumb(src) {
    const img = document.createElement('img');
    img.src = src; img.className = 'thumb';
    dom.gallery.appendChild(img);
    dom.gallery.scrollTop = dom.gallery.scrollHeight;
}

function finish() {
    state.shooting = false;
    dom.btnSnap.classList.add('hidden');
    dom.btnSave.classList.remove('hidden');
    dom.btnBack.classList.remove('hidden');
    spawnConfetti(); // Efek Hujan Konfeti
}

// =========================================
// 4. EFEK VISUAL (CONFETTI)
// =========================================
function spawnConfetti() {
    for(let i=0; i<50; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.left = Math.random() * 100 + '%';
        c.style.animationDuration = (Math.random() * 2 + 2) + 's';
        c.style.background = `hsl(${Math.random()*360}, 100%, 70%)`;
        dom.confettiBox.appendChild(c);
        setTimeout(() => c.remove(), 4000);
    }
}

// =========================================
// 5. DOWNLOAD STRIP (FRAME LUCU + STIKER)
// =========================================
async function downloadStrip() {
    dom.btnSave.innerText = "Sedang Menghias... 🎨";
    dom.btnSave.disabled = true;

    if (state.photos.length === 0) return;
    
    // A. Persiapan Ukuran Dinamis
    const imgObj = await loadImage(state.photos[0]);
    const w = 600; // Lebar standar foto
    const h = imgObj.height * (w / imgObj.width); // Tinggi proporsional
    const pad = 50; // Jarak antar foto
    const headerH = 180;
    const footerH = 100;
    const borderThick = 15; // Ketebalan bingkai
    
    // Hitung total tinggi
    const totalH = headerH + footerH + (state.photos.length * (h + (borderThick*2) + pad));
    
    dom.canvas.width = w + (pad*2) + (borderThick*2);
    dom.canvas.height = totalH;
    
    // B. Latar Belakang Polkadot
    ctx.fillStyle = "#fff9e6"; // Cream
    ctx.fillRect(0,0, dom.canvas.width, dom.canvas.height);
    
    ctx.fillStyle = "#ffe0b2"; // Dots Oranye
    for(let x=0; x<dom.canvas.width; x+=50) {
        for(let y=0; y<dom.canvas.height; y+=50) {
            ctx.beginPath();
            const offsetX = (y % 100 === 0) ? 25 : 0;
            ctx.arc(x + offsetX, y, 8, 0, Math.PI*2);
            ctx.fill();
        }
    }
    
    // C. Header Judul
    ctx.textAlign = "center";
    ctx.shadowColor = "#ff8fa3"; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4; ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff"; 
    ctx.font = "bold 70px 'Fredoka One'";
    ctx.fillText(" My Photobooth!", dom.canvas.width/2, 100);
    
    ctx.shadowColor = "transparent"; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = "#546e7a";
    ctx.font = "30px 'Quicksand'";
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillText(`📅 Edisi: ${dateStr}`, dom.canvas.width/2, 150);
    
    // D. Loop Gambar & Frame
    let currentY = headerH + pad;
    const frameColors = ["#ff8fa3", "#80deea", "#a78bfa", "#f48fb1"];

    for(let i=0; i < state.photos.length; i++) {
        const img = await loadImage(state.photos[i]);
        const currentColor = frameColors[i % frameColors.length];

        const boxX = pad;
        const boxY = currentY;
        const boxW = w + (borderThick*2);
        const boxH = h + (borderThick*2);

        // Frame Dasar Putih (Shadow)
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "rgba(0,0,0,0.1)"; ctx.shadowBlur = 15; ctx.shadowOffsetY = 8;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

        // Garis Putus-putus (Jahitan)
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 5;
        ctx.setLineDash([15, 10]);
        ctx.strokeRect(boxX + 5, boxY + 5, boxW - 10, boxH - 10);
        ctx.setLineDash([]);

        // Gambar Foto
        ctx.drawImage(img, pad + borderThick, currentY + borderThick, w, h);

        // Stiker Emoji Sudut
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText(i % 2 === 0 ? "🎀" : "✨", boxX, boxY + 10); // Kiri Atas
        ctx.fillText(i % 2 === 0 ? "💖" : "🍭", boxX + boxW, boxY + boxH); // Kanan Bawah

        currentY += boxH + pad;
    }

    // E. Footer
    ctx.textAlign = "center";
    ctx.fillStyle = "#888";
    ctx.font = "italic 24px 'Quicksand'";
    ctx.fillText("Dibuat dengan penuh ✨ di My Photobooth", dom.canvas.width/2, totalH - 40);
    
    // F. Download File
    const link = document.createElement('a');
    link.download = `MyPhotobooth-${Date.now()}.jpg`;
    link.href = dom.canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    
    dom.btnSave.innerText = "✨ Selesai! ✨";
    dom.btnSave.disabled = false;
    setTimeout(() => {
        if(dom.btnSave.innerText === "✨ Selesai! ✨") dom.btnSave.innerText = "💖 SIMPAN STRIP";
    }, 3000);
}

// =========================================
// 6. HELPER FUNCTIONS (JANGAN DIHAPUS!)
// =========================================
function loadImage(src) { 
    return new Promise(resolve => { 
        let img = new Image(); 
        img.onload = () => resolve(img); 
        img.src = src; 
    }); 
}

function sleep(ms) { 
    return new Promise(resolve => setTimeout(resolve, ms)); 
}
