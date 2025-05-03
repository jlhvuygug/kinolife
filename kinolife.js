const TelegramBot = require('node-telegram-bot-api');

const token = '7584847014:AAE6RZO72G7jVJ7JMwQmkhbifOaD9Xz7Vfs'
const bot = new TelegramBot(token, { polling: true });

const channels = ['@kinolifechannel']; // Azo bo'lish kerak bo'lgan kanallar
const mainChannelId = '@kjbljblblblbhblhbhgguyg'

// Foydalanuvchi xabar yozganda yoki /start yuborganda
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // Faqatgina "✅ Tasdiqladim" uchun alohida funksiya
  if (text === '✅ Tasdiqladim') {
    return await handleSubscriptionCheck(chatId, userId);
  }

  try {
    const notJoinedChannels = await getNotJoinedChannels(userId);
    if (notJoinedChannels.length === 0) {
      // Kino kodi kiritilganmi?
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
      sendJoinRequest(chatId, notJoinedChannels);
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Xatolik yuz berdi: " + err.message);
  }
});

// A'zolikni tekshiruvchi yordamchi funksiya
async function getNotJoinedChannels(userId) {
  const notJoined = [];
  for (let channel of channels) {
    const isMember = await checkMembership(channel, userId);
    if (!isMember) notJoined.push(channel);
  }
  return notJoined;
}

// Tekshiruvdan keyingi javob
async function handleSubscriptionCheck(chatId, userId) {
  const notJoinedChannels = await getNotJoinedChannels(userId);

  if (notJoinedChannels.length === 0) {
    bot.sendMessage(chatId, "✅ Endi siz barcha kanallarga a'zo bo‘lgansiz. Iltimos, kino kodini kiriting.");
  } else {
    sendJoinRequest(chatId, notJoinedChannels);
  }
}

// A'zolikni tekshiruvchi funksiya
async function checkMembership(channel, userId) {
  try {
    const res = await bot.getChatMember(channel, userId);
    return ['member', 'administrator', 'creator'].includes(res.status);
  } catch (err) {
    console.error(`checkMembership error for ${channel}:`, err.message);
    return false;
  }
}

// Kanalga a’zo bo‘lish tugmalari va “Tasdiqladim” tugmasi
function sendJoinRequest(chatId, channels) {
  const buttons = channels.map(channel => {
    return [{ text: `➕ ${channel}`, url: `https://t.me/${channel.slice(1)}` }];
  });

  buttons.push([{ text: "✅ Tasdiqladim", callback_data: "check" }]);

  bot.sendMessage(chatId, "📢 Iltimos, quyidagi kanallarga a’zo bo‘ling va so‘ng '✅ Tasdiqladim' tugmasini bosing:", {
    reply_markup: {
      inline_keyboard: buttons
    }
  });
}
