/*
 * "commands/action/userspecific.js"
 * Created by Math's
 */

//Necessary modules
const fs = require('fs');
const Discord = require('discord.js');
const BasicFunction = require('./basic');
 
//Global variables
var Import = require('../module_import');
const { SendRightChannel } = require('./basic');
 
//Commands
const DMCommand = ['info'];

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options 
 */
function SetInfo(message, options) {
    if(BasicFunction.GetMessageParameter(options, 'disable') != '-1') {
        if(Import.UserParameters.get(message.author.id) == undefined)
            Import.UserParameters.set(message.author.id, new Import.UserVariable(false));
        else
            Import.UserParameters.get(message.author.id).WantDM = false;
        SendRightChannel(message, options, 'confirm', 'Your preferences have been saved.', (msg) => {}, [], '', false);
        BasicFunction.SaveUserData(message.author.id);
    }
    else if(BasicFunction.GetMessageParameter(options, 'enable') != '-1') {
        if(Import.UserParameters.get(message.author.id) == undefined)
            Import.UserParameters.set(message.author.id, new Import.UserVariable(true));
        else
            Import.UserParameters.get(message.author.id).WantDM = true;
        SendRightChannel(message, options, 'confirm', 'Your preferences have been saved.', (msg) => {}, [], '', false);
        BasicFunction.SaveUserData(message.author.id);
    }
    else {
        SendRightChannel(message, options, 'error', 'Add the argument `disable` or `enable`.', (msg) => {}, [], '', false);
    }
}

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options 
 */
function CallDM(message, options) {
    const index = options.findIndex((value, i, obj) => { return value.startsWith('push'); })
    if (index >= 0)
        options.splice(index);
    ;
    
    switch(options[0]){
        case 'info' : {
            SetInfo(message, options);
            break;
        }
        default : {
            BasicFunction.SendRightChannel(message, options, 'error', 'Uknown command !', (msg) => {}, [], '', false);
        }
    }
}

module.exports = {
    name : 'DM',

    commandList : DMCommand,
    command : CallDM
}