
const { default: makeWASocket, useSingleFileAuthState, makeInMemoryStore, delay } = require('@adiwajshing/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const P = require('pino')

// Ganti dengan nomor admin (format: 62xxxxxxxxxx@s.whatsapp.net)
const ADMIN_NUMBER = '6282114775933@s.whatsapp.net'

// Menu layanan Qiqi Store
const menus = {
    'followers tiktok': [
        '100 followers / rp. 7.000',
        '200 followers / rp. 12.000',
        '300 followers / rp. 15.000',
        '400 followers / rp. 18.000',
        '500 followers / rp. 22.000',
        '1000 followers / rp. 50.000'
    ],
    'like tiktok': [
        '100 like / rp. 2.000',
        '200 like / rp. 4.000',
        '300 like / rp. 6.000',
        '400 like / rp. 8.000',
        '500 like / rp. 10.000',
        '1000 like / rp. 20.000'
    ],
    'followers instagram': [
        '100 followers / rp. 5.000',
        '200 followers / rp. 10.000',
        '300 followers / rp. 12.000',
        '400 followers / rp. 15.000',
        '500 followers / rp. 20.000',
        '1000 followers / rp. 35.000'
    ],
    'subscriber youtube': [
        '100 subscribe / rp. 60.000',
        '500 subscribe / rp. 300.000',
        '1000 subscribe / rp. 600.000'
    ]
}

const orderFormat = `🍥 silakan isi format pesanan berikut:

- nama:
- nomor whatsapp:
- layanan: (contoh: followers tiktok)
- jumlah:
- username/link target:
- metode pembayaran:
- bukti transfer:

🛍️ setelah ngisi, kirim kembali ke sini ya ✨`

const { state, saveState } = useSingleFileAuthState('./auth_info.json')

async function startSock() {
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    })

    sock.ev.on('creds.update', saveState)

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ''
        const lower = text.toLowerCase()
        const sender = msg.key.remoteJid

        if (lower === 'menu' || lower === 'katalog') {
            let fullMenu = '🛍️ ini katalog lengkap qiqi store 🍥✨

'
            for (let key in menus) {
                fullMenu += `✨ ${key}:
` + menus[key].map(i => '- ' + i).join('
') + '

'
            }
            await sock.sendMessage(sender, { text: fullMenu })
        } else if (lower.startsWith('beli')) {
            const layanan = lower.replace('beli ', '').trim()
            if (menus[layanan]) {
                const response = `🍥 layanan: ${layanan}

` + menus[layanan].map(i => '- ' + i).join('
') + '

' + orderFormat
                await sock.sendMessage(sender, { text: response })
            } else {
                await sock.sendMessage(sender, { text: 'layanan tidak ditemukan. ketik *menu* untuk lihat semua ya ✨' })
            }
        } else if (lower.includes('nama:') && lower.includes('bukti')) {
            await sock.sendMessage(sender, { text: '🛍️ pesanan kamu udah kami terima, akan segera diproses ya 🍥' })
            await sock.sendMessage(ADMIN_NUMBER, {
                text: `📥 pesanan masuk dari ${sender}:

${text}`
            })
        } else {
            await sock.sendMessage(sender, { text: 'halo! selamat datang di qiqi store 🛍️

ketik *menu* buat lihat semua layanan, atau *beli [nama layanan]* buat langsung order 🍥' })
        }
    })
}

startSock()
