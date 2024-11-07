const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const config = require('../config')

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// client.on('interactionCreate', async interaction => {
//     if (!interaction.isChatInputCommand()) return;
  
//     if (interaction.commandName === 'ping') {
//       await interaction.reply('Pong!');
//     }
// });
  
client.login(config.BOT_TOKEN);