let TelegramBot = require('node-telegram-bot-api');

const token = '7584847014:AAE6RZO72G7jVJ7JMwQmkhbifOaD9Xz7Vfs';
const bot = new TelegramBot(token, { polling: true });

// Kanal username'lari
const channels = ['@kinolifechannel'];

// Yopiq kanal chat ID (masalan: -1001234567890)
const mainChannelId = -1001234567890;

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

  try {
    // 1. A'zolikni tekshirish
    let notJoinedChannels = [];
    for (let channel of channels) {
      const isMember = await checkMembership(channel, userId);
      if (!isMember) {
        notJoinedChannels.push(channel);
      }
    }

    // 2. Agar barcha kanallarga a'zo bo'lsa
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
      // 3. A'zo bo'lmagan kanallar ro'yxati
      let buttons = notJoinedChannels.map(channel => {
        return [{ text: `➕ Kanalga qo‘shilish`, url: `https://t.me/${channel.slice(1)}` }];
      });

      const replyMarkup = {
        inline_keyboard: buttons
      };

      bot.sendMessage(chatId, "❗ Iltimos, quyidagi kanallarga qo‘shiling:", { reply_markup: replyMarkup });
    }

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "❌ Xatolik yuz berdi: " + error.message);
  }
});
