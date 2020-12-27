/*
 * "commands/command.js"
 * Created by Math's
 */

 //Necessary modules
const Discord = require('discord.js');
var Import = require('./module_import.js');

//Collections of functions
const Prof = require('./action/prof.js');
const Pupils = require('./action/pupils.js');
const Settings = require('./action/settings.js');
const BasicFunction = require('./action/basic.js');
const DM = require('./action/userspecific');

/*________________________________________*/

/**
 * @description Called when the bot receive a message, if it's a command it calls the correspondant function.
 * @param {Discord.Message} message 
 */
function OnMessage(message) {
    const info = Import;

    //For DM messages
    if(message.guild == undefined || message.guild == null) {
        let options = message.content.split('-');
        for (let i = 0; i < options.length; i++) {
            options[i] = options[i].replace(/\s/g, '');
            options[i] = options[i].toLocaleLowerCase();
        }
        DM.command(message, options)
        return;
    }
    
    //If the message isn't for the bot
    if (Import.GuildParameters.get(message.guild.id) == undefined || !message.content.startsWith(Import.GuildParameters.get(message.guild.id).prefix))
    {
        return;
    }

    //For guild messages
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('OnMessage');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    /**
     * @type {string[]}
     **/
    let options = [];
    let subject = [0, 0];
    let channel_eval = message.channel.id;
    
    options = message.content.substring(Import.GuildParameters.get(message.guild.id).prefix.length).split('-');
    for (let i = 0; i < options.length; i++) {
        options[i] = options[i].replace(/\s/g, '');
        options[i] = options[i].toLocaleLowerCase();
    }
    
    if(Settings.commandList.indexOf(options[0]) > -1)
    {
        Settings.command(message, options);
        return;
    }
    
    subject = BasicFunction.DoubleListContain(Import.GuildParameters.get(guild).channel_subject, channel_eval);
    if (subject[0] == -1 && Import.GuildParameters.get(guild).channel_prof.indexOf(channel_eval) == -1)
        return;

    if(Prof.commandList.indexOf(options[0]) > -1) {
        Prof.command(message, options);
        return;
    }

    if(Pupils.commandList.indexOf(options[0]) > -1) {
        Pupils.command(message, options, subject[0]);
        return;
    }

    BasicFunction.SendRightChannel(message, options, 'error', 'Unknown command !');
}

module.exports = {
    name : 'command',
    OnMessage : OnMessage  
}