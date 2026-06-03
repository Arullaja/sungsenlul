const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const http = require('http');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// ============================================================
//  KONFIGURASI BOT RENTAL MOBIL
// ============================================================
const CONFIG = {
  namaPerusahaan: 'Rental Mobil Bandung',
  noAdmin: '082118776639', // Ganti dengan nomor admin/pemilik (tanpa +)
  jamOperasional: '24 JAM',
  lokasi: 'Jl. ADHYAKSA BARAT III',
  kontakAdmin: '0821-3029-5912',
};

// ============================================================
//  DATA ARMADA MOBIL
// ============================================================
const ARMADA = {
  '1':  { nama: 'Toyota Fortuner',         kategori: 'Premium SUV',          harga: 650000,  kapasitas: 7, transmisi: 'Matic',   mesin: '2.800cc (1GD-FTV) 4-Silinder Turbo Diesel',              headunit: '9 inci Touchscreen (NFC & Smartphone Connectivity)', sopir: true  },
  '2':  { nama: 'Toyota Avanza TSS',       kategori: 'Family MPV',            harga: 350000,  kapasitas: 7, transmisi: 'Matic',   mesin: '1.500cc (2NR-VE) 4-Silinder Dual VVT-i CVT',             headunit: '9 inci Floating Touchscreen',                         sopir: true  },
  '3':  { nama: 'Toyota Innova Reborn',    kategori: 'Premium',               harga: 450000,  kapasitas: 7, transmisi: 'Matic',   mesin: '2.400cc (2GD-FTV) Turbo Diesel 7-Seater',                headunit: '9 inci Touchscreen (NFC & Smartphone Connectivity)', sopir: true  },
  '4':  { nama: 'Toyota Calya',            kategori: 'LCGC MPV',              harga: 300000,  kapasitas: 7, transmisi: 'Manual',  mesin: '1.200cc (3NR-VE) 4-Silinder Dual VVT-i',                headunit: 'Standard Audio System',                               sopir: false },
  '5':  { nama: 'Toyota Agya',             kategori: 'LCGC City Car',         harga: 300000,  kapasitas: 4, transmisi: 'Matic',   mesin: '1.200cc (1NR-VE) 4-Silinder Dual VVT-i',                headunit: '7 inci Touchscreen',                                  sopir: false },
  '6':  { nama: 'Toyota Innova Zenix',     kategori: 'Premium Hybrid MPV',    harga: 550000,  kapasitas: 7, transmisi: 'Matic',   mesin: '2.000cc (M20A-FKS) Bensin / Hybrid',                    headunit: '10 inci Floating Touchscreen (Smartphone Connectivity)', sopir: true  },
  '7':  { nama: 'Mitsubishi Pajero Sport', kategori: 'Premium SUV',           harga: 600000,  kapasitas: 7, transmisi: 'Matic',   mesin: '2.400cc (4N15) 4-Silinder MIVEC Turbo Diesel',          headunit: '8 inci Touchscreen (Smartphone Link Display)',         sopir: true  },
  '8':  { nama: 'Honda Brio RS',           kategori: 'City Car',              harga: 300000,  kapasitas: 5, transmisi: 'Matic',   mesin: '1.200cc (L12B) 4-Silinder i-VTEC CVT',                  headunit: '6.1 inci Touchscreen (Tipe RS)',                       sopir: false },
  '9':  { nama: 'Daihatsu Xenia',          kategori: 'Family MPV',            harga: 350000,  kapasitas: 7, transmisi: 'Manual',  mesin: '1.500cc (2NR-VE) 4-Silinder Dual VVT-i',                headunit: '9 inci Floating Touchscreen',                         sopir: false },
};

// ============================================================
//  STATE MANAGEMENT PENGGUNA
// ============================================================
const sessionUser = {};

function getSession(id) {
  if (!sessionUser[id]) sessionUser[id] = { step: 'MENU', data: {} };
  return sessionUser[id];
}

function resetSession(id) {
  sessionUser[id] = { step: 'MENU', data: {} };
}

// ============================================================
//  FORMAT PESAN
// ============================================================
function pesanMenu() {
  return `🚗 *${CONFIG.namaPerusahaan}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Selamat datang! Silakan pilih menu:\n\n` +
    `*1️⃣ Lihat Daftar Mobil*\n` +
    `*2️⃣ Booking Sekarang*\n` +
    `*3️⃣ Syarat & Ketentuan*\n` +
    `*4️⃣ Hubungi Admin*\n` +
    `*5️⃣ Lokasi & Jam Operasional*\n\n` +
    `_Ketik angka untuk memilih menu_`;
}

function pesanDaftarMobil() {
  let msg = `🚗 *DAFTAR ARMADA TERSEDIA*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
  for (const [key, mobil] of Object.entries(ARMADA)) {
    msg += `*${key}. ${mobil.nama}*\n`;
    msg += `   📌 ${mobil.kategori}\n`;
    msg += `   💰 Rp ${mobil.harga.toLocaleString('id-ID')}/hari\n`;
    msg += `   👥 Kapasitas: ${mobil.kapasitas} kursi\n`;
    msg += `   ⚙️ Transmisi: ${mobil.transmisi}\n`;
    msg += `   🔧 Mesin: ${mobil.mesin}\n`;
    msg += `   📺 Head Unit: ${mobil.headunit}\n`;
    msg += `   👨‍✈️ Tersedia sopir: ${mobil.sopir ? 'Ya' : 'Tidak'}\n\n`;
  }
  msg += `_Ketik nomor mobil untuk booking, atau *BACK* untuk kembali_`;
  return msg;
}

function pesanSyarat() {
  return `📋 *SYARAT & KETENTUAN*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `✅ *Dokumen yang diperlukan:*\n• KTP asli (wajib)\n• SIM A aktif\n• Kartu Keluarga (KK)\n\n` +
    `✅ *Ketentuan Sewa:*\n• Minimal sewa 1 hari (24 jam)\n• Deposit: Rp 500.000 - Rp 1.000.000\n• BBM ditanggung penyewa\n• Dilarang ke luar kota tanpa izin\n• Pembatalan < 24 jam dikenakan biaya 50%\n\n` +
    `✅ *Jam Pengambilan:*\n• ${CONFIG.jamOperasional}\n\n` +
    `_Ketik *BACK* untuk kembali ke menu utama_`;
}

function pesanLokasi() {
  return `📍 *LOKASI & JAM OPERASIONAL*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🏢 *Alamat:*\n${CONFIG.lokasi}\n\n` +
    `🕐 *Jam Operasional:*\n${CONFIG.jamOperasional}\n\n` +
    `📞 *Kontak:* ${CONFIG.kontakAdmin}\n\n` +
    `_Ketik *BACK* untuk kembali ke menu utama_`;
}

function pesanKonfirmasiBooking(data, mobil) {
  const total = (mobil.harga + (data.pakaiSopir ? 150000 : 0)) * data.lamaHari;
  return (
    `📝 *KONFIRMASI PESANAN*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 *Nama Lengkap :* ${data.nama}\n` +
    `📱 *No WA :* ${data.noWA}\n` +
    `🆘 *No Kontak Darurat :* ${data.kontakDarurat}\n` +
    `📧 *Email :* ${data.email}\n` +
    `🪪 *NIM/NIK :* ${data.nik}\n\n` +
    (data.status === 'mahasiswa'
      ? `🎓 *[Pendidikan]*\n   Universitas : ${data.universitas}\n   Jurusan : ${data.jurusan}\n   Angkatan : ${data.angkatan}\n`
      : `💼 *[Pekerjaan]*\n   Tempat Kerja : ${data.tempatKerja}\n   Divisi : ${data.divisi}\n`) +
    `\n🚗 *[Unit Yang Disewa]*\n   Mobil : ${mobil.nama}\n   Tipe Kendaraan : ${mobil.kategori}\n\n` +
    `📅 *[Waktu Penyewaan]*\n   Tanggal Pengambilan : ${data.tanggalMulai}\n   Durasi Sewa : ${data.lamaHari} hari\n   Tanggal Selesai : ${data.tanggalSelesai}\n\n` +
    `👨‍✈️ *Pakai Sopir :* ${data.pakaiSopir ? 'Ya (+Rp 150.000/hari)' : 'Tidak'}\n\n` +
    `💰 *RINCIAN BIAYA:*\n• Sewa mobil: Rp ${(mobil.harga * data.lamaHari).toLocaleString('id-ID')}\n` +
    (data.pakaiSopir ? `• Sopir: Rp ${(150000 * data.lamaHari).toLocaleString('id-ID')}\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `*Total: Rp ${total.toLocaleString('id-ID')}*\n\n` +
    `Apakah data sudah benar?\n*1. ✅ Ya, Konfirmasi*\n*2. ❌ Tidak, Batalkan*`
  );
}

// ============================================================
//  WEB SERVER UNTUK QR
// ============================================================
let lastQR = null;
const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  if (req.url === '/qr' || req.url === '/') {
    if (!lastQR) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<html><head><meta http-equiv="refresh" content="3"><style>body{font-family:sans-serif;text-align:center;padding:40px;background:#f0f9f4}</style></head><body><h2>⏳ Menunggu QR Code...</h2><p>Halaman otomatis refresh setiap 3 detik</p></body></html>`);
      return;
    }
    try {
      const qrImage = await QRCode.toDataURL(lastQR, { width: 400, margin: 2 });
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<html><head><meta http-equiv="refresh" content="20"><style>body{font-family:sans-serif;text-align:center;padding:40px;background:#f0f9f4}img{border:8px solid white;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.2)}.box{background:white;display:inline-block;padding:30px;border-radius:16px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}h2{color:#1a7a4a}</style></head><body><div class="box"><h2>📱 Scan QR WhatsApp</h2><img src="${qrImage}" width="300"/><p>⏳ QR refresh otomatis tiap 20 detik</p><p style="color:gray;font-size:13px">WhatsApp → Perangkat Tertaut → Tautkan Perangkat</p></div></body></html>`);
    } catch(e) {
      res.writeHead(500);
      res.end('Error');
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot WhatsApp Rental Mobil aktif!');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Web Server aktif di port ${PORT}`);
});

// ============================================================
//  HANDLER PESAN
// ============================================================
async function handlePesan(sock, from, body) {
  const session = getSession(from);
  const input = body.trim();

  console.log(`📨 [${new Date().toLocaleTimeString('id-ID')}] Dari ${from}: ${input}`);

  async function kirim(teks) {
    await sock.sendMessage(from, { text: teks });
  }

  // Perintah global
  if (/^(halo|hai|hi|hello|start|mulai|menu|bantuan)$/i.test(input)) {
    resetSession(from);
    await kirim(pesanMenu());
    return;
  }
  if (/^back$/i.test(input)) {
    resetSession(from);
    await kirim(pesanMenu());
    return;
  }

  switch (session.step) {

    case 'MENU': {
      if (input === '1') {
        session.step = 'LIHAT_MOBIL';
        await kirim(pesanDaftarMobil());
      } else if (input === '2') {
        session.step = 'INPUT_NAMA';
        await kirim(`📝 *FORM BOOKING RENTAL MOBIL*\n━━━━━━━━━━━━━━━━━━━━━\n\nMari isi data diri Anda.\n\n👤 Masukkan *Nama Lengkap* Anda:`);
      } else if (input === '3') {
        await kirim(pesanSyarat());
      } else if (input === '4') {
        await kirim(`👨‍💼 *HUBUNGI ADMIN*\n━━━━━━━━━━━━━━━━━━━━━\n\n📞 WhatsApp Admin: ${CONFIG.kontakAdmin}\n🕐 Jam Aktif: ${CONFIG.jamOperasional}\n\n_Ketik *BACK* untuk kembali_`);
      } else if (input === '5') {
        await kirim(pesanLokasi());
      } else {
        await kirim(pesanMenu());
      }
      break;
    }

    case 'LIHAT_MOBIL': {
      const mobil = ARMADA[input];
      if (mobil) {
        session.data.mobilKey = input;
        session.step = 'INPUT_NAMA';
        await kirim(`✅ Anda memilih: *${mobil.nama}*\n\n📝 *FORM BOOKING*\n━━━━━━━━━━━━━━━━━━━━━\n\n👤 Masukkan *Nama Lengkap* Anda:`);
      } else {
        await kirim(pesanDaftarMobil());
      }
      break;
    }

    case 'INPUT_NAMA': {
      if (input.length < 3) { await kirim('❌ Nama terlalu pendek. Masukkan nama lengkap:'); break; }
      session.data.nama = input;
      session.step = 'INPUT_NOWA';
      await kirim(`👋 Halo *${input}*!\n\n📱 Masukkan *No WhatsApp* Anda:\nContoh: 08123456789`);
      break;
    }

    case 'INPUT_NOWA': {
      if (!/^08[0-9]{8,12}$/.test(input)) { await kirim('❌ Format salah. Contoh: 08123456789'); break; }
      session.data.noWA = input;
      session.step = 'INPUT_KONDARURAT';
      await kirim(`🆘 Masukkan *No Kontak Darurat*:\nContoh: 08123456789`);
      break;
    }

    case 'INPUT_KONDARURAT': {
      if (!/^08[0-9]{8,12}$/.test(input)) { await kirim('❌ Format salah. Contoh: 08123456789'); break; }
      session.data.kontakDarurat = input;
      session.step = 'INPUT_EMAIL';
      await kirim(`📧 Masukkan *Email* Anda:`);
      break;
    }

    case 'INPUT_EMAIL': {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) { await kirim('❌ Format email salah. Contoh: nama@email.com'); break; }
      session.data.email = input;
      session.step = 'INPUT_NIK';
      await kirim(`🪪 Masukkan *NIM / NIK* Anda:`);
      break;
    }

    case 'INPUT_NIK': {
      if (input.length < 5) { await kirim('❌ NIM/NIK terlalu pendek. Masukkan ulang:'); break; }
      session.data.nik = input;
      session.step = 'INPUT_STATUS';
      await kirim(`📋 *Status Anda:*\n\n*1. 🎓 Pelajar / Mahasiswa*\n*2. 💼 Pekerja / Profesional*`);
      break;
    }

    case 'INPUT_STATUS': {
      if (input === '1') {
        session.data.status = 'mahasiswa';
        session.step = 'INPUT_UNIVERSITAS';
        await kirim(`🎓 Masukkan *nama Universitas* Anda:`);
      } else if (input === '2') {
        session.data.status = 'pekerja';
        session.step = 'INPUT_TEMPAT_KERJA';
        await kirim(`🏢 Masukkan *Tempat Kerja* Anda:`);
      } else {
        await kirim('Ketik *1* untuk Mahasiswa atau *2* untuk Pekerja:');
      }
      break;
    }

    case 'INPUT_UNIVERSITAS': {
      session.data.universitas = input;
      session.step = 'INPUT_JURUSAN';
      await kirim(`📚 Masukkan *Jurusan* Anda:`);
      break;
    }

    case 'INPUT_JURUSAN': {
      session.data.jurusan = input;
      session.step = 'INPUT_ANGKATAN';
      await kirim(`📅 Masukkan *Angkatan* Anda:\nContoh: 2022`);
      break;
    }

    case 'INPUT_ANGKATAN': {
      session.data.angkatan = input;
      session.step = 'PILIH_MOBIL_BOOKING';
      await kirim(`✅ Data pendidikan tersimpan!\n\n${pesanDaftarMobil()}`);
      break;
    }

    case 'INPUT_TEMPAT_KERJA': {
      session.data.tempatKerja = input;
      session.step = 'INPUT_DIVISI';
      await kirim(`🏬 Masukkan *Divisi / Bagian* Anda:`);
      break;
    }

    case 'INPUT_DIVISI': {
      session.data.divisi = input;
      session.step = 'PILIH_MOBIL_BOOKING';
      await kirim(`✅ Data pekerjaan tersimpan!\n\n${pesanDaftarMobil()}`);
      break;
    }

    case 'PILIH_MOBIL_BOOKING': {
      const mobil = ARMADA[input];
      if (mobil) {
        session.data.mobilKey = input;
        session.step = 'INPUT_TANGGAL_MULAI';
        await kirim(`✅ Anda memilih: *${mobil.nama}*\n📌 ${mobil.kategori}\n\n📅 Masukkan *tanggal pengambilan*\nFormat: DD/MM/YYYY\nContoh: 25/12/2024`);
      } else {
        await kirim(`❌ Pilihan tidak valid.\n\n${pesanDaftarMobil()}`);
      }
      break;
    }

    case 'INPUT_TANGGAL_MULAI': {
      const reDate = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      if (!reDate.test(input)) { await kirim('❌ Format salah. Gunakan DD/MM/YYYY\nContoh: 25/12/2024'); break; }
      const [, d, m, y] = input.match(reDate);
      const tgl = new Date(`${y}-${m}-${d}`);
      if (isNaN(tgl)) { await kirim('❌ Tanggal tidak valid. Masukkan ulang:'); break; }
      session.data.tanggalMulai = input;
      session.data.tglMulaiObj = tgl;
      session.step = 'INPUT_DURASI';
      await kirim(`⏱️ Masukkan *durasi sewa* (dalam hari):\nContoh: 2`);
      break;
    }

    case 'INPUT_DURASI': {
      const durasi = parseInt(input);
      if (isNaN(durasi) || durasi < 1) { await kirim('❌ Durasi tidak valid. Masukkan angka minimal 1:'); break; }
      session.data.lamaHari = durasi;
      const tglSelesai = new Date(session.data.tglMulaiObj);
      tglSelesai.setDate(tglSelesai.getDate() + durasi);
      const dd = String(tglSelesai.getDate()).padStart(2, '0');
      const mm = String(tglSelesai.getMonth() + 1).padStart(2, '0');
      const yy = tglSelesai.getFullYear();
      session.data.tanggalSelesai = `${dd}/${mm}/${yy}`;
      const mobil = ARMADA[session.data.mobilKey];
      if (mobil.sopir) {
        session.step = 'PILIH_SOPIR';
        await kirim(`📅 Tanggal selesai: *${session.data.tanggalSelesai}*\n\n🧑‍✈️ *Pakai Sopir?*\n━━━━━━━━━━━━━━━━━━━━━\nBiaya tambahan *Rp 150.000/hari*\n\n*1. ✅ Ya, pakai sopir*\n*2. ❌ Tidak, self drive*`);
      } else {
        session.data.pakaiSopir = false;
        session.step = 'KONFIRMASI';
        await kirim(pesanKonfirmasiBooking(session.data, mobil));
      }
      break;
    }

    case 'PILIH_SOPIR': {
      if (input === '1') { session.data.pakaiSopir = true; }
      else if (input === '2') { session.data.pakaiSopir = false; }
      else { await kirim('❌ Pilih:\n*1. Ya, pakai sopir*\n*2. Tidak, self drive*'); break; }
      session.step = 'KONFIRMASI';
      await kirim(pesanKonfirmasiBooking(session.data, ARMADA[session.data.mobilKey]));
      break;
    }

    case 'KONFIRMASI': {
      if (input === '1') {
        const mobil = ARMADA[session.data.mobilKey];
        const d = session.data;
        const adminMsg =
          `🔔 *PESANAN BARU!*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `👤 *Nama Lengkap :* ${d.nama}\n📱 *No WA :* ${d.noWA}\n🆘 *No Kontak Darurat :* ${d.kontakDarurat}\n📧 *Email :* ${d.email}\n🪪 *NIM/NIK :* ${d.nik}\n\n` +
          (d.status === 'mahasiswa'
            ? `🎓 *[Pendidikan]*\n   Universitas : ${d.universitas}\n   Jurusan : ${d.jurusan}\n   Angkatan : ${d.angkatan}\n`
            : `💼 *[Pekerjaan]*\n   Tempat Kerja : ${d.tempatKerja}\n   Divisi : ${d.divisi}\n`) +
          `\n🚗 *[Unit Yang Disewa]*\n   Mobil : ${mobil.nama}\n   Tipe : ${mobil.kategori}\n\n` +
          `📅 *[Waktu Penyewaan]*\n   Tanggal Pengambilan : ${d.tanggalMulai}\n   Durasi Sewa : ${d.lamaHari} hari\n   Tanggal Selesai : ${d.tanggalSelesai}\n\n` +
          `👨‍✈️ Pakai Sopir : ${d.pakaiSopir ? 'Ya (+Rp 150.000/hari)' : 'Tidak'}\n` +
          `💰 *Total : Rp ${((mobil.harga + (d.pakaiSopir ? 150000 : 0)) * d.lamaHari).toLocaleString('id-ID')}*`;

        // Kirim notif ke admin
        const adminJid = `${CONFIG.noAdmin}@s.whatsapp.net`;
        await sock.sendMessage(adminJid, { text: adminMsg });

        await kirim(`✅ *PESANAN DITERIMA!*\n━━━━━━━━━━━━━━━━━━━━━\n\nTerima kasih *${d.nama}*!\n\n📋 Data Anda telah dikirim ke admin.\nAdmin akan menghubungi dalam *1x24 jam*.\n\n📞 Pertanyaan? Hubungi: ${CONFIG.kontakAdmin}\n\n_Ketik *MENU* untuk kembali_`);
        resetSession(from);

      } else if (input === '2') {
        resetSession(from);
        await kirim('❌ Pemesanan dibatalkan.\n\nKetik *MENU* untuk kembali.');
      } else {
        await kirim('Ketik *1* untuk konfirmasi atau *2* untuk batalkan.');
      }
      break;
    }

    default:
      resetSession(from);
      await kirim(pesanMenu());
  }
}

// ============================================================
//  KONEKSI BAILEYS
// ============================================================
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('/app/auth_info');
  const { version } = await fetchLatestBaileysVersion();

  console.log(`🚀 Memulai Bot WhatsApp Rental Mobil (Baileys v${version.join('.')})`);

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ['Rental Bot', 'Chrome', '1.0.0'],
  });

  // QR Code
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      lastQR = qr;
      console.log('\n📱 QR tersedia! Buka /qr di browser untuk scan.');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('🔌 Koneksi terputus. Reconnect:', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(startBot, 3000);
      } else {
        console.log('❌ Logged out. Hapus folder auth_info dan restart.');
        lastQR = null;
      }
    }

    if (connection === 'open') {
      lastQR = null;
      console.log(`✅ Bot WhatsApp Rental Mobil AKTIF!`);
      console.log(`🏢 ${CONFIG.namaPerusahaan}`);
      console.log(`⏰ ${new Date().toLocaleString('id-ID')}`);
    }
  });

  // Simpan credentials
  sock.ev.on('creds.update', saveCreds);

  // Handler pesan masuk
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (!msg.message) continue;

      const from = msg.key.remoteJid;
      if (!from || from.includes('@g.us') || from.includes('status@broadcast')) continue;

      const body =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption || '';

      if (!body) continue;

      try {
        await handlePesan(sock, from, body);
      } catch (err) {
        console.error('❌ Error handle pesan:', err);
        await sock.sendMessage(from, { text: '⚠️ Terjadi kesalahan. Ketik *MENU* untuk memulai ulang.' });
      }
    }
  });
}

startBot();
