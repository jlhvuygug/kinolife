const TelegramBot = require('node-telegram-bot-api');

// Bot tokenini o'rnating
const token = '7584847014:AAE6RZO72G7jVJ7JMwQmkhbifOaD9Xz7Vfs';

// Botni polling usulida ishga tushiramiz
const bot = new TelegramBot(token, { polling: true });

// Kanallar ro'yxati (kanal username'lari)
const channels = [
  '@kinolifechannel'
];

// Foydalanuvchiga kanal a'zoligini tekshirish
async function checkMembership(chatId, userId) {
  for (let i = 0; i < channels.length; i++) {
    try {
      const member = await bot.getChatMember(channels[i], userId);
      if (member.status === 'member' || member.status === 'administrator') {
        return true; // Foydalanuvchi kanalga a'zo
      }
    } catch (error) {
      return false; // Kanalga a'zo emas
    }
  }
  return false; // Hech bo'lmaganda biror kanalda a'zo emas
}

// Foydalanuvchi yuborgan xabarni qayta ishlash
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Foydalanuvchi yuborgan matnni tekshirish
  if (msg.text === '/check') {
    const isMember = await checkMembership(chatId, userId);

    if (isMember) {
      // Agar foydalanuvchi kanalga a'zo bo'lsa
      bot.sendMessage(chatId, 'Siz kanallarga a\'zo bo\'libsiz!');
    } else {
      // Agar foydalanuvchi kanalga a'zo bo'lmasa
      const inlineKeyboard = [
        [
          {
            text: 'A\'zo bo\'lish uchun kanal 1',
            url: 'https://t.me/kinolifechannel', // Kanalga havola
          }
        ],
        [
          {
            text: 'Tekshirish',
            callback_data: 'check_membership', // Tekshirish tugmasi
          }
        ]
      ];

      bot.sendMessage(chatId, 'Siz hali kanallarga a\'zo bo\'lmadingiz. Iltimos, a\'zo bo\'ling:', {
        reply_markup: { inline_keyboard: inlineKeyboard },
      });
    }
  }

  // Tekshirish tugmasini bosganda
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    if (callbackQuery.data === 'check_membership') {
      const isMember = await checkMembership(chatId, userId);

      if (isMember) {
        bot.sendMessage(chatId, 'Siz kanallarga a\'zo bo\'libsiz!');
      } else {
        bot.sendMessage(chatId, 'Siz hali kanallarga a\'zo bo\'lmadingiz. Iltimos, a\'zo bo\'ling:');
      }
    }
  });
});
