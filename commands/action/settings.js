/*
 * "commands/action/settings.js"
 * Created by Math's
 */

 //Necessary modules
const async = require('async');
const fs = require('fs');
const Discord = require('discord.js');
const BasicFunction = require('./basic');

//Global variables
var Import = require('../module_import');

//Commands
const settingsCommand = ['create_settings', 'modify_settings', 'url', 'handle_settings', 'cs', 'ms', 'hs', 'prefix'];

/*________________________________________*/

/**
 * 
 * @param {Discord.Message} message 
 * @param {string[]} options
 */
function CreateASetting(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('CreateASetting');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    let param = BasicFunction.GetMessageParameter(options, 'level');

    if(param != '-1')
    {
        if(param == '')
        {
            BasicFunction.SendRightChannel(message, options, 'error', 'Missing value for the `level` argument !');
            return;
        }
        let role = message.mentions.roles.first();
        if(!role)
        {
            BasicFunction.SendRightChannel(message, options, 'error', 'Missing a role to execute the command !');
            return;
        }

        Import.GuildParameters.get(guild).level_name.push(param);
        Import.GuildParameters.get(guild).role_level.push(role.id);

        BasicFunction.SaveSettings(guild);

        async.timesSeries(Import.GuildParameters.get(guild).subject_name.length, function(i, next){
            async.series([
                function (callback) {
                    BasicFunction.FindFolderLink(('valide/' + new String(i)), guild, callback);
                }
            ], function (err, result) {
                let creatParam = {
                    auth: Import.auth,
                    requestBody: {
                        'parents': result,
                        'name': new String(Import.GuildParameters.get(guild).level_name.indexOf(param)),
                        'mimeType': 'application/vnd.google-apps.folder'
                    }
                    }
                Import.drive.files.create(creatParam, function(err, res){ next(null, null);});
            });
        }, function (err, res) {
                BasicFunction.SendRightChannel(message, options, 'confirm', 'The `' + param + '` level has been correctly created.');
        });
        return;
    }

    param = BasicFunction.GetMessageParameter(options, 'subject');

    if(param != '-1')
    {
        if(param == '')
        {
            BasicFunction.SendRightChannel(message, options, 'error', 'Missing value for the `subject` argument !');
            return;
        }
        let role = message.mentions.roles.first();
        if (!role)
        {
            BasicFunction.SendRightChannel(message, options, 'error', 'Missing a role to execute the command !');
            return;
        }
        let channel = message.mentions.channels.first();
        if (!channel)
        {
            BasicFunction.SendRightChannel(message, options, 'error', 'Missing a channel to execute the command !');
            return;
        }

        Import.GuildParameters.get(guild).subject_name.push(param);
        Import.GuildParameters.get(guild).role_subject.push(role.id);
        Import.GuildParameters.get(guild).channel_subject.push([channel.id]);

        BasicFunction.SaveSettings(guild);

        async.series([
            function (callback) {
                async.series([
                    function (cb) {
                        BasicFunction.FindFolderLink('valide', guild, cb);
                    }
                ], function (err, result) {
                    let creatParam = {
                        fields: 'id',
                        auth: Import.auth,
                        requestBody: {
                            'parents': result,
                            'name': new String(Import.GuildParameters.get(guild).subject_name.indexOf(param)),
                            'mimeType': 'application/vnd.google-apps.folder'
                        }
                    }   
                    Import.drive.files.create(creatParam, function (err, res) {callback(null, res.data.id); });
                });
            }
        ], function (err, result) {
            for (let i = 0; i < Import.GuildParameters.get(guild).level_name.length; i++) {
                let creatParam = {
                    fields: 'id',
                    auth: Import.auth,
                    requestBody: {
                        'parents': result,
                        'name': new String(i),
                        'mimeType': 'application/vnd.google-apps.folder'
                    }
                }
                Import.drive.files.create(creatParam);
                }
                BasicFunction.SendRightChannel(message, options, 'confirm', 'The `' + param + '` subject has been correctly created.');
        });

        return;
    }

    BasicFunction.SendRightChannel(message, options, 'error', 'You have to add a `subject` or a `level` argument to execute this command.');
}

/**
 * 
 * @param {Discord.Message} message 
 * @param {string[]} options
 */
function ModifyASetting(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('ModifyASetting');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    let param_n = -1;
    let param_s = '-1';
    param_s = BasicFunction.GetMessageParameter(options, 'level');

    if(param_s != '-1') {
        let config = false;
        param_n = Import.GuildParameters.get(guild).level_name.indexOf(param_s);
        if (param_n == -1) {
            BasicFunction.SendRightChannel(message, options, 'error', 'the given level doesn\'t exist');
            return;
        }

        let name = BasicFunction.GetMessageParameter(options, 'name');
        if (name != '' && name != '-1') {
            config = true;
            Import.GuildParameters.get(guild).level_name[param_n] = name;
            BasicFunction.SendRightChannel(message, options, 'confirm', 'The level\'s name has been successfully set to `' + name + '`.');
        }

        let role = message.mentions.roles.first();
        if (role != undefined) {
            config = true;
            Import.GuildParameters.get(guild).role_level[param_n] = role.id;
            BasicFunction.SendRightChannel(message, options, 'confirm', 'The level\'s role has been successfully set to `' + role.name + '`.');
        }

        BasicFunction.SaveSettings(guild);
        if (config)
            BasicFunction.SendRightChannel(message, options, 'confirm', 'The level\'s configuration is finished.');
        else
            BasicFunction.SendRightChannel(message, options, 'error', 'You have to add a `role` or a `name` argument to execute this command.');

        return;
    }

    param_s = BasicFunction.GetMessageParameter(options, 'subject');

    if (param_s != '-1') {
        let config = false;
        param_n = Import.GuildParameters.get(guild).subject_name.indexOf(param_s);
        if (param_n == -1) {
            BasicFunction.SendRightChannel(message, options, 'error', 'the given subject doesn\'t exist');
            return;
        }

        let name = BasicFunction.GetMessageParameter(options, 'name');
        if (name != '' && name != '-1') {
            Import.GuildParameters.get(guild).subject_name[param_n] = name;
            config = true;
            BasicFunction.SendRightChannel(message, options, 'confirm', 'The subject\'s name has been successfully set to `' + name + '`.');
        }

        let role = message.mentions.roles.first();
        if (role != undefined) {
            Import.GuildParameters.get(guild).role_subject[param_n] = role.id;
            config = true;
            BasicFunction.SendRightChannel(message, options, 'confirm', 'The subject\'s role has been successfully set to `' + role.name + '`.');
        }
        
        let channel = message.mentions.channels.first();
        if (channel != undefined) {
            config = true;

            let index = Import.GuildParameters.get(guild).channel_subject[param_n].indexOf(channel.id);
            if (index != -1) {
                Import.GuildParameters.get(guild).channel_subject[param_n].splice(index);
                BasicFunction.SendRightChannel(message, options, 'confirm', 'The channel has been successfully removed from the subject\'s channel list.');
            }
            else {
                Import.GuildParameters.get(guild).channel_subject[param_n].push(channel.id);
                BasicFunction.SendRightChannel(message, options, 'confirm', 'The channel has been successfully added to the subject\'s channel list.');
            }
        }

        BasicFunction.SaveSettings(guild);
        if (config)
            BasicFunction.SendRightChannel(message, options, 'confirm', 'The subject\'s configuration is finished.');
        else
            BasicFunction.SendRightChannel(message, options, 'error', 'You have to add a `role`, a `channel` or a `name` argument to execute this command.');
        return;
    }

    param_s = BasicFunction.GetMessageParameter(options, 'globalc');

    if (param_s != '-1')
    {
        let channel = message.mentions.channels.first();

        if (channel != undefined) {
            let index = Import.GuildParameters.get(guild).channel_prof.indexOf(channel.id);
            if (index != -1) {
                Import.GuildParameters.get(guild).channel_prof.splice(index, 1);
                BasicFunction.SendRightChannel(message, options, 'confirm', 'The channel has been successfully removed.');
            }
            else {
                Import.GuildParameters.get(guild).channel_prof.push(channel.id);
                BasicFunction.SendRightChannel(message, options, 'confirm', 'The channel has been successfully added.');
            }
        }
        else {
            BasicFunction.SendRightChannel(message, options, 'error', 'Missing a channel to execute the command !');
            return;
        }

        BasicFunction.SaveSettings(guild);
        return;
    }

    param_s = BasicFunction.GetMessageParameter(options, 'validation');

    if (param_s == 'true') {
        Import.GuildParameters.get(guild).IsThereAValidation = true;
        BasicFunction.SaveSettings(guild);
        BasicFunction.SendRightChannel(message, options, 'confirm', 'The validation system has been activated. You can now validate and refuse file(s).');
        return;
    }
    else if (param_s == 'false') {
        Import.GuildParameters.get(guild).IsThereAValidation = false;
        async.series([
            function (call) {
                BasicFunction.GetAllFileInPosition('wait', guild, 'files(id, name, appProperties(subject, level, permission))', null, function (err, res, param, callcall) {
                    async.forEachOf(res.data.files, function (file, i, cb) {
                        if (file.appProperties.permission == 'nr')
                            BasicFunction.MoveFile('wait', file.id, 'valide/' + file.appProperties.subject + '/' + file.appProperties.level, guild, cb);
                        else
                            cb();
                    }, function (err) {
                        callcall(null, true);
                    });
                }, call);
            },
            function (call) {
                BasicFunction.SaveSettings(guild);
                BasicFunction.SendRightChannel(message, options, 'confirm', 'The validation system has been desactivated. You can\'t no more validate and refuse file(s).');
                call();
            }
        ])
        return;
    }
    else if (param_s != '-1') {
        BasicFunction.SendRightChannel(message, options, 'error', 'Wrong value for the `validation` argument.');
        return;
    }

    param_s = BasicFunction.GetMessageParameter(options, 'refuse');

    if (param_s == 'true') {
        Import.GuildParameters.get(guild).IsThereARefuse = true;
        BasicFunction.SaveSettings(guild);
        BasicFunction.SendRightChannel(message, options, 'confirm', 'The refuse system has been activated. You can now refuse file(s).');
        return;
    }
    else if (param_s == 'false') {
        Import.GuildParameters.get(guild).IsThereARefuse = false;
        BasicFunction.SaveSettings(guild);
        BasicFunction.SendRightChannel(message, options, 'confirm', 'The refuse system has been desactivated. You can\'t no more refuse file(s).');
        return;
    }
    else if (param_s != '-1') {
        BasicFunction.SendRightChannel(message, options, 'error', 'Wrong value for the `refuse` argument.');
        return;
    }

    BasicFunction.SendRightChannel(message, options, 'error', 'Missing an argument to execute this command.');
}

/**
 * 
 * @param {Discord.Message} message 
 * @param {string[]} options
 */
function SetUrl(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('SetUrl');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    if (message.embeds[0] == undefined)
    {
        BasicFunction.SendRightChannel(message, options, 'error', 'URL is missing !');
        return;
    }

    const url = message.embeds[0].url;
    let link = url.split('/')[5];
    link = link.split('?')[0];

    Import.GuildParameters.get(guild).url = link;

    BasicFunction.SaveSettings(guild);

    async.series([
        function (cb) {
            let creatParam = {
                auth: Import.auth,
                requestBody: {
                    'parents': [link],
                    'name': 'valide',
                    'mimeType': 'application/vnd.google-apps.folder'
                }
            }
            Import.drive.files.create(creatParam, function (err, res) { cb(null, 'one'); });
        },
        function (cb) {
            let creatParam = {
                auth: Import.auth,
                requestBody: {
                    'parents': [link],
                    'name': 'wait',
                    'mimeType': 'application/vnd.google-apps.folder'
                }
            }
            Import.drive.files.create(creatParam, function (err, res) { cb(null, 'one'); });
        },
        function (cb) { BasicFunction.SendRightChannel(message, options, 'confirm', 'Your drive has been succesfully initialized.'); }
    ]);
}

/**
 * 
 * @param {Discord.Message} message 
 * @param {string[]} options
 */
function HandleTheSettings(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('HandleTheSettings');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    let param = BasicFunction.GetMessageParameter(options, 'view');

    if(param != '-1')
    {
        switch(param)
        {
            case '': {
                BasicFunction.SendRightChannel(message, options, 'error', 'Missing value for the `view` argument !');
                break;
            }
            case 'run': {
                const data = JSON.stringify(Import.GuildParameters.get(guild), null, 4);
                fs.writeFileSync('run_' + guild + '.jsonset', data, { encoding: 'utf-8' });
                BasicFunction.SendRightChannel(message, options, 'confirm', 'The settings on the RAM will be soon send.', (msg) => { fs.unlinkSync('run_' + guild + '.jsonset'); }, null, 'run_' + guild + '.jsonset');
                break;
            }
            case 'saved': {
                if (fs.existsSync(guild + '.jsonset')) {
                    BasicFunction.SendRightChannel(message, options, 'confirm', 'The settings on the disk will be soon send.', null, null, guild + '.jsonset');
                }
                else
                    BasicFunction.SendRightChannel(message, options, 'error', 'Actually no settings are saved into the disk.');
                break;
            }
            default: {
                BasicFunction.SendRightChannel(message, options, 'error', 'Unknown value for the `view` argument !');
            }
        }
    }

    param = BasicFunction.GetMessageParameter(options, 'save');

    if(param != '-1')
    {
        BasicFunction.SaveSettings(guild);
        BasicFunction.SendRightChannel(message, options, 'confirm', 'The settings have been successfully saved.');
    }

    param = BasicFunction.GetMessageParameter(options, 'load');

    if (param != '-1') {
        BasicFunction.LoadSettings(guild);
        BasicFunction.SendRightChannel(message, options, 'confirm', 'The settings have been successfully loaded.');
    }
}

/**
 * 
 * @param {Discord.Message} message 
 * @param {string[]} options
 */
function ChangePrefix(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('ChangePrefix');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));
    
    if(options.length < 2)
    {
        BasicFunction.SendRightChannel(message, options, 'error', 'The new prefix is missing');
        return;
    }
    Import.GuildParameters.get(guild).prefix = options[1];
    BasicFunction.SendRightChannel(message, options, 'confirm', 'Your prefix has been succesfully changed into : `' + options[1] + '`.');
    BasicFunction.SaveSettings(guild);
}

/*________________________________________*/

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options 
 */
function CallSettings(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('CallSettings');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    const index = options.findIndex((value, i, obj) => { return value.startsWith('push'); })
    if (index >= 0)
        options.splice(index);

    if (!message.member.hasPermission('ADMINISTRATOR')) {
        BasicFunction.SendRightChannel(message, options, 'error', 'You have to be an administrator to execute this command.');
        return;
    }

    switch (options[0]) {
        case 'cs':
        case 'create_settings': {
            CreateASetting(message, options);
            break;
        }

        case 'ms':
        case 'modify_settings': {
            ModifyASetting(message, options);
            break;
        }

        case 'url': {
            SetUrl(message, options);
            break;
        }

        case 'hs':
        case 'handle_settings': {
            HandleTheSettings(message, options);
            break;
        }

        case 'prefix': {
            ChangePrefix(message, options);
            break;
        }

        default: {
            BasicFunction.SendRightChannel(message, options, 'error', 'Unknown command !');
        }
    }
}

module.exports = {
    name : 'settings',

    commandList : settingsCommand,
    command : CallSettings
}