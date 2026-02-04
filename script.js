// --- Konfigurasi & State ---
let state = {
    limit: 0,
    photos: [],
    isCapturing: false,
    stream: null
};

const dom = {
    setup: document.getElementById('scene-setup'),
    action: document.getElementById('scene-action'),
    video: document.getElementById('video-feed'),
    canvas: document.getElementById('proc-canvas'),
    countdown: document.getElementById('countdown-overlay'),
    gallery: document.getElementById('sticker-gallery'),
    btnCapture: document.getElementById('btn-capture'),
    btnDownload: document.getElementById('btn-download'),
    btnRetake: document.getElementById('btn-retake'),
    badge: document.getElementById('counter-badge'),
    flash: document.getElementById('flash-overlay'),
    sound: document.getElementById('shutter-sound')
};

const ctx = dom.canvas.getContext('2d');

// --- 1. Inisialisasi Kamera ---
async function initCamera() {
    try {
        state.stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720, facingMode: "user" }, 
            audio: false 
        });
        dom.video.srcObject = state.stream;
    } catch (e) {
        alert("Ups! Kamera tidak bisa diakses. Pastikan izin diberikan ya! 🥺");
        console.error(e);
    }
}
initCamera();

// --- 2. Navigasi Antar Layar ---
function startBooth(count) {
    state.limit = count;
    state.photos = [];
    dom.badge.innerText = `0 / ${count} Pose`;
    dom.gallery.innerHTML = '<div class="empty-sticker">Siap berpose? 😉</div>';
    
    // Animasi ganti layar
    dom.setup.classList.remove('active');
    dom.setup.classList.add('hidden');
    setTimeout(() => {
        dom.action.classList.remove('hidden');
        dom.action.classList.add('active');
        dom.video.play();
    }, 300);

    // Reset tombol
    dom.btnCapture.disabled = false;
    dom.btnCapture.innerText = "📸 MULAI FOTO YUK!";
    dom.btnDownload.classList.add('hidden');
    dom.btnRetake.classList.add('hidden');
}

function resetToSetup() {
    dom.action.classList.remove('active');
    dom.action.classList.add('hidden');
    setTimeout(() => {
        dom.setup.classList.remove('hidden');
        dom.setup.classList.add('active');
    }, 300);
}

// --- 3. Proses Pengambilan Foto ---
async function startCaptureSequence() {
    if(state.isCapturing || !state.stream) return;
    state.isCapturing = true;
    dom.btnCapture.disabled = true;
    dom.btnRetake.classList.add('hidden');
    dom.gallery.innerHTML = ''; // Hapus placeholder

    for (let i = 1; i <= state.limit; i++) {
        dom.btnCapture.innerText = `✨ Pose ke-${i} dari ${state.limit}...`;
        
        await runKawaiiCountdown(3);
        triggerKawaiiEffects();
        
        const photoData = takePicture();
        state.photos.push(photoData);
        addStickerToGallery(photoData);
        dom.badge.innerText = `${i} / ${state.limit} Pose`;

        if (i < state.limit) {
            await new Promise(r => setTimeout(r, 1500)); // Jeda antar foto
        }
    }
    finishSession();
}

// --- 4. Fungsi Pendukung ---
function runKawaiiCountdown(sec) {
    return new Promise(resolve => {
        let count = sec;
        dom.countdown.innerText = count;
        dom.countdown.style.opacity = 1;
        
        const int = setInterval(() => {
            count--;
            if (count > 0) dom.countdown.innerText = count;
            else {
                clearInterval(int);
                dom.countdown.innerText = "CHEESE! 😁";
                setTimeout(() => { 
                    dom.countdown.innerText = ""; 
                    resolve();
                }, 500);
            }
        }, 1000);
    });
}

function triggerKawaiiEffects() {
    // Flash lembut
    dom.flash.classList.add('flash-active');
    setTimeout(() => dom.flash.classList.remove('flash-active'), 250);
    
    // Suara lucu
    dom.sound.currentTime = 0;
    dom.sound.play().catch(()=>{}); 
}

function takePicture() {
    dom.canvas.width = dom.video.videoWidth;
    dom.canvas.height = dom.video.videoHeight;
    // Mirroring di canvas
    ctx.translate(dom.canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(dom.video, 0, 0);
    return dom.canvas.toDataURL('image/jpeg', 0.9);
}

function addStickerToGallery(src) {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'sticker-img';
    dom.gallery.appendChild(img);
    dom.gallery.scrollTop = dom.gallery.scrollHeight;
}

function finishSession() {
    state.isCapturing = false;
    dom.btnCapture.innerText = "🎉 YAY! Selesai!";
    dom.btnCapture.classList.add('hidden');
    dom.btnDownload.classList.remove('hidden');
    dom.btnRetake.classList.remove('hidden');
}

// --- 5. Generator Strip Lucu (Download) ---
async function downloadKawaiiStrip() {
    dom.btnDownload.innerText = "Sedang Menghias... 🎨";
    dom.btnDownload.disabled = true;

    const pWidth = 600; const pHeight = 450;
    const padding = 40; const headerH = 150; const footerH = 80;
    const totalH = headerH + footerH + (state.photos.length * (pHeight + padding)) + padding;
    
    dom.canvas.width = pWidth + (padding * 2);
    dom.canvas.height = totalH;
    
    // 1. Background Lucu (Krim + Polkadot)
    ctx.fillStyle = "#fff5cc"; // Kuning krim
    ctx.fillRect(0, 0, dom.canvas.width, dom.canvas.height);
    // Tambah pola titik-titik sederhana
    ctx.fillStyle = "#ffcce040"; // Pink transparan
    for(let x=0; x<dom.canvas.width; x+=30) {
        for(let y=0; y<dom.canvas.height; y+=30) {
            ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI*2); ctx.fill();
        }
    }
    
    // 2. Header Teks Lucu
    ctx.setTransform(1,0,0,1,0,0); // Reset mirror
    ctx.fillStyle = "#ff6699"; // Pink tua
    ctx.font = "bold 60px 'Fredoka One', cursive";
    ctx.textAlign = "center";
    ctx.fillText("✨ My Photobooth ✨", dom.canvas.width/2, 80);
    
    ctx.font = "30px 'Baloo 2', cursive";
    ctx.fillStyle = "#5c4b51";
    const dateStr = new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long'});
    ctx.fillText(`Kenangan Manis - ${dateStr}`, dom.canvas.width/2, 130);

    // 3. Gambar Foto dengan Bingkai Jahitan
    let currentY = headerH + padding;
    const loadImage = src => new Promise(r => { let i=new Image(); i.onload=()=>r(i); i.src=src; });
    
    for(let i=0; i<state.photos.length; i++){
        const img = await loadImage(state.photos[i]);
        
        // Bingkai Putus-putus (Efek Jahitan)
        ctx.setLineDash([15, 10]);
        ctx.lineWidth = 8;
        ctx.strokeStyle = (i % 2 === 0) ? "#cce5ff" : "#ffcce0"; // Selang-seling biru/pink
        ctx.strokeRect(padding-10, currentY-10, pWidth+20, pHeight+20);
        ctx.setLineDash([]); // Reset dash

        // Border putih tebal di sekeliling foto
        ctx.fillStyle = "white";
        ctx.fillRect(padding-5, currentY-5, pWidth+10, pHeight+10);
        
        ctx.drawImage(img, padding, currentY, pWidth, pHeight);
        currentY += pHeight + padding;
    }
    
    // 4. Footer
    ctx.fillStyle = "#888"; ctx.font = "italic 20px 'Baloo 2'";
    ctx.fillText("Dibuat dengan penuh cinta di My Photobooth 💖", dom.canvas.width/2, totalH - 30);

    // ... (kode canvas menggambar foto sebelumnya tetap sama) ...

// GANTI BAGIAN "Trigger Download" DENGAN INI:

dom.canvas.toBlob(async (blob) => {
    // 1. Cek apakah browser mendukung fitur Share native (HP biasanya support)
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], "foto.jpg")] })) {
        
        const file = new File([blob], "photobooth-result.jpg", { type: "image/jpeg" });

        try {
            await navigator.share({
                title: 'Kawaii Photobooth ✨',
                text: 'Liat deh hasil fotoku! 📸',
                files: [file]
            });
            dom.btnDownload.innerText = "Berhasil Di-share! 💖";
        } catch (err) {
            console.log("Share dibatalkan/gagal", err);
            // Fallback: Jika batal share, tetap download manual
            downloadManual(dom.canvas); 
        }

    } else {
        // 2. Jika dibuka di Laptop (yang gak punya menu share sosmed), langsung download biasa
        downloadManual(dom.canvas);
    }
}, 'image/jpeg', 0.95);

// Fungsi bantuan untuk download manual
function downloadManual(canvas) {
    const link = document.createElement('a');
    link.download = `Kawaii-Snaps-${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
    dom.btnDownload.innerText = "Tersimpan di Galeri! 📂";
}

dom.btnDownload.disabled = false;
}