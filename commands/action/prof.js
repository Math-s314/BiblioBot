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
 * @param {string[]} param ['subject', 'level', 'author', 'type', 'vera', 'verb']
 * @param {string[]} options 
 * @param {number} CourseId 
 * @param {Discord.Message} message
 * @param {function(Error, any)} seriesCallback
 * @description Create a new file in guild's 'wait' folder (and then Move it if validation is desactivated)
 * @APICall 1
 */
function AddCourse(attachement, param, CourseId, message, options, seriesCallback) {
    //Guild's log
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('AddCourse :');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    //MIME Type analyse
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

    //Prepare metatdata specific for Biblio application
    var metaApp = {
        'displayName': name,
        'CourseId': CourseId,
        'subject':param[0],
        'level': param[1],
        'author': param[2],
        'type': param[3],
        'vera': param[4], 
        'verb': param[5], 
        'permission': (Import.GuildParameters.get(guild).IsThereAValidation) ? 'nr' : 'v'
    }; 

    //Prepare genenral metadata
    var fileMetadata = {
        'name': attachement.name,
        'appProperties': metaApp,
        'parents': [Import.GuildParameters.get(guild).url]
    };

    async.series([
        //Download file from Discord
        function (cb) {
            var file = fs.createWriteStream(attachement.name);
            https.get(attachement.url, function (response) {
                response.pipe(file);
                file.on('finish', function () { file.close(cb); });
            });
        },
        //Create file on the drive
        function (cb) {
            var media = {
                mimeType: MIMEtype,
                body: fs.createReadStream(attachement.name)
            };

            console.log(fileMetadata);

            Import.drive.files.create({
                auth: Import.auth,
                requestBody: fileMetadata,
                media: media,
                fields: 'id, appProperties(CourseId, displayName)',
            }, function (err, file) {
                fs.unlinkSync(attachement.name);
                BasicFunction.SendRightChannel(message, options, 'confirm', 'Your file is in the drive. \n ID : ' + file.data.appProperties.CourseId, (msg) => { cb(); });
            });
        }
    ], function (err, result) { seriesCallback(); });
}

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options 
 * @APICall 1
 */
function SendCourse(message, options) {
    //Guild's log
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('SendCourse');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    //Find and check message's arguments
    let level_n = Import.GuildParameters.get(guild).level_name.indexOf(BasicFunction.GetMessageParameter(options, 'level'));
    let subject_n = Import.GuildParameters.get(guild).subject_name.indexOf(BasicFunction.GetMessageParameter(options,'subject'));
    let type = BasicFunction.GetMessageParameter(options,'type');

    if(type == '-1'){
        type = 'course';
    }

    if( subject_n == -1) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Missing `subject` argument !');
        return;
    }

    if (level_n == -1) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Missing `level` argument !');
        return;
    }

    //Find new ID (and update lost ID)
    let nextCourseId = 0;
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

    //Check message's attachment
    let link = message.attachments.first();
    if (link == undefined) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Attachment is missing !');
        return;
    }

    //Add file to the drive
    async.series([
        //Add file to the drive
        function (cb) { AddCourse(link, [new String(subject_n), new String(level_n), message.author.id, type, '1', '0'], nextCourseId, message, options, cb); },
        //Send notification to mark success
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
 * @APICall 1
 */
function SearchUnvalidateCourse(message, options) {
    //Guild's log
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('SearchUnvalidateCourse');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    //Find and check message's arguments
    let subject_n = Import.GuildParameters.get(guild).subject_name.indexOf(BasicFunction.GetMessageParameter(options, 'subject'));
    let unvalidate = [['Title', 'Value']];

    if(subject_n == -1)
    {
        BasicFunction.SendRightChannel(message, options, 'error', 'Missing `subject` argument !');
        return;
    }

    //Results
    async.series([
        //List obtention
        function (cb) {
            BasicFunction.GetAllFileInPosition('', guild, 'files(name, appProperties(CourseId, level, subject, type, vera, verb, author, permission))', subject_n, function (err, res, param, nextCB) {
                res.data.files.forEach(function (iterator, i, array) {
                    //Check the subject and the permission
                    if (parseInt(iterator.appProperties.subject) == param && iterator.appProperties.permission != 'v') {
                        const member = message.guild.members.cache.get(iterator.appProperties.author);
                        
                        //Basic information
                        let contentField = 'ID : ' + iterator.appProperties.CourseId + '\n';
                        contentField += 'Type : ' + iterator.appProperties.type + '\n';
                        contentField += 'Version : ' + iterator.appProperties.vera + '.' + iterator.appProperties.verb + '\n';
                        contentField += 'Author : ';

                        //Author information management
                        if (member == undefined)
                            contentField += iterator.appProperties.author;
                        else if(member.nickname != null)
                            contentField += member.nickname;
                        else
                            contentField += member.user.username;

                        if(iterator.appProperties.permission == 'r')
                            contentField += '\nREFUSED';
                        
                        //Add result to the list
                        unvalidate.push([iterator.name, contentField]);
                    }
                });
                nextCB(null, true);//Want all pages, doesn't handle errors (so null is sent)
            }, cb);
        },
        //Send message
        function (cb) {
            unvalidate.shift();
            if(unvalidate.length == 0)//No result
                BasicFunction.SendRightChannel(message, options, 'result', 'Good job guys ! There\'s nothing more to do.', (msg) => { cb(); }, unvalidate);
            else
                BasicFunction.SendRightChannel(message, options, 'result', 'Here are the file(s) which wait for a validation (in the wanted subject). It includes refused file(s).', (msg) => { cb(); }, unvalidate);
        }
    ]);
}

/**
 * 
 * @param {Discord.Message} message 
 * @param {string[]} options
 * @APICall 3
 */
function GetUnvalidate(message, options) {
    //Guild's log
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('GetUnvalidate');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    //Check validation system
    if (!(Import.GuildParameters.get(guild).IsThereAValidation)) {
        BasicFunction.SendRightChannel(message, options, 'error', 'The validation system isn\'t activated. you can\'t execute this command.');
        return;
    }

    //Find and check message's arguments
    let CourseId = parseInt(BasicFunction.GetMessageParameter(options, 'id'));
    if (CourseId < 0) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Missing `ID` argument !');
        return;
    }
    if (!BasicFunction.DoesIdExist(CourseId, guild)) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Wrong ID !');
        return;
    }

    //Results
    let filesAccess = null;
    let name = '';

    async.series([
        //Find file's link
        function (cb) { 
            BasicFunction.GetFileLinkById(CourseId, guild, (err, res) => {
                filesAccess = res;
                cb(null, null);
            }); 
        },
        //Get file name (to send a file with the right name to Discord)
        function (cb) {
        //"Dynamic" ID verification
            if (filesAccess.unvalidate == null) {
            BasicFunction.SendRightChannel(message, options, 'error', 'Wrong ID !');
                cb('wrong_id', null);
            return;
        }

                Import.drive.files.get({
                    auth: Import.auth,
                fileId: filesAccess.unvalidate.link,
                    fields: 'name'
                }, function (err, res) {
                    name = res.data.name;
                cb(null, null);
                });
            },
            //Get file's content, and save it on the disk
        function (cb) {
                Import.drive.files.get({
                    auth: Import.auth,
                fileId: filesAccess.unvalidate.link,
                    alt: 'media'
                }, {
                    responseType: 'arraybuffer'
                }, function (err, res) {
                    fs.writeFileSync(name, new Uint8Array(res.data));
                cb(null, null);
                });
            },
            //Send file to Discord and delete local copy
        function (cb) {
                BasicFunction.SendRightChannel(message, options, 'result', 'Here is your file (ID = ' + CourseId + ').', (msg) => { 
                fs.unlink(name, function(err){ cb(null, null); });
                } , [], name);
            }
    ], function(err, result) {});
}

/*________________________________________*/

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options 
 * @description Delete old file in guild's 'valide' folder(if file exists), and move new file into guild's 'valide' folder
 * @APICall 12 max
 */
function ValidateCourse(message, options) {
    //Guild's log
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('ValidateCourse');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    //Check the validation system
    if (!(Import.GuildParameters.get(guild).IsThereAValidation)) {
        BasicFunction.SendRightChannel(message, options, 'error', 'The validation system isn\'t activated. you can\'t execute this command.');
        return;
    }

    //Find and check message's arguments
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

    //Results
    async.series([
        function (cb) { BasicFunction.GetFileLinkById(CourseId, guild, 'wait', cb);}
    ], function (err, result) {
        //"Dynamic" ID verification
        if (result[0] == '') {
            BasicFunction.SendRightChannel(message, options, 'error', 'This course has already been validated.');
            return;
        }

        async.series([
            function (cb) { BasicFunction.GetInfoProperty(result[0], ['subject', 'author', 'permission', 'level'], cb); }
        ], function (err, resultBis) {
            //Check permissions
            const roleCondition = BasicFunction.GetRole(message.member.roles, Import.GuildParameters.get(guild).role_subject[parseInt(resultBis[0][0])]);

            if (!roleCondition || message.author.id == resultBis[0][1]) {
                BasicFunction.SendRightChannel(message, options, 'error', 'You are not allowed to do that.');
                return;
            }
            if (resultBis[0][2] == 'r') {
                BasicFunction.SendRightChannel(message, options, 'error', 'This course has already been refused.');
                return;
            }

            async.series([
                //Check if an older version of the file already exist in the valide folder
                function (cb) { BasicFunction.GetFileLinkById(CourseId, guild, 'valide', cb); },
                //Move concretely the validated file
                function (cb) { BasicFunction.MoveFile('wait',result[0], 'valide', guild, cb); }
            ], function (err, resultTierce) {
                //Delete older file version
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
    
    let valide = scope.startsWith('valide');

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
        let NewVersionInWait = (valide && result[1] != '');

        async.series([
            function (cb) { BasicFunction.GetInfoProperty(result[0], ['subject', 'level', 'author', 'permission'], cb); }
        ], function (err, resultBis) {
            var roleCondition = BasicFunction.GetRole(message.member.roles, Import.GuildParameters.get(guild).role_subject[parseInt(resultBis[0][0])]);
            if(!roleCondition) {
                BasicFunction.SendRightChannel(message, options, 'error', 'You are not allowed to do that');
                return;
            }

            if(resultBis[0][3] == 'r')
            {
                BasicFunction.SendRightChannel(message, options, 'error', 'This file has been already refused.');
                return;
            }

            var position = 'valide/' + resultBis[0][0] + '/' + resultBis[0][1];
            async.series([
                function (cb) { BasicFunction.SetInfoProperty(result[0], 'permission', 'r', cb); },
                function (cb) {
                    if (NewVersionInWait)
                        BasicFunction.DeleteFile(result[0], [options[0], 'It\'s just the old version of your file. It has been refused'], cb);
                    else if(valide)
                        BasicFunction.MoveFile(position, result[0], 'wait', guild, cb);
                    
                    BasicFunction.SendRightChannel(message, options, 'confirm', 'The file has been successfully refused.', (msg) => {});
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
 * @APICall 8+ (max 13)
 */
function UpdateCourse(message, options) {
    //Guild's log
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('UpdateCourse');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    //Find and check message's arguments
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

    //Check message's attachment
    let url = message.attachments.first();
    if (url == undefined) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Attachment is missing !');
        return;
    }

    let filesAccess = null;
    let paramInfos = null;
    let wait = true;

    async.series([
        //Find files (valide and unvalide) link
        function (cb) {
            BasicFunction.GetFileLinkById(CourseId, guild, (err, access) => {
                filesAccess = access;
                wait = (access.unvalidate != null);
                cb(null, null);
            });
        },
        //Get some info property about the existing file 
        function (cb) {
            BasicFunction.GetInfoProperty(filesAccess[(wait) ? 'unvalidate' : 'validate'].link, ['vera', 'verb', 'author', 'subject', 'level', 'type'], (err, info) => {
                paramInfos = info;
                cb(null, null);
            }); 
        },
        //Delete the unvalide file if it exists (just check before the message's author)
        function (cb) {
            if (paramInfos[2] != message.author.id) {
                BasicFunction.SendRightChannel(message, options, 'error', 'You are not the course\'s author');
                cb("You can't bro ;)", null);
                return;
            }

            if (wait)
                BasicFunction.DeleteFile(filesAccess.unvalidate.link, [options[0], 'It\'s just an old version of your file. The new one is in the drive instead of this one.'], cb);
            else
                cb(null, null);
        },
        //Delete the unvalide file if it exists and if the validation system is disabled
        function (cb) {
            if (!(Import.GuildParameters.get(guild).IsThereAValidation) && filesAccess.validate != null)
                BasicFunction.DeleteFile(filesAccess.validate.link, [options[0], 'It\'s just an old version of your file. The new one is in the drive instead of this one.'], cb);
            else
                cb(null, null);
        },
        //Add course to the drive (change version number depending on the wait boolean)
        function (cb) {
            var version = (wait) ? [paramInfos[0], paramInfos[1] + 1] : [paramInfos[0] + 1, '0'];
            var newParamInfos = [paramInfos[3], paramInfos[4], paramInfos[2], paramInfos[5], version[0], version[1]];

            AddCourse(message.attachments.first(1)[0], newParamInfos, CourseId, message, options, cb);
        },
        //Send confirmation to the user
        function (cb) {
            if (Import.GuildParameters.get(guild).IsThereAValidation)
                BasicFunction.SendRightChannel(message, options, 'confirm', 'Your file has been successfully updated and wait for a validation :wink: ', (msg) => { cb(null, null); });
            else
                BasicFunction.SendRightChannel(message, options, 'confirm', 'Your file has been successfully updated :wink: ', (msg) => { cb(null, null); });
        } 
    ]);
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