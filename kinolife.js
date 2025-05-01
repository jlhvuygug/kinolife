const TelegramBot = require('node-telegram-bot-api');

// Bot tokenini o'rnating
const token = '7584847014:AAE6RZO72G7jVJ7JMwQmkhbifOaD9Xz7Vfs';

// Botni polling usulida ishga tushiramiz
const bot = new TelegramBot(token, { polling: true });

// Kanallar ro'yxati (kanal username'lari)
const channels = ['@kinolifechannel'];

// Foydalanuvchiga kanal a'zoligini tekshirish
async function checkMembership(userId) {
  for (let i = 0; i < channels.length; i++) {
    try {
      const member = await bot.getChatMember(channels[i], userId);
      if (
        member.status === 'member' ||
        member.status === 'administrator' ||
        member.status === 'creator'
      ) {
        // A'zo bo'lsa davom etamiz
        continue;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  return true;
}

// Foydalanuvchi xabar yuborganda
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (msg.text === '/check') {
    const isMember = await checkMembership(userId);

    if (isMember) {
      bot.sendMessage(chatId, "✅ Siz kanalga a'zo bo'lgansiz!");
    } else {
      const inlineKeyboard = [
        [
          {
            text: "📢 Kanalga a'zo bo'lish",
            url: 'https://t.me/kinolifechannel',
          },
        ],
        [
          {
            text: '🔄 Tekshirish',
            callback_data: 'check_membership',
          },
        ],
      ];

      bot.sendMessage(chatId, "❗ Iltimos, quyidagi kanalga a'zo bo'ling:", {
        reply_markup: { inline_keyboard: inlineKeyboard },
      });
    }
  }
});

// Callback tugmani ushlash (alohida joyda bo'lishi kerak!)
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  if (callbackQuery.data === 'check_membership') {
    const isMember = await checkMembership(userId);

    if (isMember) {
      bot.sendMessage(chatId, "✅ Siz kanalga a'zo bo'lgansiz!");
    } else {
      bot.sendMessage(chatId, "❗ Siz hali kanalga a'zo bo'lmadingiz. Iltimos, a'zo bo'ling.");
    }

    // Callback query ga javob yuborish (error chiqmasligi uchun)
    bot.answerCallbackQuery(callbackQuery.id);
  }
});
