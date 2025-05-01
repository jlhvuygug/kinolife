const TelegramBot = require('node-telegram-bot-api');
const { Low, JSONFile } = require('lowdb');

// Token va admin ID
const token = '7584847014:AAE6RZO72G7jVJ7JMwQmkhbifOaD9Xz7Vfs';
const adminId = 7542365426;

// Botni ishga tushirish
const bot = new TelegramBot(token, { polling: true });

// LowDB sozlamalari
const adapter = new JSONFile('db.json');
const db = new Low(adapter);

// Kanallar
const channels = ["@kinolifechannel", "@UzHamyonbop"];

// Foydalanuvchi kino kodi kiritish rejimida ekanligini belgilash
const awaitingMovieCode = new Set();

// Kino kodi kiritish
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  await db.read();
  db.data ||= { verifiedUsers: [] };

  // Kino kodi rejimi
  if (awaitingMovieCode.has(userId)) {
    awaitingMovieCode.delete(userId);
    const messageId = parseInt(text);
    if (isNaN(messageId)) {
      return bot.sendMessage(chatId, "❗ Noto‘g‘ri kod. Iltimos, raqamli kino kodini yuboring.");
    }
    try {
      await bot.forwardMessage(chatId, privateChannelId, messageId);
      return bot.sendMessage(chatId, "✅ Kino kodi muvaffaqiyatli yuborildi.");
    } catch (e) {
      return bot.sendMessage(chatId, "❌ Bunday kino topilmadi yoki kod noto‘g‘ri.");
    }
  }

  // /start buyrug‘i
  if (text === '/start') {
    return bot.sendMessage(chatId, "👋 Assalomu alaykum! Botdan foydalanish uchun quyidagi kanallarga a’zo bo‘ling:");
  }

  // Kanalga a’zo bo‘lmagan foydalanuvchini tekshirish
  const isVerified = db.data.verifiedUsers.includes(userId);

  if (!isVerified) {
    let notJoinedChannels = [];
    for (let channel of channels) {
      const isMember = await bot.getChatMember(channel, userId);
      if (!['member', 'administrator', 'creator'].includes(isMember.status)) {
        notJoinedChannels.push(channel);
      }
    }

    if (notJoinedChannels.length > 0) {
      const buttons = notJoinedChannels.map(channel => [
        { text: `➕ ${channel} ga qo‘shilish`, url: `https://t.me/${channel.slice(1)}` }
      ]);
      buttons.push([{ text: '✅ Tasdiqlash', callback_data: 'verify' }]);

      return bot.sendMessage(chatId, "📢 Iltimos, quyidagi kanallarga a’zo bo‘ling, so‘ng 'Tasdiqlash' tugmasini bosing:", {
        reply_markup: { inline_keyboard: buttons }
      });
    } else {
      return bot.sendMessage(chatId, "✅ Endi 'Tasdiqlash' tugmasini bosing:", {
        reply_markup: {
          inline_keyboard: [[{ text: '✅ Tasdiqlash', callback_data: 'verify' }]]
        }
      });
    }
  }

  // Kino kodi kiritish tugmasi
  if (text === "🎬 Kino kodi kiritish") {
    awaitingMovieCode.add(userId);
    return bot.sendMessage(chatId, "🎬 Iltimos, kino kodini kiriting (xabar ID raqami):");
  }
});

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  // Tasdiqlash tugmasi bosilganida
  if (data === 'verify') {
    const isVerified = db.data.verifiedUsers.includes(userId);
    if (!isVerified) {
      db.data.verifiedUsers.push(userId);
      await db.write();
      return bot.sendMessage(chatId, "✅ Siz tasdiqlandi va endi botdan to‘liq foydalanishingiz mumkin.");
    } else {
      return bot.sendMessage(chatId, "Siz allaqachon tasdiqlangan ekansiz.");
    }
  }
});
