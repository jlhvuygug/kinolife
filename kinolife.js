const TelegramBot = require('node-telegram-bot-api');
const { Low, JSONFile } = require('lowdb');
const fs = require('fs');

// Token va admin ID
const token = '7584847014:AAE6RZO72G7jVJ7JMwQmkhbifOaD9Xz7Vfs';
const adminId = 7542365426;

// Botni ishga tushirish
const bot = new TelegramBot(token, { polling: true });

// LowDB sozlamalari
const adapter = new JSONFile('db.json');
const db = new Low(adapter);

// Kanallar
const channels = ["@kinolifechannel", '@UzHamyonbop'  ];

// Yopiq kanal ID (bot admin bo‘lishi kerak)
const privateChannelId = 2542231954; // o‘zingizning yopiq kanalingiz ID sini yozing

// Foydalanuvchi kino kodi kiritish rejimida ekanligini belgilash
const awaitingMovieCode = new Set();

// ... mavjud kodingiz ichida davom etamiz (startdan keyin...)

if (text === '/start') {
  return bot.sendMessage(chatId, "👋 Assalomu alaykum! Botdan foydalanish uchun quyidagi kanallarga a’zo bo‘ling:");
}

// ... tasdiqlangan foydalanuvchi tekshiruvidan keyin...

if (db.data.verifiedUsers.includes(userId)) {
  // Agar kino kodi rejimida bo‘lsa
  if (awaitingMovieCode.has(userId)) {
    awaitingMovieCode.delete(userId);
    const messageId = parseInt(text);

    if (isNaN(messageId)) {
      return bot.sendMessage(chatId, "❗ Noto‘g‘ri kod. Iltimos, raqamli kino kodini yuboring.");
    }

    try {
      const forwarded = await bot.forwardMessage(chatId, privateChannelId, messageId);
      return;
    } catch (e) {
      return bot.sendMessage(chatId, "❌ Bunday kino topilmadi yoki kod noto‘g‘ri.");
    }
  }

  // Menyu ko‘rsatish
  const keys = Object.keys(questions);
  const questionButtons = [];
  for (let i = 0; i < keys.length; i += 2) {
    const row = [
      { text: keys[i], callback_data: `question_${keys[i]}` }
    ];
    if (keys[i + 1]) row.push({ text: keys[i + 1], callback_data: `question_${keys[i + 1]}` });
    questionButtons.push(row);
  }
  questionButtons.push([{ text: "🎬 Kino kodi kiritish", callback_data: "get_movie" }]);
  questionButtons.push([{ text: "💬 Talab va takliflar", callback_data: "suggest" }]);

  await bot.sendMessage(chatId, "Quyidagilardan birini tanlang:", {
    reply_markup: { inline_keyboard: questionButtons }
  });

  return;
}

// callback_query ichiga qo‘shing
if (data === 'get_movie') {
  awaitingMovieCode.add(userId);
  return bot.sendMessage(msg.chat.id, "🎬 Iltimos, kino kodini kiriting (xabar ID raqami):");
}


// Savollar
const questions = {
    "Eng ko‘p ko‘rilgan kino qaysi?": "Hozirda eng ko‘p ko‘rilgan film — *Dune: Part Two* (2024).",
    "Qaysi janrlar hozir mashhur?": "Hozirda eng mashhur janrlar: fantastika, triller, va jangari.",
    "Netflix’dagi mashhur seriallar qaysilar?": "*3 Body Problem*, *The Gentlemen* va *Ripley* Netflix’da mashhurlik cho‘qqisida.",
    "O‘zbek kinolaridan eng ko‘p ko‘rilgani qaysi?": "*Sariq devni minib* va *Boyvachcha 5* O‘zbekistonda juda mashhur bo‘lgan.",
    "Yaqinda chiqadigan kutilgan kinolar": "*Deadpool 3*, *Joker: Folie à Deux*, va *Inside Out 2* 2024-yilda katta qiziqish bilan kutilyapti."
  };
  
// Holatlar
const awaitingSuggestions = new Set();

// Kanalga a’zolikni tekshiradi
const checkMembership = async (channel, userId) => {
  try {
    const member = await bot.getChatMember(channel, userId);
    return ['member', 'administrator', 'creator'].includes(member.status);
  } catch {
    return false;
  }
};

// Start va xabarlarni boshqarish
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  await db.read();
  db.data ||= { verifiedUsers: [] };

  if (awaitingSuggestions.has(userId)) {
    awaitingSuggestions.delete(userId);
    bot.sendMessage(adminId, `📩 Yangi taklif:\n👤 ${msg.from.first_name} (@${msg.from.username || 'yo‘q'})\n🆔 ID: ${userId}\n📝 ${text}`);
    return bot.sendMessage(chatId, "✅ Taklifingiz yuborildi. Rahmat!");
  }

  // /start buyrug‘i
  if (text === '/start') {
    return bot.sendMessage(chatId, "👋 Assalomu alaykum! Botdan foydalanish uchun quyidagi kanallarga a’zo bo‘ling:");
  }

  const isVerified = db.data.verifiedUsers.includes(userId);

  if (!isVerified) {
    let notJoinedChannels = [];
    for (let channel of channels) {
      const isMember = await checkMembership(channel, userId);
      if (!isMember) notJoinedChannels.push(channel);
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

  // Agar tasdiqlangan bo‘lsa
  const keys = Object.keys(questions);
  const questionButtons = [];
  for (let i = 0; i < keys.length; i += 2) {
    const row = [
      { text: keys[i], callback_data: `question_${keys[i]}` }
    ];
    if (keys[i + 1]) row.push({ text: keys[i + 1], callback_data: `question_${keys[i + 1]}` });
    questionButtons.push(row);
  }
  questionButtons.push([{ text: "💬 Talab va takliflar", callback_data: "suggest" }]);

  await bot.sendMessage(chatId, "Quyidagilardan birini tanlang:", {
    reply_markup: { inline_keyboard: questionButtons }
  });
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
  
    await db.read();
    db.data ||= { verifiedUsers: [] };
  
    // Taklif rejimi
    if (awaitingSuggestions.has(userId)) {
      awaitingSuggestions.delete(userId);
      bot.sendMessage(adminId, `📩 Yangi taklif:\n👤 ${msg.from.first_name} (@${msg.from.username || 'yo‘q'})\n🆔 ID: ${userId}\n📝 ${text}`);
      return bot.sendMessage(chatId, "✅ Taklifingiz yuborildi. Rahmat!");
    }
  
    // Kino kodi rejimi
    if (awaitingMovieCode.has(userId)) {
      awaitingMovieCode.delete(userId);
      const messageId = parseInt(text);
      if (isNaN(messageId)) {
        return bot.sendMessage(chatId, "❗ Noto‘g‘ri kod. Iltimos, raqamli kino kodini yuboring.");
      }
      try {
        await bot.forwardMessage(chatId, privateChannelId, messageId);
      } catch (e) {
        return bot.sendMessage(chatId, "❌ Bunday kino topilmadi yoki kod noto‘g‘ri.");
      }
      return;
    }
  
    // /start komandasi
    if (text === '/start') {
      return bot.sendMessage(chatId, "👋 Assalomu alaykum! Botdan foydalanish uchun quyidagi kanallarga a’zo bo‘ling:");
    }
  
    const isVerified = db.data.verifiedUsers.includes(userId);
  
    if (!isVerified) {
      let notJoinedChannels = [];
      for (let channel of channels) {
        const isMember = await checkMembership(channel, userId);
        if (!isMember) notJoinedChannels.push(channel);
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
  
    // Tasdiqlangan foydalanuvchi uchun menyu
    const keys = Object.keys(questions);
    const questionButtons = [];
    for (let i = 0; i < keys.length; i += 2) {
      const row = [
        { text: keys[i], callback_data: `question_${keys[i]}` }
      ];
      if (keys[i + 1]) row.push({ text: keys[i + 1], callback_data: `question_${keys[i + 1]}` });
      questionButtons.push(row);
    }
    questionButtons.push([{ text: "🎬 Kino kodi kiritish", callback_data: "get_movie" }]);
    questionButtons.push([{ text: "💬 Talab va takliflar", callback_data: "suggest" }]);
  
    return bot.sendMessage(chatId, "Quyidagilardan birini tanlang:", {
      reply_markup: { inline_keyboard: questionButtons }
    });
  });
  