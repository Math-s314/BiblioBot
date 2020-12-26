/*
 * "biblio.js"
 * Created by Math's
 */

//Necessary modules
const auth_path = require('./auth.json');
const discord_auth = require('./' + auth_path.path + auth_path.discord_keys[0]);

//Global variables
var Import = require('./commands/module_import');

//Collections of functions
const LibBot = require('./commands/command');
const Process = require('./commands/process_handle');

//Process management
{
    Process.OnProgrammStart();
    Import.client.once('ready', Process.OnConnectToDiscord);
    Import.client.once('invalidated', Process.OnDisconnectToDiscord);
}

//Guilds management
{
    Import.client.on('guildCreate', Process.OnNewGuild);
    Import.client.on('guildDelete', Process.OnLeftGuild);
    Import.client.on('roleDelete', Process.OnDeleteRole);
    Import.client.on('channelDelete', Process.OnDeleteChannel);
}

//Messages management
{
    Import.client.on('message', LibBot.OnMessage);
}

//Discord's authentification
Import.client.login(discord_auth.token);