/*
 * "commands/process_handle.js"
 * Created by Math's
 */

 //Necessary modules
const Discord = require('discord.js');
const BasicFunction = require('./action/basic');
const fs = require('fs');

//Global variables
var Import = require('./module_import.js');

/*________________________________________*/

/**
 * @description Basically DO NOTHING LOL
 */
function OnProgrammStart()
{
}

/**
 * Check for server's transformations (and handle trouble which have been precedently found)
 */
function OnConnectToDiscord() {
    Import.client.guilds.cache.forEach(function (guild, id, collection) {
        Import.GuildLogStream.set(id, fs.createWriteStream('guildsfiles/' + id + '.jsonlog', { encoding: 'utf-8', flags: 'as+' }));
        BasicFunction.LoadSettings(id);
    });

    Import.client.users.cache.forEach(function(userObj, user, collection) {
        BasicFunction.LoadUserData(user);
    });

    for (const iterator of Import.GuildParameters) {
        if (iterator[1].channel_subject.length != iterator[1].role_subject.length || iterator[1].channel_subject.length != iterator[1].subject_name.length){
            let fakeMessage = {
                author: Import.client.guilds.cache.get(iterator[0]).owner.user,
                guild: Import.client.guilds.cache.get(iterator[0])
            }
            BasicFunction.SendRightChannel(fakeMessage, ['boot'], 'error', 'There is troubles in your settings : \n The lenghts of your subject\'s lists doesn\'t match');
        }

        if (iterator[1].level_name.length != iterator[1].role_level.length){
            let fakeMessage = {
                author: Import.client.guilds.cache.get(iterator[0]).owner.user,
                guild: Import.client.guilds.cache.get(iterator[0])
            }
            BasicFunction.SendRightChannel(fakeMessage, ['boot'], 'error', 'There is troubles in your settings : \n The lenghts of your level\'s lists don\'t match');
        }
    }
}

/**
 * @description Just save the settings
 */
function OnDisconnectToDiscord()
{
    Import.client.guilds.cache.forEach(function (a, guild, collection) {
        BasicFunction.SaveSettings(guild);
    });
}

/*________________________________________*/

/**
 * 
 * @param {Discord.Role} roleObj 
 */
function OnDeleteRole(roleObj) {
    const guild = roleObj.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('OnDeleteRole');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    let nothing = true;

    let level_role_n = Import.GuildParameters.get(guild).role_level.indexOf(roleObj.id);
    if (level_role_n != -1) {
        Import.GuildParameters.get(guild).role_level[level_role_n] = '';
        nothing = false;
    }

    let subject_role_n = Import.GuildParameters.get(guild).role_subject.indexOf(roleObj.id);
    if (subject_role_n != -1) {
        Import.GuildParameters.get(guild).role_subject[subject_role_n] = '';
        nothing = false;
    }

    if (nothing)
        return;

    BasicFunction.SaveSettings(guild);

    let fakeMessage = {
        author: roleObj.guild.owner.user,
        guild: roleObj.guild
    }
    BasicFunction.SendRightChannel(fakeMessage, ['Role suppression'], 'info', 'A role used by Biblio has been deleted. \n Check out your Bilio\'s settings to set a new role instead of the old one.');
}

/**
 * 
 * @param {Discord.TextChannel} channelObj
 */
function OnDeleteChannel(channelObj) {
    if(channelObj.type != 'text')
        return;

    const guild = channelObj.guild.id;
    let nothing = true;

    var subject_channel_nn = BasicFunction.DoubleListContain(Import.GuildParameters.get(guild).channel_subject, channelObj.id);    
    if (subject_channel_nn[0] != -1) {
        Import.GuildParameters.get(guild).channel_subject[subject_channel_nn[0]].splice(subject_channel_nn[1], 1);
        nothing = false;
    }

    var prof_channel_n = Import.GuildParameters.get(guild).channel_prof.indexOf(channelObj.id);
    if (prof_channel_n != -1) {
        Import.GuildParameters.get(guild).channel_prof.splice(prof_channel_n, 1);
        nothing = false;
    }

    if (nothing)
        return;

    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('OnDeleteChannel');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));
    
    BasicFunction.SaveSettings(guild);
    let fakeMessage = {
        author: channelObj.guild.owner.user,
        guild: channelObj.guild
    }
    BasicFunction.SendRightChannel(fakeMessage, ['Channel suppression'], 'info', 'A channel used by Biblio has been deleted. \n Check out your Bilio\'s settings to set a new channel if necessary.');
}

/**
 * 
 * @param {Discord.Guild} guildObj 
 */
function OnLeftGuild(guildObj)
{
    const guild = guildObj.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('OnLeftGuild');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    //Maybe send a message to the owner ?
}

/**
 * 
 * @param {Discord.Guild} guildObj 
 * @description Send a message to the guild's owner and create a new settings variable
 */
function OnNewGuild(guildObj) {
    Import.GuildLogStream.set(guildObj.id, fs.createWriteStream('guildsfiles/' + guildObj.id + '.jsonlog', { encoding: 'utf-8', flags: 'as+' }));
    Import.GuildParameters.set(guildObj.id, new Import.SettingsVariable());
    BasicFunction.SaveSettings(guildObj.id);
}

module.exports = {
    name : 'process_handle',

    OnProgrammStart: OnProgrammStart,
    OnConnectToDiscord: OnConnectToDiscord,
    OnDisconnectToDiscord : OnDisconnectToDiscord,

    OnDeleteRole : OnDeleteRole,
    OnDeleteChannel: OnDeleteChannel,
    OnLeftGuild: OnLeftGuild,
    OnNewGuild: OnNewGuild
}