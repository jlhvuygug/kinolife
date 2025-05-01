const TelegramBot = require('node-telegram-bot-api');

// Bot tokenini o'rnating
const token = '7584847014:AAE6RZO72G7jVJ7JMwQmkhbifOaD9Xz7Vfs';

// Botni polling usulida ishga tushiramiz
const bot = new TelegramBot(token, { polling: true });

// Foydalanuvchi yuborgan matnni qabul qilish
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const message = msg.text;

  // Foydalanuvchiga javob berish
  bot.sendMessage(chatId, 'Siz yozgan matn: ' + message);
});
