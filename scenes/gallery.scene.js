const path = require('path');
const { messages } = require('../data/messages');
const { gallery } = require('../data/services');

function registerGalleryHandlers(bot) {
  bot.action('flow_gallery', async (ctx) => {
    await ctx.answerCbQuery();
    const media = gallery.map((item) => ({
      type: 'photo',
      media: { source: path.resolve(process.cwd(), item.imagePath) },
      caption: `${item.stage}`
    }));

    try {
      await ctx.replyWithMediaGroup(media);
    } catch (error) {
      await ctx.reply(`${messages.galleryIntro}\n\n` + gallery.map((item) => `• ${item.stage}`).join('\n'));
    }
  });
}

module.exports = { registerGalleryHandlers };
