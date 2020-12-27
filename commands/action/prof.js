/*
 * "commands/action/prof.js"
 * Created by Math's
 */

//Necessary modules
const https = require('https');
const fs = require('fs');
const async = require('async');
const Discord = require('discord.js');

//Global variables
var Import = require('../module_import');

//Collections of functions
const BasicFunction = require('./basic.js');

//Commands
const profCommand = ['send', 'search_unvalidate', 'validate', 'refuse', 'get_unvalidate', 'update', 'delete', 'sd', 'su', 'v', 'r', 'gu', 'up', 'del'];

/*________________________________________*/

/**
 * 
 * @param {Discord.MessageAttachment} attachement
 * @param {string[]} param 
 * @param {string[]} options 
 * @param {number} CourseId 
 * @param {Discord.Message} message
 * @param {function(Error, any)} seriesCallback
 * @description Create a new file in guild's 'wait' folder (and then Move it if validation is desactivated)
 */
function AddCourse(attachement, param, CourseId, message, options, seriesCallback) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('AddCourse :');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    let name = attachement.name.split('.')[0];
    let type = attachement.name.split('.')[1];
    let MIMEtype = '';

    type.toLowerCase();
    switch (type)
    {
        case 'csv': {
            MIMEtype = 'text/csv';
            break;
        }
        case 'txt': {
            MIMEtype = 'text/plain';
            break;
        }
        case 'doc': {
            MIMEtype = 'application/msword';
            break;
        }
        case 'docx': {
            MIMEtype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
        }
        case 'pdf': {
            MIMEtype = 'application/pdf';
            break;
        }
        case 'jpg':
        case 'jpeg': {
            MIMEtype = 'image/jpeg';
            break;
        }
        case 'png': {
            MIMEtype = 'image/png';
            break;
        }
        case 'svg': {
            MIMEtype = 'image/svg';
            break;
        }
        case 'bmp': {
            MIMEtype = 'image/bmp';
            break;
        }
        case 'gif': {
            MIMEtype = 'image/gif';
            break;
        }

        case 'aac': {
            MIMEtype = 'audio/aac';
            break;
        }
        default: {
            MIMEtype = 'application/octet-stream';
            break;
        }
    }

    var metaApp = {
        'displayName': name,
        'CourseId': CourseId,
        'subject':param[0],
        'level': param[1],
        'author': param[2],
        'type': param[3],
        'vera': param[4], 
        'verb': param[5], 
        'refuse': param[6],
        'shortcutValide': ''
    }; 
    var fileMetadata = {
        'name': attachement.name,
        'appProperties': metaApp,
        'parents': []
    };

    let WaitLink = '';
    let FileLink = '';
    async.series([
        function (cb) {
            BasicFunction.FindFolderLink('wait', guild, (err, res) => {
                WaitLink = res;
                cb();
            });
        },
        //function (cb) { BasicFunction.FindFolderLink('', guild, cb); },
        function (cb) {
            var file = fs.createWriteStream(attachement.name);
            https.get(attachement.url, function (response) {
                response.pipe(file);
                file.on('finish', function () { file.close(cb); });
            });
        },
        function (cb) {
            fileMetadata.parents = [WaitLink];
            var media = {
                mimeType: MIMEtype,
                body: fs.createReadStream(attachement.name)
            };

            Import.drive.files.create({
                auth: Import.auth,
                requestBody: fileMetadata,
                media: media,
                fields: 'id, appProperties(CourseId, displayName)',
            }, function (err, file) {
                fs.unlinkSync(attachement.name);
                FileLink = file.data.id;
                BasicFunction.SendRightChannel(message, options, 'confirm', 'Your file is in the drive. \n ID : ' + file.data.appProperties.CourseId, (msg) => { cb(); });
            });
        },
        function (cb) {
            if (!(Import.GuildParameters.get(guild).IsThereAValidation)) {
                BasicFunction.MoveFile('wait', FileLink, 'valide/' + metaApp.subject + '/' + metaApp.level, guild, cb);
            }
            else {
                seriesCallback();
            }
        },
        function (cb) { seriesCallback(); cb(); }
    ]);
}//AsyncOKOK

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options 
 */
function SendCourse(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('SendCourse');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    let nextCourseId = 0;
    let level_n = Import.GuildParameters.get(guild).level_name.indexOf(BasicFunction.GetMessageParameter(options, 'level'));
    let subject_n = Import.GuildParameters.get(guild).subject_name.indexOf(BasicFunction.GetMessageParameter(options,'subject'));
    let type = BasicFunction.GetMessageParameter(options,'type');

    if( subject_n == -1) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Missing `subject` argument !');
        return;
    }

    if (level_n == -1) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Missing `level` argument !');
        return;
    }

    if(Import.GuildParameters.get(guild).Idlost.length > 0)
    {
        nextCourseId = Import.GuildParameters.get(guild).Idlost[0];
        Import.GuildParameters.get(guild).Idlost.shift();
    }
    else
    {
        Import.GuildParameters.get(guild).lastId++;
        nextCourseId = Import.GuildParameters.get(guild).lastId;
    }
    BasicFunction.SaveSettings(guild);

    if(type == '-1')
        type = 'course';

    let link = message.attachments.first();
    if (link == undefined)
    {
        BasicFunction.SendRightChannel(message, options, 'error', 'Attachment is missing !');
        return;
    }

    async.series([
        function (cb) { AddCourse(link, [new String(subject_n), new String(level_n), message.author.id, type, '1', '0', 'nr'], nextCourseId, message, options, cb); },
        function (cb) {
            if (Import.GuildParameters.get(guild).IsThereAValidation)
                BasicFunction.SendRightChannel(message, options, 'confirm', 'Your file has been added to the server\'s librairie and wait for a validation :wink:', (msg) => { cb(); });
            else
                BasicFunction.SendRightChannel(message, options, 'confirm', 'Your file has been added to the server\'s librairie :wink:', (msg) => { cb(); });
        }
    ]);
}

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options
 * @description Get all unvalidate course (include refused) for the given subject
 * @argument subject->the selected subject
 */
function SearchUnvalidateCourse(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('SearchUnvalidateCourse');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    let subject_n = Import.GuildParameters.get(guild).subject_name.indexOf(BasicFunction.GetMessageParameter(options, 'subject'));
    let unvalidate = [['Title', 'Value']];

    if(subject_n == -1)
    {
        BasicFunction.SendRightChannel(message, options, 'error', 'Missing `subject` argument !');
        return;
    }

    async.series([
        function (call) {
            BasicFunction.GetAllFileInPosition('wait', guild, 'files(name, appProperties(CourseId, level, subject, type, vera, verb, author, refuse))', subject_n, function (err, res, param, callcall) {
                res.data.files.forEach(function (iterator, i, array) {
                    if (parseInt(iterator.appProperties.subject) == param) {
                        const author = message.guild.members.cache.get(iterator.appProperties.author).user;
                        
                        let contentField = 'ID : ' + iterator.appProperties.CourseId + '\n';
                        contentField += 'Type : ' + iterator.appProperties.type + '\n';
                        contentField += 'Version : ' + iterator.appProperties.vera + '.' + iterator.appProperties.verb + '\n';
                        contentField += 'Author : ';

                        if (author == undefined)
                            contentField += iterator.appProperties.author;
                        else
                            contentField += author.username;

                        if(iterator.appProperties.refuse != 'nr')
                            contentField += '\nREFUSED';
                        
                        unvalidate.push([iterator.name, contentField]);
                    }
                });
                callcall(null, true);
            }, call);
        },
        function (call) {
            unvalidate.shift();
            if(unvalidate.length == 0)
                BasicFunction.SendRightChannel(message, options, 'result', 'Good job guys ! There\'s nothing more to do.', (msg) => { call(); }, unvalidate);
            else
                BasicFunction.SendRightChannel(message, options, 'result', 'Here are the file(s) which wait for a validation (in the wanted subject). It includes refused file(s).', (msg) => { call(); }, unvalidate);
        }
    ]);
}

/**
 * 
 * @param {Discord.Message} message 
 * @param {string[]} options
 */
function GetUnvalidate(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('GetUnvalidate');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    let CourseId = parseInt(BasicFunction.GetMessageParameter(options, 'id'));

    if (!(Import.GuildParameters.get(guild).IsThereAValidation)) {
        BasicFunction.SendRightChannel(message, options, 'error', 'The validation system isn\'t activated. you can\'t execute this command.');
        return;
    }

    if (CourseId < 0) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Missing `ID` argument !');
        return;
    }

    if (!BasicFunction.DoesIdExist(CourseId, guild)) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Wrong ID !');
        return;
    }

    async.series([
        function (cb) { BasicFunction.GetFileLinkById(CourseId, guild, 'wait', cb); }
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
                    fields: 'name, webContentLink'
                }, function (err, res) {
                    name = res.data.name;
                    link = res.data.webContentLink;
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
                } , [], name);
            }
        ]);
    });
}

/*________________________________________*/

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options 
 * @description Delete old file in guild's 'valide' folder(if file exists), and move new file into guild's 'valide' folder
 */
function ValidateCourse(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('ValidateCourse');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    let CourseId = parseInt(BasicFunction.GetMessageParameter(options, 'id'));

    if (!(Import.GuildParameters.get(guild).IsThereAValidation)) {
        BasicFunction.SendRightChannel(message, options, 'error', 'The validation system isn\'t activated. you can\'t execute this command.');
        return;
    }

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
        function (cb) { BasicFunction.GetFileLinkById(CourseId, guild, 'wait', cb);}
    ], function (err, result) {
        if (result[0] == '') {
            BasicFunction.SendRightChannel(message, options, 'error', 'This course has already been validated.');
            return;
        }

        async.series([
            function (cb) { BasicFunction.GetInfoProperty(result[0], ['subject', 'author', 'refuse', 'level'], cb); }
        ], function (err, resultBis) {
            var roleCondition = BasicFunction.GetRole(message.member.roles, Import.GuildParameters.get(guild).role_subject[parseInt(resultBis[0][0])]);

            if (!roleCondition || message.author.id == resultBis[0][1]) {
                BasicFunction.SendRightChannel(message, options, 'error', 'You are not allowed to do that.');
                return;
            }

            if (resultBis[0][2] == 'r') {
                BasicFunction.SendRightChannel(message, options, 'error', 'This course has already been refused.');
                return;
            }

            var position = 'valide/' + resultBis[0][0] + '/' + resultBis[0][3];

            async.series([
                function (cb) { BasicFunction.GetFileLinkById(CourseId, guild, position, cb); },
                function (cb) { BasicFunction.MoveFile('wait',result[0], position, guild, cb); }
            ], function (err, resultTierce) {
                BasicFunction.DeleteFile(resultTierce[0], [options[0], 'It\'s the old version of your file. With the validation of the new one, the old one has been deleted.'], function (err, res) {
                    BasicFunction.SendRightChannel(message, options, 'confirm', 'The file has been successfully validated.');
                    
                    let fakeMessage = {
                        author: Import.client.users.cache.get(resultBis[0][1])
                    };
                    if(fakeMessage.author != undefined){
                        if(Import.UserParameters.get(resultBis[0][1]) == undefined) {
                            Import.UserParameters.set(resultBis[0][1], new Import.UserVariable());
                            BasicFunction.SendRightChannel(fakeMessage, [options[0]], 'info', 'Your file (ID = ' + CourseId.toString() + ') has been validated by ' + message.author.username + '\nIf you want to disable this information messages send `info -disable` to the bot in DM', (msg) => {}, [], '', false);
                        }
                        else if(Import.UserParameters.get(resultBis[0][1]).WantDM)
                            BasicFunction.SendRightChannel(fakeMessage, [options[0]], 'info', 'Your file (ID = ' + CourseId.toString() + ') has been validated by ' + message.author.username, (msg) => {}, [], '', false);
                    }
                });
            });
        });
    });
}

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options 
 */
function RefuseCourse(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('RefuseCourse');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    let CourseId = parseInt(BasicFunction.GetMessageParameter(options, 'id'));
    let scope = BasicFunction.GetMessageParameter(options, 'scope');

    if (scope == '' || scope == '-1' || scope == undefined)
        scope = 'wait';

    var valide = (scope != 'wait');

    if (!(Import.GuildParameters.get(guild).IsThereAValidation)) {
        BasicFunction.SendRightChannel(message, options, 'error', 'The validation system isn\'t activated. you can\'t execute this command.');
        return;
    }

    if (!(Import.GuildParameters.get(guild).IsThereARefuse)) {
        BasicFunction.SendRightChannel(message, options, 'error', 'The refuse system isn\'t activated. you can\'t execute this command.');
        return;
    }

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
        function (cb) { BasicFunction.GetFileLinkById(CourseId, guild, scope, cb); },
        function (cb) { if (valide) BasicFunction.GetFileLinkById(CourseId, guild, 'wait', cb); else cb();}
    ], function (err, result) {
        if (result[0] == '') {
            BasicFunction.SendRightChannel(message, options, 'error', 'The scope isn\'t correct.');
            return;
        }

        if (valide && result[1] != '')
            valide = true;
        else
            valide = false;

        async.series([
            function (cb) { BasicFunction.GetInfoProperty(result[0], ['subject', 'level', 'author'], cb); }
        ], function (err, resultBis) {
            var roleCondition = BasicFunction.GetRole(message.member.roles, Import.GuildParameters.get(guild).role_subject[parseInt(resultBis[0][0])]);
            if(!roleCondition) {
                BasicFunction.SendRightChannel(message, options, 'error', 'You are not allowed to do that');
                return;
            }

            var position = 'valide/' + resultBis[0][0] + '/' + resultBis[0][1];
            async.series([
                function (cb) { BasicFunction.SetInfoProperty(result[0], 'refuse', 'r', cb); },
                function (cb) {
                    if (valide)
                        BasicFunction.DeleteFile(result[0], [options[0], 'It\'s just the old version of your file. It has been refused'], cb);
                    else
                    {
                        BasicFunction.MoveFile(position, result[0], 'wait', guild, cb);
                    }
                    BasicFunction.SendRightChannel(message, options, 'confirm', 'The file has been successfully refused.', (msg) => { cb(); });
                },
                function (cb) {
                    let fakeMessage = {
                        author: Import.client.users.cache.get(resultBis[0][2])
                    };
                    if(fakeMessage.author != undefined && message.author.id != resultBis[0][2]){
                        if(Import.UserParameters.get(resultBis[0][2]) == undefined) {
                            Import.UserParameters.set(resultBis[0][2], new Import.UserVariable());
                            BasicFunction.SendRightChannel(fakeMessage, [options[0]], 'info', 'Your file (ID = ' + CourseId.toString() + ') has been refused by ' + message.author.username + '\nIf you want to disable this information messages send `info -disable` to the bot in DM', (msg) => {}, [], '', false);
                        }
                        else if(Import.UserParameters.get(resultBis[0][2]).WantDM)
                            BasicFunction.SendRightChannel(fakeMessage, [options[0]], 'info', 'Your file (ID = ' + CourseId.toString() + ') has been refused by ' + message.author.username, (msg) => {}, [], '', false);
                    }
                }
            ]);
        })
    });
}

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options 
 */
function UpdateCourse(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('UpdateCourse');
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

    let url = message.attachments.first();
    if (url == undefined) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Attachment is missing !');
        return;
    }

    async.series([
        function (cb) { BasicFunction.GetFileLinkById(CourseId, guild, 'wait', cb); }
    ], function (err, resultat) {
        var FileLink = resultat[0];
        var wait = (FileLink != '');
        var FileLinkValide = '';

        async.series([
            function (call) {
                async.series([
                    function (cb) { BasicFunction.GetFileLinkById(CourseId, guild, 'valide', cb); }
                ], function (err, resultatBis) {
                    FileLinkValide = resultatBis[0];
                    if (wait) {
                        call(null, 'nothing');
                        return;
                    }

                    FileLink = resultatBis[0];
                    call(null, 'nothing');
                })
            },
            function (call) { BasicFunction.GetInfoProperty(FileLink, ['vera', 'verb', 'author', 'subject', 'level', 'type'], call) }
        ], function (err, resultatBis) {
            var version = [resultatBis[1][0], resultatBis[1][1]];

            if (wait) {
                version[1]++;
            }
            else {
                version[0]++;
                version[1] = 0;
            }

            if (resultatBis[1][2] != message.author.id) {
                BasicFunction.SendRightChannel(message, options, 'error', 'You are not the course\'s author');
                return;
            }

            var ParamInfo = [resultatBis[1][3], resultatBis[1][4], resultatBis[1][2], resultatBis[1][5], version[0], version[1], 'nr'];

            async.series([
                function (cb) {
                    if (wait)
                        BasicFunction.DeleteFile(FileLink, [options[0], 'It\'s just an old version of your file. The new one is in the drive instead of this one.'], cb);
                    else
                        cb();
                },
                function (cb) {
                    if (!(Import.GuildParameters.get(guild).IsThereAValidation)) {
                        BasicFunction.DeleteFile(FileLinkValide, [options[0], 'It\'s just an old version of your file. The new one is in the drive instead of this one.'], cb);
                    }
                    else
                        cb();
                },
                function (cb) {
                    AddCourse(message.attachments.first(1)[0], ParamInfo, CourseId, message, options, cb);
                },
                function (cb) {
                    if (Import.GuildParameters.get(guild).IsThereAValidation)
                        BasicFunction.SendRightChannel(message, options, 'confirm', 'Your file has been successfully updated and wait for a validation :wink: ', (msg) => { cb(); });
                    else
                        BasicFunction.SendRightChannel(message, options, 'confirm', 'Your file has been successfully updated :wink: ', (msg) => { cb(); });
                } 
            ]);
        });
    });
}

/**
 * 
 * @param {Discord.Message} message 
 * @param {string[]} options 
 */
function DeleteCourse(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('DeleteCourse');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    var CourseId = parseInt(BasicFunction.GetMessageParameter(options, 'id'));
    var scope = BasicFunction.GetMessageParameter(options, 'scope');

    if (scope == '' || scope == undefined || scope == '-1')
        scope = 'valide';

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
        function (cb) { BasicFunction.GetFileLinkById(CourseId, guild, scope, cb); }
    ], function (err, result) {
        if (result[0] == '') {
            BasicFunction.SendRightChannel(message, options, 'error', 'The scope isn\'t correct.');
            return;
        }

        async.series([
            function (cb) { BasicFunction.GetInfoProperty(result[0], ['author'], cb); }
        ], function (err, resultBis) {
            if (resultBis[0][0] != message.author.id) {
                BasicFunction.SendRightChannel(message, options, 'error', 'You are not the course\'s author');
                return;
            }

            BasicFunction.DeleteFile(result[0], [options[0], 'You ask for this deletion.'], function (err, result) {
                Import.GuildParameters.get(guild).Idlost.push(CourseId);
                    BasicFunction.SendRightChannel(message, options, 'confirm', 'The file has been successfully deleted.');
            });
        });
    });
}
    
/*________________________________________*/

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options
 */
function CallProf(message, options) {
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('CallProf');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    var subject_n = -1;

    for (const iterator of message.member.roles.cache) 
    {
        subject_n = Import.GuildParameters.get(message.guild.id).role_subject.indexOf(iterator[1].id);
        if(subject_n != -1)
            break;
    }

    if(subject_n == -1)
    {
        BasicFunction.SendRightChannel(message, options, 'error', 'You are not a teacher, you cant execute this command !');
        return;
    }

    switch(options[0])
    {
        case 'sd':
        case 'send':{
            SendCourse(message, options);
            break;
        }
        case 'su':
        case 'search_unvalidate':{
            SearchUnvalidateCourse(message, options);
            break;
        }
        case 'gu':
        case 'get_unvalidate': {
            GetUnvalidate(message, options);
            break;
        }
        case 'v':
        case 'validate':{
            ValidateCourse(message, options);
            break;
        }
        case 'r':
        case 'refuse': {
            RefuseCourse(message, options);
            break;
        }
        case 'up':
        case 'update': {
            UpdateCourse(message, options);
            break;
        }
        case 'del':
        case 'delete': {
            DeleteCourse(message, options);
            break;
        }
        default: {
            BasicFunction.SendRightChannel(message, options, 'error', 'Unknown command !');
        }
    }
}

module.exports = {
    name : 'prof',

    commandList : profCommand,
    command : CallProf
}