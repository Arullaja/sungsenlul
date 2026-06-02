const { Client, LocalAuth } = require('whatsapp-web.js');
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
  const d = data;
  const total = (mobil.harga + (d.pakaiSopir ? 150000 : 0)) * d.lamaHari;
  return (
    `📝 *KONFIRMASI PESANAN*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 *Nama Lengkap :* ${d.nama}\n` +
    `📱 *No WA :* ${d.noWA}\n` +
    `🆘 *No Kontak Darurat :* ${d.kontakDarurat}\n` +
    `📧 *Email :* ${d.email}\n` +
    `🪪 *NIM/NIK :* ${d.nik}\n\n` +
    (d.status === 'mahasiswa'
      ? `🎓 *[Pendidikan]*\n` +
        `   Universitas : ${d.universitas}\n` +
        `   Jurusan : ${d.jurusan}\n` +
        `   Angkatan : ${d.angkatan}\n`
      : `💼 *[Pekerjaan]*\n` +
        `   Tempat Kerja : ${d.tempatKerja}\n` +
        `   Divisi : ${d.divisi}\n`) +
    `\n🚗 *[Unit Yang Disewa]*\n` +
    `   Mobil : ${mobil.nama}\n` +
    `   Tipe Kendaraan : ${mobil.kategori}\n\n` +
    `📅 *[Waktu Penyewaan]*\n` +
    `   Tanggal Pengambilan : ${d.tanggalMulai}\n` +
    `   Durasi Sewa : ${d.lamaHari} hari\n` +
    `   Tanggal Selesai : ${d.tanggalSelesai}\n\n` +
    `👨‍✈️ *Pakai Sopir :* ${d.pakaiSopir ? 'Ya (+Rp 150.000/hari)' : 'Tidak'}\n\n` +
    `💰 *RINCIAN BIAYA:*\n` +
    `• Sewa mobil: Rp ${(mobil.harga * d.lamaHari).toLocaleString('id-ID')}\n` +
    (d.pakaiSopir ? `• Sopir: Rp ${(150000 * d.lamaHari).toLocaleString('id-ID')}\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `*Total: Rp ${total.toLocaleString('id-ID')}*\n\n` +
    `Apakah data sudah benar?\n*1. ✅ Ya, Konfirmasi*\n*2. ❌ Tidak, Batalkan*`
  );
}

// ============================================================
//  INISIALISASI CLIENT
// ============================================================
const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'rental-bot' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  },
});

// ============================================================
//  EVENT HANDLERS
// ============================================================
client.on('qr', (qr) => {
  console.log('\n📱 QR Code (scan via WhatsApp):');
  qrcode.generate(qr, { small: true });
  // Simpan QR string ke file agar bisa diakses web viewer
  const fs = require('fs');
  fs.writeFileSync('qr.txt', qr);
  console.log('\n✅ QR juga disimpan ke qr.txt');
  console.log('⏳ Menunggu scan...\n');
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
      await msg.reply(pesanMenu());
    }

    async function kirimTombolMobil() {
      await msg.reply(pesanDaftarMobil());
    }

    async function kirimTombolSopir(mobil) {
      await msg.reply(
        `🧑‍✈️ *Pakai Sopir?*\n━━━━━━━━━━━━━━━━━━━━━\nBiaya tambahan *Rp 150.000/hari*\n\n*1. ✅ Ya, pakai sopir*\n*2. ❌ Tidak, self drive*`
      );
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
          session.step = 'INPUT_NAMA';
          await msg.reply(
            `📝 *FORM BOOKING RENTAL MOBIL*\n━━━━━━━━━━━━━━━━━━━━━\n\nMari isi data diri Anda terlebih dahulu.\n\n👤 Masukkan *Nama Lengkap* Anda:`
          );

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

      // ── BOOKING - INPUT NAMA LENGKAP ────────────────────────
      case 'INPUT_NAMA': {
        if (body.length < 3) {
          await msg.reply('❌ Nama terlalu pendek. Masukkan nama lengkap:');
          break;
        }
        session.data.nama = body;
        session.step = 'INPUT_NOWA';
        await msg.reply(`👋 Halo *${body}*!\n\n📱 Masukkan *No WhatsApp* Anda:\nContoh: 08123456789`);
        break;
      }

      // ── BOOKING - NO WA ──────────────────────────────────────
      case 'INPUT_NOWA': {
        if (!/^08[0-9]{8,12}$/.test(body)) {
          await msg.reply('❌ Format salah. Masukkan No WhatsApp yang valid:\nContoh: 08123456789');
          break;
        }
        session.data.noWA = body;
        session.step = 'INPUT_KONDARURAT';
        await msg.reply(`📞 Masukkan *No Kontak Darurat*:\nContoh: 08123456789`);
        break;
      }

      // ── BOOKING - KONTAK DARURAT ─────────────────────────────
      case 'INPUT_KONDARURAT': {
        if (!/^08[0-9]{8,12}$/.test(body)) {
          await msg.reply('❌ Format salah. Masukkan nomor yang valid:\nContoh: 08123456789');
          break;
        }
        session.data.kontakDarurat = body;
        session.step = 'INPUT_EMAIL';
        await msg.reply(`📧 Masukkan *Email* Anda:`);
        break;
      }

      // ── BOOKING - EMAIL ──────────────────────────────────────
      case 'INPUT_EMAIL': {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body)) {
          await msg.reply('❌ Format email salah. Contoh: nama@email.com');
          break;
        }
        session.data.email = body;
        session.step = 'INPUT_NIK';
        await msg.reply(`🪪 Masukkan *NIM / NIK* Anda:`);
        break;
      }

      // ── BOOKING - NIK/NIM ────────────────────────────────────
      case 'INPUT_NIK': {
        if (body.length < 5) {
          await msg.reply('❌ NIM/NIK terlalu pendek. Masukkan ulang:');
          break;
        }
        session.data.nik = body;
        session.step = 'INPUT_STATUS';
        await msg.reply(
          `📋 *Status Anda:*\n\n*1. 🎓 Pelajar / Mahasiswa*\n*2. 💼 Pekerja / Profesional*`
        );
        break;
      }

      // ── BOOKING - STATUS PENDIDIKAN/PEKERJAAN ───────────────
      case 'INPUT_STATUS': {
        if (body === '1') {
          session.data.status = 'mahasiswa';
          session.step = 'INPUT_UNIVERSITAS';
          await msg.reply(`🎓 Masukkan *nama Universitas* Anda:`);
        } else if (body === '2') {
          session.data.status = 'pekerja';
          session.step = 'INPUT_TEMPAT_KERJA';
          await msg.reply(`🏢 Masukkan *Tempat Kerja* Anda:`);
        } else {
          await msg.reply('Ketik *1* untuk Mahasiswa atau *2* untuk Pekerja:');
        }
        break;
      }

      // ── BOOKING - UNIVERSITAS ────────────────────────────────
      case 'INPUT_UNIVERSITAS': {
        session.data.universitas = body;
        session.step = 'INPUT_JURUSAN';
        await msg.reply(`📚 Masukkan *Jurusan* Anda:`);
        break;
      }

      case 'INPUT_JURUSAN': {
        session.data.jurusan = body;
        session.step = 'INPUT_ANGKATAN';
        await msg.reply(`📅 Masukkan *Angkatan* Anda:\nContoh: 2022`);
        break;
      }

      case 'INPUT_ANGKATAN': {
        session.data.angkatan = body;
        session.step = 'PILIH_MOBIL_BOOKING';
        await msg.reply(`✅ Data pendidikan tersimpan!\n\nSekarang pilih kendaraan yang ingin disewa:`);
        await kirimTombolMobil();
        break;
      }

      // ── BOOKING - TEMPAT KERJA ───────────────────────────────
      case 'INPUT_TEMPAT_KERJA': {
        session.data.tempatKerja = body;
        session.step = 'INPUT_DIVISI';
        await msg.reply(`🏬 Masukkan *Divisi / Bagian* Anda:`);
        break;
      }

      case 'INPUT_DIVISI': {
        session.data.divisi = body;
        session.step = 'PILIH_MOBIL_BOOKING';
        await msg.reply(`✅ Data pekerjaan tersimpan!\n\nSekarang pilih kendaraan yang ingin disewa:`);
        await kirimTombolMobil();
        break;
      }

      // ── BOOKING - PILIH MOBIL ────────────────────────────────
      case 'PILIH_MOBIL_BOOKING': {
        let nomorMobil = inputEffektif;
        if (nomorMobil && nomorMobil.startsWith('PILIH_MOBIL_')) {
          nomorMobil = nomorMobil.replace('PILIH_MOBIL_', '');
        }
        const mobil = ARMADA[nomorMobil];
        if (mobil) {
          session.data.mobilKey = nomorMobil;
          session.step = 'INPUT_TANGGAL_MULAI';
          await msg.reply(
            `✅ Anda memilih: *${mobil.nama}*\n📌 ${mobil.kategori}\n\n` +
            `📅 Masukkan *tanggal pengambilan*\nFormat: DD/MM/YYYY\nContoh: 25/12/2024`
          );
        } else {
          await msg.reply('❌ Pilihan tidak valid. Ketik nomor mobil dari daftar di atas.');
          await kirimTombolMobil();
        }
        break;
      }

      // ── BOOKING - TANGGAL MULAI ──────────────────────────────
      case 'INPUT_TANGGAL_MULAI': {
        const reDate = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!reDate.test(body)) {
          await msg.reply('❌ Format salah. Gunakan DD/MM/YYYY\nContoh: 25/12/2024');
          break;
        }
        const [, d, m, y] = body.match(reDate);
        const tgl = new Date(`${y}-${m}-${d}`);
        if (isNaN(tgl) || tgl < new Date().setHours(0,0,0,0)) {
          await msg.reply('❌ Tanggal tidak valid atau sudah lewat. Masukkan ulang:');
          break;
        }
        session.data.tanggalMulai = body;
        session.data.tglMulaiObj = tgl;
        session.step = 'INPUT_DURASI';
        await msg.reply(`⏱️ Masukkan *durasi sewa* (dalam hari):\nContoh: 2`);
        break;
      }

      // ── BOOKING - DURASI ─────────────────────────────────────
      case 'INPUT_DURASI': {
        const durasi = parseInt(body);
        if (isNaN(durasi) || durasi < 1) {
          await msg.reply('❌ Durasi tidak valid. Masukkan angka minimal 1:\nContoh: 2');
          break;
        }
        session.data.lamaHari = durasi;
        const tglSelesai = new Date(session.data.tglMulaiObj);
        tglSelesai.setDate(tglSelesai.getDate() + durasi);
        const dd = String(tglSelesai.getDate()).padStart(2,'0');
        const mm = String(tglSelesai.getMonth()+1).padStart(2,'0');
        const yy = tglSelesai.getFullYear();
        session.data.tanggalSelesai = `${dd}/${mm}/${yy}`;
        session.step = 'PILIH_SOPIR';
        const mobil = ARMADA[session.data.mobilKey];
        await msg.reply(`📅 Tanggal selesai: *${session.data.tanggalSelesai}*`);
        if (mobil.sopir) {
          await kirimTombolSopir(mobil);
        } else {
          session.data.pakaiSopir = false;
          session.step = 'KONFIRMASI';
          await msg.reply(pesanKonfirmasiBooking(session.data, mobil));
        }
        break;
      }

      // ── BOOKING - PILIH SOPIR ────────────────────────────────
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

      // ── KONFIRMASI BOOKING ───────────────────────────────────
      case 'KONFIRMASI': {
        if (inputEffektif === '1') {
          const mobil = ARMADA[session.data.mobilKey];
          const d = session.data;
          // Format notif admin sesuai form
          const adminMsg =
            `🔔 *PESANAN BARU!*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `*GASSS ISIII FORMM‼️*\n\n` +
            `👤 *Nama Lengkap :* ${d.nama}\n` +
            `📱 *No WA :* ${d.noWA}\n` +
            `🆘 *No Kontak Darurat :* ${d.kontakDarurat}\n` +
            `📧 *Email :* ${d.email}\n` +
            `🪪 *NIM/NIK :* ${d.nik}\n\n` +
            (d.status === 'mahasiswa'
              ? `🎓 *[Pendidikan]*\n` +
                `   Universitas : ${d.universitas}\n` +
                `   Jurusan : ${d.jurusan}\n` +
                `   Angkatan : ${d.angkatan}\n`
              : `💼 *[Pekerjaan]*\n` +
                `   Tempat Kerja : ${d.tempatKerja}\n` +
                `   Divisi : ${d.divisi}\n`) +
            `\n🚗 *[Unit Yang Disewa]*\n` +
            `   Mobil : ${mobil.nama}\n` +
            `   Tipe Kendaraan : ${mobil.kategori}\n\n` +
            `📅 *[Waktu Penyewaan]*\n` +
            `   Tanggal Pengambilan : ${d.tanggalMulai}\n` +
            `   Durasi Sewa : ${d.lamaHari} hari\n` +
            `   Tanggal Selesai : ${d.tanggalSelesai}\n\n` +
            `👨‍✈️ Pakai Sopir : ${d.pakaiSopir ? 'Ya (+Rp 150.000/hari)' : 'Tidak'}\n` +
            `💰 *Total : Rp ${((mobil.harga + (d.pakaiSopir ? 150000 : 0)) * d.lamaHari).toLocaleString('id-ID')}*`;

          await client.sendMessage(`${CONFIG.noAdmin}@c.us`, adminMsg);

          await msg.reply(
            `✅ *PESANAN DITERIMA!*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Terima kasih *${d.nama}*!\n\n` +
            `📋 Data lengkap Anda telah dikirim ke admin.\n` +
            `Admin akan menghubungi Anda dalam *1x24 jam*.\n\n` +
            `📞 Pertanyaan? Hubungi: ${CONFIG.kontakAdmin}\n\n` +
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
