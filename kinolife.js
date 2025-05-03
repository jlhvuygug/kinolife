const TelegramBot = require('node-telegram-bot-api');

const token = '7584847014:AAE6RZO72G7jVJ7JMwQmkhbifOaD9Xz7Vfs';
const bot = new TelegramBot(token, { polling: true });

// Tekshiruvchi kanallar
const channels = ['@kinolifechannel'];
const mainChannelId = '@kjbljblblblbhblhbhgguyg';  


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

  // Foydalanuvchi "✅ Tasdiqladim" tugmasini bosganda
  if (text === '✅ Tasdiqladim') {
    return await handleSubscriptionCheck(chatId, userId);
  }

  // Oddiy holat
  try {
    let notJoinedChannels = [];

    for (let channel of channels) {
      const isMember = await checkMembership(channel, userId);
      if (!isMember) notJoinedChannels.push(channel);
    }

    if (notJoinedChannels.length === 0) {
      // Kino kodi bo'lsa
      if (!isNaN(text)) {
        try {
          await bot.copyMessage(chatId, mainChannelId, text);
        } catch (err) {
          console.error(err);
          bot.sendMessage(chatId, "❌ Kino topilmadi yoki xatolik yuz berdi.");
        }
      } else {
        bot.sendMessage(chatId, "✅ Siz kanallarga a'zo bo'lgansiz. Iltimos, kino kodini kiriting (masalan: 5).");
      }
    } else {
      sendJoinRequest(chatId, notJoinedChannels);
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Xatolik yuz berdi: " + err.message);
  }
});

// Tekshiruvni qayta bajaruvchi funksiya
async function handleSubscriptionCheck(chatId, userId) {
  let notJoinedChannels = [];

  for (let channel of channels) {
    const isMember = await checkMembership(channel, userId);
    if (!isMember) notJoinedChannels.push(channel);
  }

  if (notJoinedChannels.length === 0) {
    bot.sendMessage(chatId, "✅ Endi siz barcha kanallarga a'zo bo'lgansiz. Iltimos, kino kodini kiriting.");
  } else {
    sendJoinRequest(chatId, notJoinedChannels);
  }
}

// Kanallarga a’zo bo‘lish tugmalari
function sendJoinRequest(chatId, notJoinedChannels) {
  const buttons = notJoinedChannels.map(channel => {
    return [{ text: `➕ Kanalga qo‘shilish`, url: `https://t.me/${channel.slice(1)}` }];
  });

  buttons.push([{ text: "✅ Tasdiqladim" }]);

  const replyMarkup = {
    inline_keyboard: buttons
  };

  bot.sendMessage(chatId, "❗ Iltimos, quyidagi kanallarga qo‘shiling va so'ng '✅ Tasdiqladim' tugmasini bosing:", {
    reply_markup: replyMarkup
  });
}
