const { Client, LocalAuth, Buttons, List } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// ============================================================
//  KONFIGURASI BOT RENTAL MOBIL
// ============================================================
const CONFIG = {
  namaPerusahaan: 'Rental Mobil Bandung',
  noAdmin: '6281234567890', // Ganti dengan nomor admin/pemilik
  jamOperasional: '08:00 - 20:00 WIB',
  lokasi: 'Jl. Contoh No. 123, Bandung',
  kontakAdmin: '0812-3456-7890',
};

// ============================================================
//  DATA ARMADA MOBIL
// ============================================================
const ARMADA = {
  '1':  { nama: 'Toyota Fortuner',         kategori: 'Premium SUV',          harga: 650000,  kapasitas: 7, transmisi: 'Matic',   mesin: '2.800cc (1GD-FTV) 4-Silinder Turbo Diesel',          headunit: '9 inci Touchscreen (NFC & Smartphone Connectivity)', ac: true, sopir: true  },
  '2':  { nama: 'Toyota Avanza TSS',       kategori: 'Family MPV',            harga: 350000,  kapasitas: 7, transmisi: 'Matic',   mesin: '1.500cc (2NR-VE) 4-Silinder Dual VVT-i CVT',          headunit: '9 inci Floating Touchscreen',                         ac: true, sopir: true  },
  '3':  { nama: 'Toyota Innova Reborn',    kategori: 'Premium',               harga: 450000,  kapasitas: 7, transmisi: 'Matic',   mesin: '2.400cc (2GD-FTV) Turbo Diesel 7-Seater Otomatis 6-Speed', headunit: '9 inci Touchscreen (NFC & Smartphone Connectivity)', ac: true, sopir: true  },
  '4':  { nama: 'Toyota Calya',            kategori: 'LCGC MPV',              harga: 300000,  kapasitas: 7, transmisi: 'Manual',  mesin: '1.200cc (3NR-VE) 4-Silinder Dual VVT-i',              headunit: 'Standard Audio System',                               ac: true, sopir: false },
  '5':  { nama: 'Toyota Agya',             kategori: 'LCGC City Car',         harga: 300000,  kapasitas: 2, transmisi: 'Matic',   mesin: '1.200cc (1NR-VE) 4-Silinder Dual VVT-i',              headunit: '7 inci Touchscreen',                                  ac: true, sopir: false },
  '6':  { nama: 'Toyota Innova Zenix',     kategori: 'Premium Hybrid MPV',    harga: 550000,  kapasitas: 7, transmisi: 'Matic',   mesin: '2.000cc (M20A-FKS) Bensin / Hybrid',                  headunit: '10 inci Floating Touchscreen (Smartphone Connectivity)', ac: true, sopir: true  },
  '7':  { nama: 'Mitsubishi Pajero Sport', kategori: 'Premium SUV',           harga: 600000,  kapasitas: 7, transmisi: 'Matic',   mesin: '2.400cc (4N15) 4-Silinder MIVEC Turbo Diesel',        headunit: '8 inci Touchscreen (Smartphone Link Display)',         ac: true, sopir: true  },
  '8':  { nama: 'Honda Brio RS',           kategori: 'City Car',              harga: 300000,  kapasitas: 5, transmisi: 'Matic',   mesin: '1.200cc (L12B) 4-Silinder i-VTEC CVT',               headunit: '6.1 inci Touchscreen (Tipe RS)',                       ac: true, sopir: false },
  '9':  { nama: 'Daihatsu Xenia',          kategori: 'Family MPV',            harga: 350000,  kapasitas: 7, transmisi: 'Manual',  mesin: '1.500cc (2NR-VE) 4-Silinder Dual VVT-i',              headunit: '9 inci Floating Touchscreen',                         ac: true, sopir: false },
};

// ============================================================
//  STATE MANAGEMENT PENGGUNA
// ============================================================
const sessionUser = {};

function getSession(id) {
  if (!sessionUser[id]) {
    sessionUser[id] = { step: 'MENU', data: {} };
  }
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
    `*2️⃣ Cek Harga & Booking*\n` +
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
  msg += `_Ketik *BACK* untuk kembali ke menu utama_`;
  return msg;
}

function pesanSyarat() {
  return `📋 *SYARAT & KETENTUAN*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `✅ *Dokumen yang diperlukan:*\n` +
    `• KTP asli (wajib)\n` +
    `• SIM A aktif\n` +
    `• Kartu Keluarga (KK)\n\n` +
    `✅ *Ketentuan Sewa:*\n` +
    `• Minimal sewa 1 hari (24 jam)\n` +
    `• Deposit: Rp 500.000 - Rp 1.000.000\n` +
    `• BBM ditanggung penyewa\n` +
    `• Dilarang membawa ke luar kota tanpa izin\n` +
    `• Pembatalan < 24 jam dikenakan biaya 50%\n\n` +
    `✅ *Jam Pengambilan:*\n` +
    `• ${CONFIG.jamOperasional}\n\n` +
    `_Ketik *BACK* untuk kembali ke menu utama_`;
}

function pesanLokasi() {
  return `📍 *LOKASI & JAM OPERASIONAL*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🏢 *Alamat:*\n${CONFIG.lokasi}\n\n` +
    `🕐 *Jam Operasional:*\n${CONFIG.jamOperasional}\n\n` +
    `📞 *Kontak:* ${CONFIG.kontakAdmin}\n\n` +
    `🗺️ *Google Maps:*\nhttps://maps.google.com/?q=Bandung\n\n` +
    `_Ketik *BACK* untuk kembali ke menu utama_`;
}

function pesanKonfirmasiBooking(data, mobil) {
  return `📝 *KONFIRMASI PESANAN*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🚗 *Mobil:* ${mobil.nama}\n` +
    `👤 *Nama:* ${data.nama}\n` +
    `📅 *Tanggal Mulai:* ${data.tanggalMulai}\n` +
    `📅 *Tanggal Selesai:* ${data.tanggalSelesai}\n` +
    `⏱️ *Lama Sewa:* ${data.lamaHari} hari\n` +
    `👨‍✈️ *Pakai Sopir:* ${data.pakaiSopir ? 'Ya (+Rp 150.000/hari)' : 'Tidak'}\n\n` +
    `💰 *RINCIAN BIAYA:*\n` +
    `• Sewa mobil: Rp ${(mobil.harga * data.lamaHari).toLocaleString('id-ID')}\n` +
    (data.pakaiSopir ? `• Sopir: Rp ${(150000 * data.lamaHari).toLocaleString('id-ID')}\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `*Total: Rp ${((mobil.harga + (data.pakaiSopir ? 150000 : 0)) * data.lamaHari).toLocaleString('id-ID')}*\n\n` +
    `Apakah data sudah benar?\n*1. ✅ Ya, Konfirmasi*\n*2. ❌ Tidak, Batalkan*`;
}

// ============================================================
//  INISIALISASI CLIENT
// ============================================================
// Deteksi path Chrome otomatis di Windows/Mac/Linux
const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const fs = require('fs');
const executablePath = chromePaths.find(p => { try { return fs.existsSync(p); } catch { return false; } });

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'rental-bot' }),
  puppeteer: {
    headless: true,
    executablePath: executablePath || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

// ============================================================
//  EVENT HANDLERS
// ============================================================
client.on('qr', (qr) => {
  console.log('\n📱 Scan QR Code berikut dengan WhatsApp Anda:\n');
  qrcode.generate(qr, { small: true });
  console.log('\n⏳ Menunggu scan...\n');
});

client.on('ready', () => {
  console.log('✅ Bot WhatsApp Rental Mobil AKTIF!');
  console.log(`🏢 ${CONFIG.namaPerusahaan}`);
  console.log(`⏰ ${new Date().toLocaleString('id-ID')}\n`);
});

client.on('auth_failure', (msg) => {
  console.error('❌ Autentikasi gagal:', msg);
});

client.on('disconnected', (reason) => {
  console.log('🔌 Bot terputus:', reason);
});

// ============================================================
//  HANDLER PESAN MASUK
// ============================================================
client.on('message', async (msg) => {
  // Abaikan pesan dari grup dan status
  if (msg.isGroupMsg || msg.from.includes('status')) return;

  const from = msg.from;
  const body = msg.body.trim();
  const session = getSession(from);

  console.log(`📨 [${new Date().toLocaleTimeString('id-ID')}] Pesan dari ${from}: ${body}`);

  try {
    // ── TOMBOL INTERAKTIF (Buttons) ──────────────────────────
    async function kirimTombolMenu() {
      try {
        const buttons = new Buttons(
          `🚗 *${CONFIG.namaPerusahaan}*\nSelamat datang! Pilih menu di bawah:`,
          [
            { id: '1', body: '🚗 Daftar Mobil' },
            { id: '2', body: '📅 Booking Sekarang' },
            { id: '3', body: '📋 Syarat & Ketentuan' },
          ],
          CONFIG.namaPerusahaan,
          'Pilih layanan kami'
        );
        await client.sendMessage(from, buttons);

        // Kirim tombol kedua untuk menu lainnya
        const buttons2 = new Buttons(
          `Menu lainnya:`,
          [
            { id: '4', body: '👨‍💼 Hubungi Admin' },
            { id: '5', body: '📍 Lokasi & Jam Buka' },
          ],
          '',
          ''
        );
        await client.sendMessage(from, buttons2);
      } catch (e) {
        // Fallback ke teks jika tombol tidak didukung
        await msg.reply(pesanMenu());
      }
    }

    async function kirimTombolMobil() {
      try {
        const entries = Object.entries(ARMADA);
        const toyota = entries.filter(([,m]) => m.nama.startsWith('Toyota'));
        const lainnya = entries.filter(([,m]) => !m.nama.startsWith('Toyota'));
        const sections = [
          {
            title: '🚗 Armada Toyota',
            rows: toyota.map(([key, m]) => ({
              id: `PILIH_MOBIL_${key}`,
              title: m.nama,
              description: `Rp ${m.harga.toLocaleString('id-ID')}/hari | ${m.kapasitas} kursi | ${m.transmisi}`,
            })),
          },
          {
            title: '🏆 Mitsubishi, Honda & Daihatsu',
            rows: lainnya.map(([key, m]) => ({
              id: `PILIH_MOBIL_${key}`,
              title: m.nama,
              description: `Rp ${m.harga.toLocaleString('id-ID')}/hari | ${m.kapasitas} kursi | ${m.transmisi}`,
            })),
          },
        ];
        const list = new List(
          '🚗 *Pilih mobil yang ingin Anda sewa:*',
          '🔽 Lihat Semua Armada (9 Mobil)',
          sections,
          CONFIG.namaPerusahaan,
          'Tap untuk memilih'
        );
        await client.sendMessage(from, list);
      } catch (e) {
        await msg.reply(pesanDaftarMobil());
      }
    }

    async function kirimTombolSopir(mobil) {
      try {
        const buttons = new Buttons(
          `🧑‍✈️ Apakah Anda ingin menggunakan sopir?\n(Biaya tambahan Rp 150.000/hari)`,
          [
            { id: 'SOPIR_YA', body: '✅ Ya, pakai sopir' },
            { id: 'SOPIR_TIDAK', body: '❌ Tidak, self drive' },
          ],
          mobil.nama,
          ''
        );
        await client.sendMessage(from, buttons);
      } catch (e) {
        await msg.reply(
          `Apakah ingin pakai sopir? (biaya +Rp 150.000/hari)\n*1. Ya*\n*2. Tidak*`
        );
      }
    }

    // ── HANDLE RESPON BUTTON/LIST ────────────────────────────
    const selectedId = msg.selectedButtonId || msg.selectedRowId || null;
    const inputEffektif = selectedId || body;

    // ── PERINTAH GLOBAL ──────────────────────────────────────
    if (/^(halo|hai|hi|hello|start|mulai|menu|bantuan)$/i.test(body)) {
      resetSession(from);
      await kirimTombolMenu();
      return;
    }

    if (/^back$/i.test(body)) {
      resetSession(from);
      await kirimTombolMenu();
      return;
    }

    // ── FLOW BERDASARKAN STEP ────────────────────────────────
    switch (session.step) {

      // ── MENU UTAMA ───────────────────────────────────────
      case 'MENU': {
        if (inputEffektif === '1') {
          session.step = 'LIHAT_MOBIL';
          await kirimTombolMobil();

        } else if (inputEffektif === '2') {
          session.step = 'PILIH_MOBIL_BOOKING';
          await kirimTombolMobil();

        } else if (inputEffektif === '3') {
          await msg.reply(pesanSyarat());

        } else if (inputEffektif === '4') {
          await msg.reply(
            `👨‍💼 *HUBUNGI ADMIN*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `📞 WhatsApp Admin: ${CONFIG.kontakAdmin}\n` +
            `🕐 Jam Aktif: ${CONFIG.jamOperasional}\n\n` +
            `_Ketik *BACK* untuk kembali ke menu utama_`
          );

        } else if (inputEffektif === '5') {
          await msg.reply(pesanLokasi());

        } else {
          await kirimTombolMenu();
        }
        break;
      }

      // ── LIHAT DAFTAR MOBIL ───────────────────────────────
      case 'LIHAT_MOBIL': {
        if (inputEffektif && inputEffektif.startsWith('PILIH_MOBIL_')) {
          const nomorMobil = inputEffektif.replace('PILIH_MOBIL_', '');
          const mobil = ARMADA[nomorMobil];
          if (mobil) {
            await msg.reply(
              `🚗 *Detail ${mobil.nama}*\n━━━━━━━━━━━━━━━━━━━━━\n` +
              `💰 Harga: Rp ${mobil.harga.toLocaleString('id-ID')}/hari\n` +
              `👥 Kapasitas: ${mobil.kapasitas} orang\n` +
              `⚙️ Transmisi: ${mobil.transmisi}\n` +
              `🌬️ AC: ${mobil.ac ? 'Ada' : 'Tidak ada'}\n\n` +
              `_Ketik *BACK* untuk kembali ke menu utama_`
            );
          }
        } else {
          await kirimTombolMenu();
          session.step = 'MENU';
        }
        break;
      }

      // ── BOOKING - PILIH MOBIL ────────────────────────────
      case 'PILIH_MOBIL_BOOKING': {
        let nomorMobil = inputEffektif;
        if (nomorMobil && nomorMobil.startsWith('PILIH_MOBIL_')) {
          nomorMobil = nomorMobil.replace('PILIH_MOBIL_', '');
        }
        const mobil = ARMADA[nomorMobil];
        if (mobil) {
          session.data.mobilKey = nomorMobil;
          session.step = 'INPUT_NAMA';
          await msg.reply(
            `✅ Anda memilih: *${mobil.nama}*\n\n` +
            `📝 Silakan masukkan *nama lengkap* Anda:`
          );
        } else {
          await msg.reply('❌ Pilihan tidak valid. Silakan pilih dari daftar.');
          await kirimTombolMobil();
        }
        break;
      }

      // ── BOOKING - INPUT NAMA ─────────────────────────────
      case 'INPUT_NAMA': {
        if (body.length < 3) {
          await msg.reply('❌ Nama terlalu pendek. Masukkan nama lengkap:');
          break;
        }
        session.data.nama = body;
        session.step = 'INPUT_TANGGAL_MULAI';
        await msg.reply(
          `👋 Halo *${body}*!\n\n` +
          `📅 Masukkan *tanggal mulai sewa*\nFormat: DD/MM/YYYY\nContoh: 25/12/2024`
        );
        break;
      }

      // ── BOOKING - TANGGAL MULAI ──────────────────────────
      case 'INPUT_TANGGAL_MULAI': {
        const reDate = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!reDate.test(body)) {
          await msg.reply('❌ Format salah. Gunakan DD/MM/YYYY\nContoh: 25/12/2024');
          break;
        }
        const [, d, m, y] = body.match(reDate);
        const tgl = new Date(`${y}-${m}-${d}`);
        if (isNaN(tgl) || tgl < new Date()) {
          await msg.reply('❌ Tanggal tidak valid atau sudah lewat. Masukkan ulang:');
          break;
        }
        session.data.tanggalMulai = body;
        session.data.tglMulaiObj = tgl;
        session.step = 'INPUT_TANGGAL_SELESAI';
        await msg.reply(`📅 Masukkan *tanggal selesai sewa*\nFormat: DD/MM/YYYY`);
        break;
      }

      // ── BOOKING - TANGGAL SELESAI ────────────────────────
      case 'INPUT_TANGGAL_SELESAI': {
        const reDate2 = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!reDate2.test(body)) {
          await msg.reply('❌ Format salah. Gunakan DD/MM/YYYY');
          break;
        }
        const [, d, m, y] = body.match(reDate2);
        const tglSelesai = new Date(`${y}-${m}-${d}`);
        if (isNaN(tglSelesai) || tglSelesai <= session.data.tglMulaiObj) {
          await msg.reply('❌ Tanggal selesai harus setelah tanggal mulai!');
          break;
        }
        const diffMs = tglSelesai - session.data.tglMulaiObj;
        const lamaHari = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        session.data.tanggalSelesai = body;
        session.data.lamaHari = lamaHari;
        session.step = 'PILIH_SOPIR';
        const mobil = ARMADA[session.data.mobilKey];
        await msg.reply(`⏱️ Lama sewa: *${lamaHari} hari*`);
        if (mobil.sopir) {
          await kirimTombolSopir(mobil);
        } else {
          session.data.pakaiSopir = false;
          session.step = 'KONFIRMASI';
          await msg.reply(pesanKonfirmasiBooking(session.data, mobil));
        }
        break;
      }

      // ── BOOKING - PILIH SOPIR ────────────────────────────
      case 'PILIH_SOPIR': {
        const pilihanSopir = inputEffektif;
        if (pilihanSopir === 'SOPIR_YA' || pilihanSopir === '1') {
          session.data.pakaiSopir = true;
        } else if (pilihanSopir === 'SOPIR_TIDAK' || pilihanSopir === '2') {
          session.data.pakaiSopir = false;
        } else {
          await msg.reply('❌ Pilih:\n*1. Ya, pakai sopir*\n*2. Tidak, self drive*');
          break;
        }
        session.step = 'KONFIRMASI';
        const mobil = ARMADA[session.data.mobilKey];
        await msg.reply(pesanKonfirmasiBooking(session.data, mobil));
        break;
      }

      // ── KONFIRMASI BOOKING ───────────────────────────────
      case 'KONFIRMASI': {
        if (inputEffektif === '1') {
          // Kirim notif ke admin
          const adminMsg =
            `🔔 *PESANAN BARU!*\n━━━━━━━━━━━━━━━━━━━━━\n` +
            `👤 Nama: ${session.data.nama}\n` +
            `📞 WA: ${from.replace('@c.us', '')}\n` +
            `🚗 Mobil: ${ARMADA[session.data.mobilKey].nama}\n` +
            `📅 Mulai: ${session.data.tanggalMulai}\n` +
            `📅 Selesai: ${session.data.tanggalSelesai}\n` +
            `⏱️ Lama: ${session.data.lamaHari} hari\n` +
            `👨‍✈️ Sopir: ${session.data.pakaiSopir ? 'Ya' : 'Tidak'}\n` +
            `💰 Total: Rp ${((ARMADA[session.data.mobilKey].harga + (session.data.pakaiSopir ? 150000 : 0)) * session.data.lamaHari).toLocaleString('id-ID')}`;

          await client.sendMessage(`${CONFIG.noAdmin}@c.us`, adminMsg);

          await msg.reply(
            `✅ *PESANAN DITERIMA!*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Terima kasih *${session.data.nama}*!\n\n` +
            `📋 Pesanan Anda telah diteruskan ke admin.\n` +
            `Admin kami akan menghubungi Anda dalam *1x24 jam*.\n\n` +
            `📞 Jika ada pertanyaan, hubungi:\n${CONFIG.kontakAdmin}\n\n` +
            `_Ketik *MENU* untuk kembali ke menu utama_`
          );
          resetSession(from);

        } else if (inputEffektif === '2') {
          resetSession(from);
          await msg.reply('❌ Pemesanan dibatalkan.\n\nKetik *MENU* untuk kembali.');
        } else {
          await msg.reply('Ketik *1* untuk konfirmasi atau *2* untuk batalkan.');
        }
        break;
      }

      default:
        resetSession(from);
        await kirimTombolMenu();
    }

  } catch (err) {
    console.error('❌ Error:', err);
    await msg.reply('⚠️ Terjadi kesalahan. Ketik *MENU* untuk memulai ulang.');
  }
});

// ============================================================
//  JALANKAN BOT
// ============================================================
console.log('🚀 Memulai Bot WhatsApp Rental Mobil...');
client.initialize();
