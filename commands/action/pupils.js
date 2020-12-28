/*
 * "commands/action/pupils.js"
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
const pupilsCommand = ['search', 'get', 's', 'g'];

/*________________________________________*/

/**
 * 
 * @param {Discord.Message} message 
 * @param {string[]} options
 */
function GetACourse(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('GetACourse');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    let CourseId = parseInt(BasicFunction.GetMessageParameter(options, 'id'));

    if(CourseId < 0)
    {
        BasicFunction.SendRightChannel(message, options, 'error', 'Missing `ID` argument !');
        return;
    }

    if(!BasicFunction.DoesIdExist(CourseId, guild))
    {
        BasicFunction.SendRightChannel(message, options, 'error', 'Wrong ID !');
        return;
    }

    async.series([
        function (cb) { BasicFunction.GetFileLinkById(CourseId, guild, 'valide', cb); }
    ], function (err, result) {
        if (result[0] == '') {
            BasicFunction.SendRightChannel(message, options, 'error', 'Wrong ID !');
            return;
        }

        var name = '';
        async.series([
            function (call) {
                Import.drive.files.get({
                    auth: Import.auth,
                    fileId: result[0],
                    fields: 'name'
                }, function (err, res) {
                    name = res.data.name;
                    call();
                });
            },
            function (call) {
                Import.drive.files.get({
                    auth: Import.auth,
                    fileId: result[0],
                    alt: 'media'
                }, {
                    responseType: 'arraybuffer'
                }, function (err, res) {
                    fs.writeFileSync(name, new Uint8Array(res.data));
                    call();
                });              
            },
            function (call) {
                BasicFunction.SendRightChannel(message, options, 'result', 'Here is your file (ID = ' + CourseId + ').', (msg) => {
                    fs.unlink(name, function(err){
                        call();
                    });
                }, [], name);
            }
        ]);
    });
}

/**
 * 
 * @param {Discord.Message} message 
 * @param {string[]} options
 * @param {number} subject_n
 */
function SearchInBiblio(message, options, subject_np) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('SearchInBiblio');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    let subject_n = Import.GuildParameters.get(guild).subject_name.indexOf(BasicFunction.GetMessageParameter(options, 'subject'));
    let level_n = Import.GuildParameters.get(guild).level_name.indexOf(BasicFunction.GetMessageParameter(options, 'level'));
    let type = BasicFunction.GetMessageParameter(options, 'type');

    if(level_n == -1)
    {
        for (const iterator of message.member.roles.cache) 
        {
            level_n = Import.GuildParameters.get(guild).role_level.indexOf(iterator[0]);
            if(level_n != -1)
                break;
        }

        if (level_n == -1) {
            BasicFunction.SendRightChannel(message, options, 'error', 'Missing `level` argument (you don\'t get any level role) !');
            return;
        }
    }

    if (subject_n == -1) {
        if (subject_np == -1) {
            BasicFunction.SendRightChannel(message, options, 'error', 'Missing `subject` argument (you are in a global channel) !');
            return;
        }
        else
            subject_n = subject_np;
    }
    else if (Import.GuildParameters.get(guild).channel_subject[subject_n].indexOf(message.channel.id) == -1 && Import.GuildParameters.get(guild).channel_prof.indexOf(message.channel.id) == -1) {
        SendRightChannel(message, options, 'error', 'You are not allowed to search for this subject in this channel.');
        return;
    }

    options[0] += ' files->' + Import.GuildParameters.get(guild).subject_name[subject_n] + '->' + Import.GuildParameters.get(guild).level_name[level_n];
    if (type != '-1')
        options[0] += '->' + type;

    var searchParam = {
        'level': level_n,
        'type': type,
        'subject': subject_n,
        'guild' : guild
    };
    var position = 'valide/' + subject_n + '/' + level_n;
    var result = [['Title', 'Value']];

    async.series([
        function (call) {
            BasicFunction.GetAllFileInPosition(position, guild, 'files(name, appProperties(CourseId, level, subject, type, vera, verb, author))', searchParam, function (err, res, param, callcall) {
                res.data.files.forEach(function (iterator, i, array) {
                    if (parseInt(iterator.appProperties.subject) == param.subject && parseInt(iterator.appProperties.level) == param.level){
                        const author = message.guild.members.cache.get(iterator.appProperties.author).user;
                        
                        let contentField = 'ID : ' + iterator.appProperties.CourseId + '\n';
                        contentField += 'Type : ' + iterator.appProperties.type + '\n';
                        contentField += 'Version : ' + iterator.appProperties.vera + '.' + iterator.appProperties.verb + '\n';
                        contentField += 'Author : ';

                        if (author == undefined)
                            contentField += iterator.appProperties.author;
                        else
                            contentField += author.username;
                        result.push([iterator.name, contentField]);
                    }
                });
                callcall(null, true);
            }, call);
        },
        function (call) {
            result.shift();
            if (result.length == 0)
                BasicFunction.SendRightChannel(message, options, 'result', 'Unbelievable ! There\'s nothing... ', (msg) => { call(); }, result);
            else
                BasicFunction.SendRightChannel(message, options, 'result', 'Here are your search results.', (msg) => { call(); }, result);
        }
    ]);
}

/*________________________________________*/

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options 
 * @param {number} subject_n
 */
function CallPupils(message, options, subject_n) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('CallPupils');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    switch (options[0]) {
        case 'g' :
        case 'get': {
            GetACourse(message, options);
            break;
        }

        case 's':
        case 'search': {
            SearchInBiblio(message, options, subject_n);
            break;
        }

        default: {
            BasicFunction.SendRightChannel(message, options, 'error', 'Unknown command !');
        }
    }
}

module.exports = {
    name : 'pupils',

    commandList : pupilsCommand,
    command : CallPupils
}