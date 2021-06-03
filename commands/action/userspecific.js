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
const DMCommand = ['info', 'help'];

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options 
 */
function HelpCommand(message, options) {
    let embed = {
        color: 0x4AE5F9,//blue
        title: ':information_source: Information',
        description : '',
        author: {
            name: message.author.username,
            icon_url: message.author.avatarURL()
        },
        fields: [],
        footer: {
            text: options[0],
            icon_url: Import.client.user.avatarURL()
        }
    };

    //Basic help
    if(options.length == 1) {
        embed.description = 'This bot allows you to send some files to the Drive. It makes the difference between the *writers* and the *readers*. Here are the most used commands.';
        embed.fields = [
            {
                name: "Reader's commands",
                value: "`get   ` or `g` => Allows you to obtain any validated file (return an attachment). \n \
                        `search` or `s` => Returns you all the validated file in the selected subject and level.",
                inline: false
            },
            {
                name: "Writer's commands",
                value: "`send             ` or `sd` => Allows to send a course in the Drive.\n \
                        `validate         ` or `v ` => Validates the selected file.\n \
                        `search_unvalidate` or `su` => Returns you all the files which aren't validated.\n \
                        `get_unvalidate   ` or `gu` => Allows you to obtain any file which isn't validated.",
                inline: false
            },
            {
                name: "Adminstrator's commands",
                value: "`prefix         ` or `  ` => Allows to change the prefix of your bot.\n \
                        `create_settings` or `cs` => Allows to create a subject/level.\n \
                        `modify_settings` or `ms` => Allows you to change the bot's settings.",
                inline: false
            },
            {
                name:'More informations',
                value: 'If you want to have more precisions about a command just send in DM `help -<The_wanted_command>`',
                inline: false
            }
        ];
        message.author.send({ embed: embed });
    }
    else {
        switch(options[1]) {
            //Readers
            case 'g':
            case 'get': {
                embed.title += 's about `get`';
                embed.description = 'Allows you to get the content of any validated file. Complete command : \n `get -id:<A_file_ID>`';
                embed.fields = [
                    {
                        name:'`id:<A_file_ID>`',
                        value: 'Indicates the document’s ID.',
                        inline: false
                    },
                    {
                        name: 'Short version',
                        value: '`g`',
                        inline: false
                    }
                ];
                break;
            }
            case 's':
            case 'search': {
                embed.title += 's about `search`';
                embed.description = 'Allows you to search all the validated document for a given subject and a given level. Complete command : \n `search [-subject:<A_subject>] [-level:<A_level>]`';
                embed.fields = [
                    {
                        name:'`subject:<A_subject>`',
                        value: 'Indicates the subject of the files you want to see. By default, the subject which is linked to the channel where the message is sent.',
                        inline: false
                    },
                    {
                        name:'`level:<A_level>`',
                        value: 'Indicates the documents’ subject that you want to see. By default, your level role.',
                        inline: false
                    },
                    {
                        name: 'Short version',
                        value: '`s`',
                        inline: false
                    }
                ];
                break;
            }

            //Writers
            case 'sd':
            case 'send': {
                embed.title += 's about `send`';
                embed.description = 'Allows you to send a course in the Drive, you have to precise a level and a subject (eventually a type). Complete command : \n `send -subject:<A_subject> -level:<A_level> [-type:<type>] <your document>`';
                embed.fields = [
                    {
                        name:'`subject:<A_subject>`',
                        value: 'Indicates the document\'s subject.',
                        inline: false
                    },
                    {
                        name:'`level:<A_level>`',
                        value: 'Indicates the document\'s level.',
                        inline: false
                    },
                    {
                        name:'`type:<A_type>`',
                        value: 'Allow you to indicate the document’s type (optional, by default a `course`).',
                        inline: false
                    },
                    {
                        name:'`<your document>`',
                        value: 'Create an attachment to your document with Discord.',
                        inline: false
                    },
                    {
                        name: 'Short version',
                        value: '`sd`',
                        inline: false
                    }
                ];
                break;
            }
            case 'su':
            case 'search_unvalidate': {
                embed.title += 's about `search_unvalidate`';
                embed.description = 'Allows you to see the documents that wait for a validation in the indicated subject and the refused files. Complete command : \n `search_unvalidate -subject:<A_subject>`';
                embed.fields = [
                    {
                        name:'`subject:<A_subject>`',
                        value: 'Indicates the subject of the files you want to see.',
                        inline: false
                    },
                    {
                        name: 'Short version',
                        value: '`su`',
                        inline: false
                    }
                ];
                break;
            }
            case 'gu':
            case 'get_unvalidate': {
                embed.title += 's about `get_unvalidate`';
                embed.description = 'Allows you to get the content of a file which wait for a validation or which has been refused. Complete command : \n `get_unvalidate -id:<A_file_ID>`';
                embed.fields = [
                    {
                        name:'`id:<A_file_ID>`',
                        value: 'Indicate the document’s ID.',
                        inline: false
                    },
                    {
                        name: 'Short version',
                        value: '`gu`',
                        inline: false
                    }
                ];
                break;
            }
            case 'v':
            case 'validate': {
                embed.title += 's about `validate`';
                embed.description = 'Allows you to validate a document if it isn’t already refused. Complete command : \n `validate -id:<A_file_ID>`';
                embed.fields = [
                    {
                        name:'`id:<A_file_ID>`',
                        value: 'Indicate the document’s ID.',
                        inline: false
                    },
                    {
                        name: 'Short version',
                        value: '`v`',
                        inline: false
                    }
                ];
                break;
            }
            case 'r':
            case 'refuse': {
                embed.title += 's about `refuse`';
                embed.description = 'Allows you to refuse a document. A refused document can no more be validated. Complete command : \n `refuse -id:<A_file_ID>`';
                embed.fields = [
                    {
                        name:'`id:<A_file_ID>`',
                        value: 'Indicate the document’s ID.',
                        inline: false
                    },
                    {
                        name: 'Short version',
                        value: '`r`',
                        inline: false
                    }
                ];
                break;
            }
            case 'up':
            case 'update': {
                embed.title += 's about `update`';
                embed.description = 'Allows to update one of your documents. Complete command : \n `update -id:<A_file_ID>`';
                embed.fields = [
                    {
                        name:'`id:<A_file_ID>`',
                        value: 'Indicate the document’s ID.',
                        inline: false
                    },
                    {
                        name: 'Short version',
                        value: '`up`',
                        inline: false
                    }
                ];
                break;
            }
            case 'del':
            case 'delete': {
                embed.title += 's about `delete`';
                embed.description = 'Allows to delete one of your documents. Complete command : \n `delete -id:<A_file_ID>`';
                embed.fields = [
                    {
                        name:'`id:<A_file_ID>`',
                        value: 'Indicate the document’s ID.',
                        inline: false
                    },
                    {
                        name: 'Short version',
                        value: '`up`',
                        inline: false
                    }
                ];
                break;
            }

            //Administrators
            case 'cs':
            case 'create_settings': {
                embed.title += 's about `create_settings`';
                embed.description = 'Allows you to create a setting. The creatable settings are the subjects and the levels. You can’t create two settings simultaneously. Complete command : \n `create_settings [-subject:<subject_name>] [-level:<level_name>] - @<Role> [#<Channel>]`';
                embed.fields = [
                    {
                        name:'`subject:<subject_name>`',
                        value: 'Use it just if you want to create a subject. Indicate the subject’s name.',
                        inline: false
                    },
                    {
                        name:'`level: <level_name>`',
                        value: 'Use it just if you want to create a level. Indicate the level’s name.',
                        inline: false
                    },
                    {
                        name:'`@<Role>`',
                        value: 'Indicate an existing role, it will be bind to the setting : for a subject it will become the cprresponding writer\'s role and for a level it will be the corresponding reader\'s role.',
                        inline: false
                    },
                    {
                        name:'`#<Channel`',
                        value: 'Use it just if you want to create a subject. Indicate an existing Text Channel, it will be bind to the setting.',
                        inline: false
                    },
                    {
                        name: 'Short version',
                        value: '`cs`',
                        inline: false
                    }
                ];
                break;
            }
            case 'ms':
            case 'modify_settings': {
                embed.title += 's about `modify_settings';
                if(options.length > 2) {
                    switch(options[2]) {
                        case 'subject' : {
                            embed.title += ' -subject';
                            embed.description = 'Allows you to modify subject’s name or bindings : channels and role. Complete command : \n `modify_settings -subject:<A_subject> [-name:<new_name>] – [@<Role>] [#<Channel>]`';
                            embed.fields = [
                                {
                                    name:'`subject:<A_subject>`',
                                    value: 'Indicate the actual subject’s name you want to modify.',
                                    inline: false
                                },
                                {
                                    name:'`name:<new_name>`',
                                    value: 'Indicate the new name of the subject.',
                                    inline: false
                                },
                                {
                                    name:'`@<Role>`',
                                    value: 'Indicate an existing role, it will be bind to the subject instead of the old one.',
                                    inline: false
                                },
                                {
                                    name:'`#<Channel>`',
                                    value: 'Indicate an existing TextChannel, it will be added to the channels’ list of this subject if it’s not already in the list, else it will be deleted from the list.',
                                    inline: false
                                }
                            ];
                            break;
                        }
                        case 'level' :{
                            embed.title += ' -level';
                            embed.description = 'Allows you to modify level’s name or bindings: channels and role. Complete command : \n `modify_settings -level:<A_level> [-name:<new_name>] – [@<Role>]`';
                            embed.fields = [
                                {
                                    name:'`level:<A_level>`',
                                    value: 'Indicate the actual name of the level you want to modify.',
                                    inline: false
                                },
                                {
                                    name:'`name:<new_name>`',
                                    value: 'Indicate the new name of the level.',
                                    inline: false
                                },
                                {
                                    name:'`@<Role>`',
                                    value: 'Indicate an existing role, it will be bind to the level instead of the old one.',
                                    inline: false
                                }
                            ];
                            break;
                        }
                        case 'globalc' : {
                            embed.title += ' -globalc';
                            embed.description = 'Allows you to modify global channel’s list. Complete command : \n `modify_settings -globalc - #<Channel>`';
                            embed.fields = [
                                {
                                    name:'`#<Channel>`',
                                    value: 'Indicate an existing TextChannel, it will be added to the global channel\'s list if it’s not already in the list, else it will be deleted from the list.',
                                    inline: false
                                }
                            ];
                            break;
                        }
                        case 'validation' : {
                            embed.title += ' -validation';
                            embed.description = 'Allows you to enable or disable the validation system. Complete command : \n `modify_settings -validation:<true|false>`';
                            embed.fields = [
                                {
                                    name:'`<true|false>`',
                                    value: 'Indicate ‘true’ (enable) or ‘false’(disable).',
                                    inline: false
                                }
                            ];
                            break;
                        }
                        case 'refuse' : {
                            embed.title += ' -refuse';
                            embed.description = 'Allows you to enable or disable the refuse system. Complete command : \n `modify_settings -refuse:<true|false>`';
                            embed.fields = [
                                {
                                    name:'`<true|false>`',
                                    value: 'Indicate ‘true’ (enable) or ‘false’(disable).',
                                    inline: false
                                }
                            ];
                            break;
                        }
                        default: {
                            embed.description = 'Unknown argument !!';
                        }
                    }
                }
                else {
                    embed.description = 'This command is really complex and can\'t be explained in just one message. If you want more detail, just send one of these commands.';
                    embed.fields = [
                        {
                            name : '`help -modify_settings -subject`',
                            value : 'Allows you to modify subject’s name or bindings : channels and role.',
                            inline: false
                        },
                        {
                            name : '`help -modify_settings -level`',
                            value : 'Allows you to modify level’s name or role.',
                            inline: false
                        },
                        {
                            name : '`help -modify_settings -globalc`',
                            value : 'Allows modify global channel’s list',
                            inline: false
                        },
                        {
                            name : '`help -modify_settings -validation`',
                            value : 'Allows to enable or disable the validation system.',
                            inline: false
                        },
                        {
                            name : '`help -modify_settings -refuse`',
                            value : 'Allows to enable or disable the refuse system.',
                            inline: false
                        }
                    ]
                }
                embed.title += '`';
                embed.fields.push({
                    name: 'Short version',
                    value: '`ms`',
                    inline: false
                });
                break;
            }
            case 'hs':
            case 'handle_settings': {
                embed.title += 's about `handle_settings`';
                embed.description = 'Allows you to handle the guild’s settings. It’s not very useful, it was mainly for debugging. Complete command : \n `handle_settings [-view:<saved|run>] [-load] [-save]`';
                embed.fields = [
                    {
                        name:'`view:<saved|run>`',
                        value: 'Indicate ‘saved’ to get the settings saved on the disk and ‘run’ for the settings in the RAM. It’s in JSON.',
                        inline: false
                    },
                    {
                        name:'`load`',
                        value: 'Load the settings on the disk into RAM.',
                        inline: false
                    },
                    {
                        name:'`save`',
                        value: 'Save the settings in the RAM onto the disk.',
                        inline: false
                    },
                    {
                        name: 'Short version',
                        value: '`hs`',
                        inline: false
                    }
                ];
                break;
            }
            case 'prefix': {
                embed.title += 's about `prefix`';
                embed.description = 'Allows you to change the prefix of your bot. It’s by default ‘Biblio:’ (yes, it’s long). Complete command : \n `prefix -<new_prefix>`';
                embed.fields = [
                    {
                        name:'`<new_prefix>`',
                        value: 'Indicate the new prefix desired.',
                        inline: false
                    }
                ];
                break;
            }
            case 'url': {
                embed.title += 's about `url`';
                embed.description = 'Allows you to bind your bot to a GDrive folder (one for each server). Complete command : \n `url -link:<GDrive folder URL>`';
                embed.fields = [
                    {
                        name:'`link:<GDrive folder URL>`',
                        value: 'Indicate the share URL of your folder.',
                        inline: false
                    }
                ];
                break;
            }

            //DM
            case 'info': {
                embed.title += 's about `info`';
                embed.description = 'Allows to choose if you the bot have to send you a message when one of your files is refused or validated (useful only for authors). By default they are enabled. Complete command : \n `info -<enable|disable>`';
                embed.fields = [
                    {
                        name:'`<enable|disable>`',
                        value: 'Indicate `disable` to disable these messages else indicate `enable`.',
                        inline: false
                    }
                ];
                break;
            }
            case 'help': {
                embed.title += 's about `help`';
                embed.description = 'Display the basic help or the help associated with the specified command/subcommand. Complete command : \n `help [-<command_name>] [-<subcommand_name>]`';
                embed.fields = [
                    {
                        name:'`<command_name> `',
                        value: 'Indicate the command for which you need some help.',
                        inline: false
                    },
                    {
                        name:'`<subcommand_name> `',
                        value: 'Indicate the subcommand for which you need some help.',
                        inline: false
                    }
                ];
                break;
            }

            default : {
                BasicFunction.SendRightChannel(message, options, 'error', 'The wanted command doesn\'t exist.');
                return;
            }
        }
        message.author.send({ embed: embed });
    }
}

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
        case 'help' : {
            HelpCommand(message, options);
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