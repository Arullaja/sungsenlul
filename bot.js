const venom = require('venom-bot');
const QRCode = require('qrcode');
const express = require('express');

const CONFIG = {
  namaPerusahaan: 'Rental Mobil Bandung',
  noAdmin: '6281234567890',
  jamOperasional: '08:00 - 20:00 WIB',
  lokasi: 'Jl. Contoh No. 123, Bandung',
  kontakAdmin: '0812-3456-7890',
};

const ARMADA = {
  '1':  { nama: 'Toyota Fortuner',         kategori: 'Premium SUV',          harga: 650000, kapasitas: 7, transmisi: 'Matic',  sopir: true  },
  '2':  { nama: 'Toyota Avanza TSS',       kategori: 'Family MPV',            harga: 350000, kapasitas: 7, transmisi: 'Matic',  sopir: true  },
  '3':  { nama: 'Toyota Innova Reborn',    kategori: 'Premium',               harga: 450000, kapasitas: 7, transmisi: 'Matic',  sopir: true  },
  '4':  { nama: 'Toyota Calya',            kategori: 'LCGC MPV',              harga: 300000, kapasitas: 7, transmisi: 'Manual', sopir: false },
  '5':  { nama: 'Toyota Agya',             kategori: 'LCGC City Car',         harga: 300000, kapasitas: 4, transmisi: 'Matic',  sopir: false },
  '6':  { nama: 'Toyota Innova Zenix',     kategori: 'Premium Hybrid MPV',    harga: 550000, kapasitas: 7, transmisi: 'Matic',  sopir: true  },
  '7':  { nama: 'Mitsubishi Pajero Sport', kategori: 'Premium SUV',           harga: 600000, kapasitas: 7, transmisi: 'Matic',  sopir: true  },
  '8':  { nama: 'Honda Brio RS',           kategori: 'City Car',              harga: 300000, kapasitas: 5, transmisi: 'Matic',  sopir: false },
  '9':  { nama: 'Daihatsu Xenia',          kategori: 'Family MPV',            harga: 350000, kapasitas: 7, transmisi: 'Manual', sopir: false },
};

const sessions = {};
function getSession(id) {
  if (!sessions[id]) sessions[id] = { step: 'MENU', data: {} };
  return sessions[id];
}
function resetSession(id) { sessions[id] = { step: 'MENU', data: {} }; }

function pesanMenu() {
  return `🚗 *${CONFIG.namaPerusahaan}*\n━━━━━━━━━━━━━━━━━━━━━\nSelamat datang! Pilih menu:\n\n*1️⃣ Lihat Daftar Mobil*\n*2️⃣ Booking Sekarang*\n*3️⃣ Syarat & Ketentuan*\n*4️⃣ Hubungi Admin*\n*5️⃣ Lokasi & Jam Buka*\n\n_Ketik angka untuk memilih_`;
}

function pesanDaftarMobil() {
  let msg = `🚗 *DAFTAR ARMADA*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
  for (const [key, m] of Object.entries(ARMADA)) {
    msg += `*${key}. ${m.nama}*\n   📌 ${m.kategori} | ⚙️ ${m.transmisi}\n   💰 Rp ${m.harga.toLocaleString('id-ID')}/hari | 👥 ${m.kapasitas} kursi\n\n`;
  }
  msg += `_Ketik nomor untuk booking atau *BACK* untuk kembali_`;
  return msg;
}

function pesanKonfirmasi(data, mobil) {
  const total = (mobil.harga + (data.pakaiSopir ? 150000 : 0)) * data.lamaHari;
  return `📝 *KONFIRMASI PESANAN*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 *Nama :* ${data.nama}\n📱 *No WA :* ${data.noWA}\n🆘 *Darurat :* ${data.kontakDarurat}\n📧 *Email :* ${data.email}\n🪪 *NIM/NIK :* ${data.nik}\n\n` +
    (data.status === 'mahasiswa'
      ? `🎓 ${data.universitas} | ${data.jurusan} | ${data.angkatan}\n`
      : `💼 ${data.tempatKerja} | ${data.divisi}\n`) +
    `\n🚗 *${mobil.nama}* (${mobil.kategori})\n📅 ${data.tanggalMulai} → ${data.tanggalSelesai} (${data.lamaHari} hari)\n👨‍✈️ Sopir: ${data.pakaiSopir ? 'Ya (+Rp 150.000/hari)' : 'Tidak'}\n\n💰 *Total: Rp ${total.toLocaleString('id-ID')}*\n\n*1. ✅ Konfirmasi*\n*2. ❌ Batalkan*`;
}

// Web server QR
let lastQR = null;
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  if (!lastQR) {
    return res.send(`<html><head><meta http-equiv="refresh" content="5"><style>body{font-family:sans-serif;text-align:center;padding:50px;background:#f0f9f4}</style></head><body><h2>⏳ Menunggu QR...</h2><p>Auto refresh tiap 5 detik</p></body></html>`);
  }
  const qrImg = await QRCode.toDataURL(lastQR, { width: 400 });
  res.send(`<html><head><meta http-equiv="refresh" content="20"><style>body{font-family:sans-serif;text-align:center;padding:40px;background:#f0f9f4}.box{background:white;display:inline-block;padding:30px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.1)}h2{color:#1a7a4a}</style></head><body><div class="box"><h2>📱 Scan QR WhatsApp</h2><img src="${qrImg}" width="300"/><p>Auto refresh 20 detik</p><p style="color:gray;font-size:13px">WhatsApp → Perangkat Tertaut → Tautkan Perangkat</p></div></body></html>`);
});

app.listen(PORT, '0.0.0.0', () => console.log(`🌐 Web QR aktif: port ${PORT}`));

// Handler pesan
async function handlePesan(client, from, body) {
  const session = getSession(from);
  const input = body.trim();
  console.log(`📨 ${new Date().toLocaleTimeString('id-ID')} | ${from}: ${input}`);

  const kirim = async (teks) => {
    try { await client.sendText(from, teks); } catch(e) { console.error('Gagal kirim:', e.message); }
  };

  if (/^(halo|hai|hi|hello|start|mulai|menu)$/i.test(input)) { resetSession(from); await kirim(pesanMenu()); return; }
  if (/^back$/i.test(input)) { resetSession(from); await kirim(pesanMenu()); return; }

  switch (session.step) {
    case 'MENU':
      if (input === '1') { session.step = 'LIHAT_MOBIL'; await kirim(pesanDaftarMobil()); }
      else if (input === '2') { session.step = 'INPUT_NAMA'; await kirim(`📝 *FORM BOOKING*\n━━━━━━━━━━━━━━━━━━━━━\n\n👤 Masukkan *Nama Lengkap*:`); }
      else if (input === '3') await kirim(`📋 *SYARAT*\n━━━━━━━━━━━━━━━━━━━━━\n✅ KTP + SIM A + KK\n✅ Minimal 1 hari\n✅ Deposit Rp 500rb-1jt\n✅ BBM penyewa\n✅ Batal <24jam = 50%\n\n_Ketik *BACK* kembali_`);
      else if (input === '4') await kirim(`👨‍💼 *ADMIN*\n━━━━━━━━━━━━━━━━━━━━━\n📞 ${CONFIG.kontakAdmin}\n🕐 ${CONFIG.jamOperasional}`);
      else if (input === '5') await kirim(`📍 *LOKASI*\n━━━━━━━━━━━━━━━━━━━━━\n🏢 ${CONFIG.lokasi}\n🕐 ${CONFIG.jamOperasional}`);
      else await kirim(pesanMenu());
      break;

    case 'LIHAT_MOBIL':
      if (ARMADA[input]) { session.data.mobilKey = input; session.step = 'INPUT_NAMA'; await kirim(`✅ *${ARMADA[input].nama}*\n\n👤 Masukkan *Nama Lengkap*:`); }
      else await kirim(pesanDaftarMobil());
      break;

    case 'INPUT_NAMA':
      if (input.length < 3) { await kirim('❌ Nama terlalu pendek:'); break; }
      session.data.nama = input; session.step = 'INPUT_NOWA';
      await kirim(`👋 Halo *${input}*!\n📱 Masukkan *No WhatsApp*:\nContoh: 08123456789`); break;

    case 'INPUT_NOWA':
      if (!/^08[0-9]{8,12}$/.test(input)) { await kirim('❌ Format salah. Contoh: 08123456789'); break; }
      session.data.noWA = input; session.step = 'INPUT_KONDARURAT';
      await kirim(`🆘 Masukkan *No Kontak Darurat*:`); break;

    case 'INPUT_KONDARURAT':
      if (!/^08[0-9]{8,12}$/.test(input)) { await kirim('❌ Format salah. Contoh: 08123456789'); break; }
      session.data.kontakDarurat = input; session.step = 'INPUT_EMAIL';
      await kirim(`📧 Masukkan *Email*:`); break;

    case 'INPUT_EMAIL':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) { await kirim('❌ Format salah. Contoh: nama@email.com'); break; }
      session.data.email = input; session.step = 'INPUT_NIK';
      await kirim(`🪪 Masukkan *NIM / NIK*:`); break;

    case 'INPUT_NIK':
      if (input.length < 5) { await kirim('❌ Terlalu pendek:'); break; }
      session.data.nik = input; session.step = 'INPUT_STATUS';
      await kirim(`📋 *Status:*\n*1. 🎓 Mahasiswa*\n*2. 💼 Pekerja*`); break;

    case 'INPUT_STATUS':
      if (input === '1') { session.data.status = 'mahasiswa'; session.step = 'INPUT_UNIVERSITAS'; await kirim(`🎓 *Universitas*:`); }
      else if (input === '2') { session.data.status = 'pekerja'; session.step = 'INPUT_TEMPAT_KERJA'; await kirim(`🏢 *Tempat Kerja*:`); }
      else await kirim('Ketik *1* atau *2*:');
      break;

    case 'INPUT_UNIVERSITAS': session.data.universitas = input; session.step = 'INPUT_JURUSAN'; await kirim(`📚 *Jurusan*:`); break;
    case 'INPUT_JURUSAN': session.data.jurusan = input; session.step = 'INPUT_ANGKATAN'; await kirim(`📅 *Angkatan* (contoh: 2022):`); break;
    case 'INPUT_ANGKATAN': session.data.angkatan = input; session.step = 'PILIH_MOBIL_BOOKING'; await kirim(`✅ Tersimpan!\n\n${pesanDaftarMobil()}`); break;
    case 'INPUT_TEMPAT_KERJA': session.data.tempatKerja = input; session.step = 'INPUT_DIVISI'; await kirim(`🏬 *Divisi*:`); break;
    case 'INPUT_DIVISI': session.data.divisi = input; session.step = 'PILIH_MOBIL_BOOKING'; await kirim(`✅ Tersimpan!\n\n${pesanDaftarMobil()}`); break;

    case 'PILIH_MOBIL_BOOKING':
      if (ARMADA[input]) {
        session.data.mobilKey = input; session.step = 'INPUT_TANGGAL_MULAI';
        await kirim(`✅ *${ARMADA[input].nama}*\n\n📅 *Tanggal pengambilan* (DD/MM/YYYY):`);
      } else await kirim(`❌ Tidak valid.\n\n${pesanDaftarMobil()}`);
      break;

    case 'INPUT_TANGGAL_MULAI': {
      const re = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      if (!re.test(input)) { await kirim('❌ Format: DD/MM/YYYY'); break; }
      const [,d,m,y] = input.match(re);
      const tgl = new Date(`${y}-${m}-${d}`);
      if (isNaN(tgl)) { await kirim('❌ Tanggal tidak valid:'); break; }
      session.data.tanggalMulai = input; session.data.tglObj = tgl;
      session.step = 'INPUT_DURASI';
      await kirim(`⏱️ *Durasi sewa* (hari):\nContoh: 2`); break;
    }

    case 'INPUT_DURASI': {
      const dur = parseInt(input);
      if (isNaN(dur) || dur < 1) { await kirim('❌ Minimal 1 hari:'); break; }
      session.data.lamaHari = dur;
      const selesai = new Date(session.data.tglObj);
      selesai.setDate(selesai.getDate() + dur);
      session.data.tanggalSelesai = `${String(selesai.getDate()).padStart(2,'0')}/${String(selesai.getMonth()+1).padStart(2,'0')}/${selesai.getFullYear()}`;
      const mobil = ARMADA[session.data.mobilKey];
      if (mobil.sopir) {
        session.step = 'PILIH_SOPIR';
        await kirim(`📅 Selesai: *${session.data.tanggalSelesai}*\n\n🧑‍✈️ *Pakai Sopir?* (+Rp 150rb/hari)\n*1. ✅ Ya*\n*2. ❌ Tidak*`);
      } else {
        session.data.pakaiSopir = false; session.step = 'KONFIRMASI';
        await kirim(pesanKonfirmasi(session.data, mobil));
      }
      break;
    }

    case 'PILIH_SOPIR':
      if (input === '1') session.data.pakaiSopir = true;
      else if (input === '2') session.data.pakaiSopir = false;
      else { await kirim('Ketik *1* Ya atau *2* Tidak:'); break; }
      session.step = 'KONFIRMASI';
      await kirim(pesanKonfirmasi(session.data, ARMADA[session.data.mobilKey]));
      break;

    case 'KONFIRMASI':
      if (input === '1') {
        const mobil = ARMADA[session.data.mobilKey];
        const d = session.data;
        const adminMsg = `🔔 *PESANAN BARU!*\n━━━━━━━━━━━━━━━━━━━━━\n👤 ${d.nama} | 📱 ${d.noWA}\n🆘 ${d.kontakDarurat} | 📧 ${d.email}\n🪪 ${d.nik}\n` +
          (d.status === 'mahasiswa' ? `🎓 ${d.universitas} | ${d.jurusan} | ${d.angkatan}\n` : `💼 ${d.tempatKerja} | ${d.divisi}\n`) +
          `🚗 ${mobil.nama} | 📅 ${d.tanggalMulai}→${d.tanggalSelesai} (${d.lamaHari}hr)\n👨‍✈️ ${d.pakaiSopir?'Pakai sopir':'Self drive'}\n💰 Rp ${((mobil.harga+(d.pakaiSopir?150000:0))*d.lamaHari).toLocaleString('id-ID')}`;
        try { await client.sendText(`${CONFIG.noAdmin}@c.us`, adminMsg); } catch(e) {}
        await kirim(`✅ *PESANAN DITERIMA!*\n\nTerima kasih *${d.nama}*!\nAdmin hubungi dalam 1x24 jam.\n📞 ${CONFIG.kontakAdmin}\n\n_Ketik *MENU* untuk kembali_`);
        resetSession(from);
      } else if (input === '2') {
        resetSession(from); await kirim('❌ Dibatalkan. Ketik *MENU* kembali.');
      } else await kirim('Ketik *1* konfirmasi atau *2* batalkan.');
      break;

    default: resetSession(from); await kirim(pesanMenu());
  }
}

// Start venom
console.log('🚀 Memulai Bot WhatsApp Rental Mobil...');

// Hapus sesi lama
const { execSync } = require('child_process');
try { execSync('rm -rf /app/tokens/rental-bot'); console.log('🗑️ Sesi lama dihapus.'); } catch(e) {}

venom.create(
  'rental-bot',
  (base64Qr, asciiQR, attempts, urlCode) => {
    lastQR = urlCode; // simpan string QR asli
    console.log(`📱 QR tersedia (percobaan ${attempts})! Buka domain Railway untuk scan.`);
  },
  (statusSession) => {
    console.log('📊 Status:', statusSession);
    if (statusSession === 'qrReadSuccess' || statusSession === 'inChat') {
      lastQR = null;
    }
  },
  {
    headless: 'new',
    devtools: false,
    useChrome: false,
    debug: false,
    logQR: false,
    autoClose: 0,
    createPathFileToken: true,
    waitForLogin: true,
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-translate',
      '--no-first-run',
      '--single-process',
      '--memory-pressure-off',
      '--max_old_space_size=512',
    ],
    executablePath: '/usr/bin/chromium',
    folderNameToken: '/app/tokens',
  }
).then((client) => {
  lastQR = null;
  console.log('✅ Bot WhatsApp Rental Mobil AKTIF!');
  console.log(`🏢 ${CONFIG.namaPerusahaan}`);

  client.onMessage(async (msg) => {
    if (msg.isGroupMsg || msg.from === 'status@broadcast') return;
    if (msg.type !== 'chat') return;
    try {
      await handlePesan(client, msg.from, msg.body);
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
  });

  client.onStateChange((state) => {
    console.log('🔄 State:', state);
    if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
      client.useHere();
    }
  });

}).catch((err) => {
  console.error('❌ Gagal start:', err.message);
  try { execSync('rm -rf /app/tokens/rental-bot'); } catch(e) {}
  setTimeout(() => process.exit(1), 3000);
});
