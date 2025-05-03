const TelegramBot = require('node-telegram-bot-api');

const token = '7584847014:AAE6RZO72G7jVJ7JMwQmkhbifOaD9Xz7Vfs'
const bot = new TelegramBot(token, { polling: true });

const channels = ['@kinolifechannel']; // A’zo bo‘lish kerak bo‘lgan kanallar
const mainChannelId = '@kjbljblblblbhblhbhgguyg'

// A'zolikni tekshiruvchi funksiya
async function checkMembership(userId) {
  for (let channel of channels) {
    try {
      const member = await bot.getChatMember(channel, userId);
      if (!['member', 'administrator', 'creator'].includes(member.status)) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  return true;
}

// Kino kodi so‘rash yoki a'zolik so‘rovini yuborish
async function handleUser(chatId, userId, text) {
  const isMember = await checkMembership(userId);

  if (isMember) {
    if (!isNaN(text)) {
      try {
        await bot.copyMessage(chatId, mainChannelId, text);
      } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, "❌ Kino topilmadi yoki xatolik yuz berdi.");
      }
    } else {
      bot.sendMessage(chatId, "🎬 Iltimos, kino kodini kiriting (masalan: 5).");
    }
  } else {
    const buttons = [
      ...channels.map(channel => [{
        text: `📢 ${channel}`,
        url: `https://t.me/${channel.slice(1)}`
      }]),
      [{ text: "✅ Tasdiqladim", callback_data: "check_membership" }]
    ];

    bot.sendMessage(chatId, "❗ Iltimos, quyidagi kanalga a'zo bo'ling va keyin '✅ Tasdiqladim' tugmasini bosing:", {
      reply_markup: { inline_keyboard: buttons }
    });
  }
}

// Foydalanuvchi xabar yuborganda
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // Har qanday xabarni tekshir
  await handleUser(chatId, userId, text);
});

// Callback tugma ("Tasdiqladim")ni ushlash
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;

  if (callbackQuery.data === 'check_membership') {
    const isMember = await checkMembership(userId);

    if (isMember) {
      bot.sendMessage(chatId, "✅ A'zo bo‘lganingiz tasdiqlandi. Endi kino kodini yuboring.");
    } else {
      bot.sendMessage(chatId, "❗ Siz hali kanalga a'zo bo'lmagansiz. Iltimos, avval a'zo bo'ling.");
    }

    // Javob qaytarish
    bot.answerCallbackQuery(callbackQuery.id);
  }
});
