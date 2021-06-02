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
    /**
     * First part : check if the message is for us, and update the log if necessary.
     */

    //To not answer its own messages
    if(message.author.id == Import.client.user.id)
        return;

    //Select correct messages whenn they come from a guild channel
    let guild = null;
    if(message.guild != undefined && message.guild != null){
        if (Import.GuildParameters.get(message.guild.id) == undefined || !message.content.startsWith(Import.GuildParameters.get(message.guild.id).prefix))
            return;
        else {
            //Update guild's log to signal the message
            guild = message.guild.id;
            Import.GuildLogStream.get(guild).write('\n');
            Import.GuildLogStream.get(guild).write('OnMessage');
            Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4)); 
        }
    }

    /**
     * Second part : message's parsing
     */
    
    //Necessary variables
    let options = [];
    let subject = [0, 0];
    let channel_eval = message.channel.id;
    
    //Message's divion and normalization
    options = (guild == null) ? message.content.split('-') : message.content.substring(Import.GuildParameters.get(message.guild.id).prefix.length).split('-');
    for (let i = 0; i < options.length; i++) {
        options[i] = options[i].replace(/\s/g, '');
        options[i] = options[i].toLocaleLowerCase();
    }

    /**
     * Third part : Enable the right command
     */    

    //DM commands
    {
        //Check command
        if(DM.commandList.includes(options[0])) {
            DM.command(message, options);
            return;
        }

        //If it's an DM, just leave
        if(guild == null) {
            BasicFunction.SendRightChannel(message, options, 'error', 'Unknown command !', (msg) => {}, [], "", false);
            return;
        }
    }
    
    //Settings command
    if(Settings.commandList.indexOf(options[0]) > -1) {
        Settings.command(message, options);
        return;
    }
    
    //Commands based on channels
    {
        //Check channel
        subject = BasicFunction.DoubleListContain(Import.GuildParameters.get(guild).channel_subject, channel_eval);
        if (subject[0] == -1 && Import.GuildParameters.get(guild).channel_prof.indexOf(channel_eval) == -1) {
            return;
        }

        //Prof commands
        if(Prof.commandList.indexOf(options[0]) > -1) {
            Prof.command(message, options);
            return;
        }

        //Pupils commands
        if(Pupils.commandList.indexOf(options[0]) > -1) {
            Pupils.command(message, options, subject[0]);
            return;
        }
    }

    BasicFunction.SendRightChannel(message, options, 'error', 'Unknown command !');
}

module.exports = {
    name : 'command',
    OnMessage : OnMessage  
}