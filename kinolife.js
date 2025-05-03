let TelegramBot = require('node-telegram-bot-api');

const token = '7584847014:AAE6RZO72G7jVJ7JMwQmkhbifOaD9Xz7Vfs';
const bot = new TelegramBot(token, { polling: true });

// Kanal username'lari
const channels = ['@kinolifechannel'];

// Yopiq kanal chat ID (masalan: -1001234567890)
const mainChannelId = 2542231954;

// A'zolikni tekshiruvchi funksiya
const checkMembership = async (channel, userId) => {
  try {
    const member = await bot.getChatMember(channel, userId);
    return ['member', 'administrator', 'creator'].includes(member.status);
  } catch (error) {
    return false;
  }
};


// Message kelganda ishlovchi funksiya
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // Agar foydalanuvchi "✅ Tasdiqladim" tugmasini bossa
  if (text === '✅ Tasdiqladim') {
    let stillNotJoined = [];
    for (let channel of channels) {
      const isMember = await checkMembership(channel, userId);
      if (!isMember) stillNotJoined.push(channel);
    }

    if (stillNotJoined.length === 0) {
      bot.sendMessage(chatId, "✅ Endi siz barcha kanallarga a'zo bo'lgansiz. Iltimos, kino kodini kiriting (masalan: 5).");
    } else {
      let buttons = stillNotJoined.map(channel => {
        return [{ text: `➕ Kanalga qo‘shilish`, url: `https://t.me/${channel.slice(1)}` }];
      });
      buttons.push([{ text: "✅ Tasdiqladim" }]); // qayta tekshirish tugmasi

      const replyMarkup = {
        inline_keyboard: buttons
      };

      bot.sendMessage(chatId, "❗ Hali ham quyidagi kanallarga a'zo bo'lishingiz kerak:", { reply_markup: replyMarkup });
    }
    return;
  }

  // Kino kodi yoki boshqa xabar
  try {
    let notJoinedChannels = [];
    for (let channel of channels) {
      const isMember = await checkMembership(channel, userId);
      if (!isMember) notJoinedChannels.push(channel);
    }

    if (notJoinedChannels.length === 0) {
      if (!isNaN(text)) {
        try {
          await bot.copyMessage(chatId, mainChannelId, text);
        } catch (err) {
          console.error(err);
          bot.sendMessage(chatId, "❌ Kino topilmadi yoki xatolik yuz berdi.");
        }
      } else {
        bot.sendMessage(chatId, "✅ Siz kanallarga a'zo bo'lgansiz. Kino kodi yuboring (masalan: 5)!");
      }
    } else {
      let buttons = notJoinedChannels.map(channel => {
        return [{ text: `➕ Kanalga qo‘shilish`, url: `https://t.me/${channel.slice(1)}` }];
      });

      buttons.push([{ text: "✅ Tasdiqladim" }]); // Yangi tugma

      const replyMarkup = {
        inline_keyboard: buttons
      };

      bot.sendMessage(chatId, "❗ Iltimos, quyidagi kanallarga qo‘shiling, so‘ng '✅ Tasdiqladim' tugmasini bosing:", {
        reply_markup: replyMarkup
      });
    }

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Xatolik yuz berdi: " + error.message);
  }
});
