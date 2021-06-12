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

    if(subject_n == -1) {
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
 * @APICall 3->8
 * @todo Should we save the author as user in memory (user settings)
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
    let filesAccess = null;
    let paramInfos = [];

    async.series([
        //Find files access (un-validate)
        function (cb) { 
            BasicFunction.GetFileLinkById(CourseId, guild, (err, res) => {
                filesAccess = res;
                cb(null, null);
            });
        },
        //Get necessary information about unvalidate file
        function (cb) {
            //"Dynamic" ID verification
            if (filesAccess.unvalidate == null) {
                BasicFunction.SendRightChannel(message, options, 'error', 'This course has already been validated.');
                cb('wrong_id', null);
                return;
            }

            BasicFunction.GetInfoProperty(filesAccess.unvalidate.link, ['subject', 'author', 'level'], (err, res) => {
                paramInfos = res;
                cb(null, null);
            }); 
        },
        //Check some conditions and move concretely the validated file
        function (cb) {
            //Check permissions
            const roleCondition = BasicFunction.GetRole(message.member.roles, Import.GuildParameters.get(guild).role_subject[parseInt(paramInfos[0])]);
            if (!roleCondition || message.author.id == paramInfos[1]) {
                BasicFunction.SendRightChannel(message, options, 'error', 'You are not allowed to do that.');
                cb('not_allowed', null);
                return;
            }
            if (filesAccess.unvalidate.permission == 'r') {
                BasicFunction.SendRightChannel(message, options, 'error', 'This course has already been refused.');
                cb('wrong_perm', null);
                return;
            }

            BasicFunction.SetInfoProperty(filesAccess.unvalidate.link, 'permission', 'v', cb);
        },
        //Check if an older version of the file already exist in the valide folder and delete it
        function (cb) {
            if(filesAccess.validate != null)
                BasicFunction.DeleteFile(filesAccess.validate.link, [options[0], 'It\'s the old version of your file. With the validation of the new one, the old one has been deleted.'], cb);
            else
                cb(null, null);
        },
        //Send a message to the validator and the author (if DM are enabled)
        function (cb) {
            BasicFunction.SendRightChannel(message, options, 'confirm', 'The file has been successfully validated.');
                    
            let fakeMessage = {
                author: Import.client.users.cache.get(paramInfos[1])
            };
            if(fakeMessage.author != undefined){
                if(Import.UserParameters.get(paramInfos[1]) == undefined) {
                    Import.UserParameters.set(paramInfos[1], new Import.UserVariable()); //Useless no ? It isn't saved and it just use more memory for nothing. We could save it but it's just store user information without giving a service.
                    BasicFunction.SendRightChannel(fakeMessage, [options[0]], 'info', 'Your file (ID = ' + CourseId.toString() + ') has been validated by ' + message.author.username + '\nIf you want to disable this information messages send `info -disable` to the bot in DM', (msg) => {}, [], '', false);
                }
                else if(Import.UserParameters.get(paramInfos[1]).WantDM)
                    BasicFunction.SendRightChannel(fakeMessage, [options[0]], 'info', 'Your file (ID = ' + CourseId.toString() + ') has been validated by ' + message.author.username, (msg) => {}, [], '', false);
            }

            cb(null, null);
        }
    ], function (err, result) {});
}

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options
 * @APICall 3->8 (gen 3)
 */
function RefuseCourse(message, options) {
    //Guild's log
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('RefuseCourse');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    //Check the validation and refuse system
    if (!(Import.GuildParameters.get(guild).IsThereAValidation)) {
        BasicFunction.SendRightChannel(message, options, 'error', 'The validation system isn\'t activated. you can\'t execute this command.');
        return;
    }
    if (!(Import.GuildParameters.get(guild).IsThereARefuse)) {
        BasicFunction.SendRightChannel(message, options, 'error', 'The refuse system isn\'t activated. you can\'t execute this command.');
        return;
    }

    //Find, check and complete message's arguments
    let CourseId = parseInt(BasicFunction.GetMessageParameter(options, 'id'));
    let scope = BasicFunction.GetMessageParameter(options, 'scope');
    if (scope == '' || scope == '-1' || scope == undefined)
        scope = 'wait';
    
    if(CourseId < 0) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Missing `ID` argument !');
        return;
    }
    if(!BasicFunction.DoesIdExist(CourseId, guild)) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Wrong ID !');
        return;
    }

    //Results
    let valide = scope.startsWith('valide');
    let filesAccess = null;
    let paramInfos = [];
    let desired = null;

    async.series([
        //Find files access (un-validate)
        function (cb) { 
            BasicFunction.GetFileLinkById(CourseId, guild, (err, res) => {
                filesAccess = res;
                cb(null, null);
            });
        },
        //Get necessary information about file
        function (cb) {
            //"Dynamic" ID and scope verification
            desired = filesAccess[(valide) ? "validate" : "unvalidate"];
            if (desired == null) {
                BasicFunction.SendRightChannel(message, options, 'error', 'The scope or the ID isn\'t correct.');
                cb('wrong_scope', null);
                return;
            }

            BasicFunction.GetInfoProperty(desired.link, ['subject', 'level', 'author'], (err, res) => {
                paramInfos = res;
                cb(null, null);
            }); 
        },
        //Check some conditions and move concretely the validated file
        function (cb) {
            //Check permissions
            var roleCondition = BasicFunction.GetRole(message.member.roles, Import.GuildParameters.get(guild).role_subject[parseInt(paramInfos[0])]);
            if(!roleCondition) {
                BasicFunction.SendRightChannel(message, options, 'error', 'You are not allowed to do that');
                cb('not_allowed', null);
                return;
            }
            if(desired.permission == 'r') {
                BasicFunction.SendRightChannel(message, options, 'error', 'This file has been already refused.');
                cb('wrong_perm', null);
                return;
            }

            BasicFunction.SetInfoProperty(desired.link, 'permission', 'r', cb);
        },
        //If it's necessary to delete a file which is waiting
        function (cb) {
            if (valide && filesAccess.unvalidate != null)
                BasicFunction.DeleteFile(desired.link, [options[0], 'It\'s just the old version of your file. It has been refused'], cb);
            else
                cb(null, null);
        },
        //Send a message to the refusor and the author (if DM are enabled)
        function (cb) {
            BasicFunction.SendRightChannel(message, options, 'confirm', 'The file has been successfully refused.', (msg) => {});

            let fakeMessage = {
                author: Import.client.users.cache.get(paramInfos[2])
            };
            if(fakeMessage.author != undefined && message.author.id != paramInfos[2]){
                if(Import.UserParameters.get(paramInfos[2]) == undefined) {
                    Import.UserParameters.set(paramInfos[2], new Import.UserVariable()); //Useless no ? It isn't saved and it just use more memory for nothing. We could save it but it's just store user information without giving a service.
                    BasicFunction.SendRightChannel(fakeMessage, [options[0]], 'info', 'Your file (ID = ' + CourseId.toString() + ') has been refused by ' + message.author.username + '\nIf you want to disable this information messages send `info -disable` to the bot in DM', (msg) => {}, [], '', false);
                }
                else if(Import.UserParameters.get(paramInfos).WantDM)
                    BasicFunction.SendRightChannel(fakeMessage, [options[0]], 'info', 'Your file (ID = ' + CourseId.toString() + ') has been refused by ' + message.author.username, (msg) => {}, [], '', false);
            }
        }
    ], function (err, result) {});
}

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options 
 * @APICall 3->13 (gen 8)
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
    ], function(err, result) {});
}

/**
 * 
 * @param {Discord.Message} message 
 * @param {string[]} options
 * @APICall 7
 */
function DeleteCourse(message, options) {
    //Guild's log
    const guild = message.guild.id;
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('DeleteCourse');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    //Find, check and complete message's arguments
    var CourseId = parseInt(BasicFunction.GetMessageParameter(options, 'id'));
    var scope = BasicFunction.GetMessageParameter(options, 'scope');
    if (scope == '' || scope == undefined || scope == '-1')
        scope = 'valide';

    if(CourseId < 0) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Missing `ID` argument !');
        return;
    }
    if(!BasicFunction.DoesIdExist(CourseId, guild)) {
        BasicFunction.SendRightChannel(message, options, 'error', 'Wrong ID !');
        return;
    }

    //Results
    let valide = scope.startsWith('valide');
    let filesAccess = null;
    let paramInfos = [];
    let desired = null;
    async.series([
        //Find files access (un-validate)
        function (cb) {
            BasicFunction.GetFileLinkById(CourseId, guild, (err, res) => {
                filesAccess = res;
                cb(null, null);
            });
        },
        //Get necessary information about file
        function (cb) {
            console.log(filesAccess);
            //"Dynamic" ID and scope verification
            desired = filesAccess[(valide) ? "validate" : "unvalidate"];
            if (desired == null) {
                BasicFunction.SendRightChannel(message, options, 'error', 'The scope or the ID isn\'t correct.');
                cb('wrong_scope', null);
                return;
            }

            BasicFunction.GetInfoProperty(desired.link, ['author'], (err, res) => {
                paramInfos = res;
                cb(null, null);
            }); 
        },
        //Check message's author and concretely delete file
        function (cb) {
            if (paramInfos[0] != message.author.id) {
                BasicFunction.SendRightChannel(message, options, 'error', 'You are not the course\'s author');
                cb('not_allowed', null);
                return;
            }

            BasicFunction.DeleteFile(desired.link, [options[0], 'You ask for this deletion.'], (err, result) => {
                Import.GuildParameters.get(guild).Idlost.push(CourseId); //Add ID to Lost ID array
                BasicFunction.SendRightChannel(message, options, 'confirm', 'The file has been successfully deleted.');//Confirmation
            });
        }
    ], function (err, result) {});
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