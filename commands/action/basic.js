/**
 * "commands/action/basic.js"
 * Created by Math's
 * 
 * Becareful, in this code the word 'link' represent the GDrive ID of a file.
 */

//Necessary modules
const async = require('async');
const Discord = require('discord.js');
const fs = require('fs');

//Global variables
var Import = require('../module_import');

/*________________________________________*/

/**
 * 
 * @param {any[][]} liste 
 * @param {any} value 
 * @returns {[number, number]}
 */
function DoubleListContain(liste, value) {
    for(var i = 0; i < liste.length; i++)
    {
        let n = liste[i].indexOf(value);
        if(n != -1)
            return [i, n];
    }

    return [-1, -1];
}

/**
 * 
 * @param {Discord.GuildMemberRoleManager} manager 
 * @param {Discord.Snowflake} roleId
 * @returns {boolean}
 */
function GetRole(manager, roleId) {
    if (manager.cache.
        get(roleId) == undefined)
        return false;

    return true;
}

/**
 * 
 * @param {number} CourseId 
 * @param {Discord.Snowflake} guild Guild ID
 * @returns {boolean}
 */
function DoesIdExist(CourseId, guild) {
    if(CourseId <= Import.GuildParameters.get(guild).lastId && Import.GuildParameters.get(guild).Idlost.indexOf(CourseId) == -1)
        return true;
    else
        return false;
}

/*________________________________________*/

/**
 * @param {Discord.User} author
 * @param {Discord.MessageEmbed} embed
 * @param {Discord.MessageAttachment} attach
 * @description Deprecated, don't use it
 * @deprecated
 */
function SendDM(author, embed = new Discord.MessageEmbed, attach = null)
{
    console.log('\n WARNING ! \n Deprecated');
    console.log(SendDM);
    console.log(arguments);

    author.send(embed, attach);
} 

/**
 * 
 * @param {Discord.Message} message
 * @param {string[]} options
 * @param {string} type Can only be : 'result' or 'confirm' or 'error'
 * @param {string} content
 * @param {function(Discord.Message) => void} callback
 * @param {[string,string] []} additionnalFields Just for the 'result' type. 
 * @param {string} attach Path of the attachment
 * @param {boolean} ValidGuild Indicates if the message stores a valid guild (in case of fake messages)
 */
function SendRightChannel(message, options, type, content, callback = (msg) => {}, additionnalFields = [], attach = null, ValidGuild = true) {
    if (ValidGuild) {
        const guild = message.guild.id;
        Import.GuildLogStream.get(guild).write('\n');
        Import.GuildLogStream.get(guild).write('SendRightChannel');
        Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));
    }

    let embed = {
        color: 0x000000,
        title: '',
        author: {
            name: (ValidGuild) ? message.member.nickname : message.author.username,
            icon_url: message.author.avatarURL()
        },
        description: content,
        fields: [],
        footer: {
            text: options[0],
            icon_url: Import.client.user.avatarURL()
        },
    };

    switch (type) {
        case 'error': {
            embed.color = 0xFF0000;//red
            embed.title = ':x: Error !';
            break;
        }
        case 'confirm': {
            embed.color = 0x00FF00;//green
            embed.title = ':white_check_mark: Command correctly executed';
            break;
        }
        case 'result': {
            embed.color = 0xE332FF;//purple
            embed.title = ':bookmark_tabs: Your result';
            additionnalFields.forEach(function (value, i, array) {
                embed.fields.push({
                    name: value[0],
                    value: value[1],
                    inline: true
                });
            });
            break;
        }
        case 'info': {
            embed.color = 0x4AE5F9;//blue
            embed.title = ':information_source: Information';
            break;
        }
        default: {
            embed.color = 0xA0A0A0;//grey
            embed.title = 'Troubles in the code';
            break;
        }
    }

    if (GetMessageParameter(options, 'push') != '-1') {
        let prof = false;
        for (const iterator of message.member.roles.cache) {
            prof = (Import.GuildParameters.get(message.guild.id).role_subject.indexOf(iterator[0]) != -1);
            if (prof)
                break;
        }
        if (prof) {
            message.channel.send({ embed: embed }).then(function (msg) {
                if (attach != null && attach != '')
                    message.channel.send({
                        files: [{
                            attachment: attach,
                            name: attach
                        }]
                    }).then(callback);
                else
                    callback(msg);
            });
        }
    }
    else {
        message.author.send({ embed: embed }).then(function (msg) {
            if (attach != null && attach != '')
                message.author.send({
                    files: [{
                        attachment: attach,
                        name: attach
                    }]
                }).then(callback);
            else
                callback(msg);
        });
    }
}

/**
 * @param {string[]} options 
 * @param {string} param 
 * @returns {string}
 */
function GetMessageParameter(options, param) {
    for (var i = 1; i < options.length; i++)
    {
        if(options[i].startsWith(param))
        {
            var decomp = options[i].split(':');
            
            if(decomp.length > 1)
                return decomp[1];
            else
                return '';
        }
    }

    return '-1';
}

/*________________________________________*/

/**
 * 
 * @param {string} link 
 * @param {string[]} param
 * @param {function(Error, any)} seriesCallback
 * @APICall 1
 */
function GetInfoProperty(link, param, seriesCallback) {
    if (param == [])
        return;

    //Formate param list to the needed format for drive query
    let getParam = {
        auth: Import.auth,
        fileId: link,
        fields: 'appProperties('
    };

    for (let i = 0; i < param.length; i++) {
        if(i != param.length - 1)
            getParam.fields += param[i] + ',';
        else
            getParam.fields += param[i] + ')';
    }

    //Return the list of all needed param
    Import.drive.files.get(getParam, function (err, res) { 
        let ret = [];
        param.forEach(element => {
            ret.push(res.data.appProperties[element]);
        });
        seriesCallback(err, ret); 
    });
}

/**
 * 
 * @param {string} link 
 * @param {string} param TODO : transform in string[]
 * @param {string} newValue
 */
function SetInfoProperty(link, param, newValue, seriesCallback) {

    if (param == '' || newValue == '' || link == '')
        return;

    let updateMetadata = new Object();
    updateMetadata[param] = newValue;

    let updateParam = {
        auth: Import.auth,
        fileId: link,
        requestBody: {
            'appProperties': updateMetadata
        }
    };

    Import.drive.files.update(updateParam, function (err, res) { seriesCallback(null, null);});
}

/*________________________________________*/

/**
 * 
 * @param {string} originalPosition //TODO: delete this parameter = is useless
 * @param {string} link
 * @param {string} position
 * @param {Discord.Snowflake} guild
 * @param {function(Error, any)} seriesCallback
 * @APICall 2
 */
function MoveFile(originalPosition, link, position, guild, seriesCallback) {
    //Guild's log
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('MoveFile');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    if (link == '')
        return;

    //Basic parameters for the update
    var updateParam = {
        auth: Import.auth,
        fileId: link,
        addParents: '',
        removeParents:'',
        enforceSingleParent: true
    };

    async.series([
        //Find necessary folder
        function (cb) { FindFolderLink(position, guild, cb); }
    ], function (err, result) {
        updateParam.addParents = result[0];

        async.series([
            //Update file properties to change the folder
            function(cb) {                
                Import.drive.files.update(updateParam, function (err, res) {
                    seriesCallback(null, null); 
                });
            }
        ]);
    });
}

/**
 * 
 * @param {string} link
 * @param {[string, string]} reason The first element must be the command name and the second the reason of this deletion.
 * @APICall 5
 */
function DeleteFile(link, reason, seriesCallback) {
    /*Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('DeleteFile');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));*/

    //Check the given link
    if (link == '') {
        seriesCallback(null, null);
        return;
    }

    //Basic parameter for the API
    var deleteParam = {
        auth: Import.auth,
        fileId: link
    }

    async.series([
        //Get author to send him a notification
        function (call) { GetInfoProperty(link, ['author'], call); }
    ], function (err, result) {
        let name = '';
        async.series([
            //Get name to save the file
            function (call) {
                Import.drive.files.get({
                    auth: Import.auth,
                    fileId: link,
                    fields: 'name'
                }, function (err, res) {
                    name = res.data.name;
                    call();
                });
            },
            //Download file's content
            function (call) {
                Import.drive.files.get({
                    auth: Import.auth,
                    fileId: link,
                    alt: 'media'
                }, {
                    responseType: 'arraybuffer'
                }, function (err, res) {
                    fs.writeFileSync(name, new Uint8Array(res.data));
                    call();
                });
            },
            //Send notification to the author with his file
            function (call) {
                let fakeMessage = {
                    author: Import.client.users.cache.get(result[0][0])
                };
                SendRightChannel(fakeMessage, reason, 'info', 'Your file will be deleted, I send it to you. Reason :\n' + reason[1], (msg) => { 
                    fs.unlink(name, (err) => {
                        call();
                    });
                }, [], name, false);
            },
            //Delete file (put into the trash and then empty the trash)
            function (cb) {
                Import.drive.files.delete(deleteParam, function (err, res) { cb(null, null); });
            },
            function (cb) {
                Import.drive.files.emptyTrash({ auth: Import.auth }, function (err, res) { cb(null, null); });
            }
        ], function (err, result) {
            seriesCallback(null, null);
        });
    });
}

/**
 * 
 * @param {number} CourseId 
 * @param {Discord.Snowflake} guild 
 * @param {function(Error, any)} seriesCallback
 * @APICall 1
 */
function GetFileLinkById(CourseId, guild, seriesCallback) {
    if(CourseId < 0)
        return '';
    
    var resultFiles = {
        unvalidate : null,
        validate : null
    };

    GetAllFileInPosition('', guild, 'files(id, appProperties(CourseId, permission))', CourseId, function (err, res, param, callcall) {
        for (let i = 0; i < res.data.files.length; i++) {
            if (res.data.files[i].appProperties.CourseId == param) {
                resultFiles[(res.data.files[i].appProperties.permission == 'v') ? "validate" : "unvalidate"] = {
                    link : res.data.files[i].id,
                    permission : res.data.files[i].appProperties.permission
                };

                if (resultFiles.validate != null && resultFiles.unvalidate != null) {
                    callcall(null, false);
                    return;
                }
            }
        }
        callcall(null, true);
    }, (err, result) => { seriesCallback(null, resultFiles); });
}

/** 
 * 
 * @param {string} position //Useless
 * @param {Discord.Snowflake} guild
 * @param {string} fields
 * @param {function(Error, any, any, function(Error, boolean))} pageCallback
 * @returns {boolean}
 * @APICall 1 (if less files than 1000)
 */
function GetAllFileInPosition(position, guild, fields, param, pageCallback, seriesCallback) {
    //Basic parameters for search commands
    var searchParam = {
        auth: Import.auth,
        q: "mimeType != 'application/vnd.google-apps.folder'",//Search real files, not folders
        fields: 'nextPageToken, ' + fields,//To be able to continue
        spaces: 'drive',
        pageToken: null,
        pageSize: 1000,
        corpora : 'user'
    };
    console.log(searchParam);

    //While boucle, gives results
    async.doWhilst(function (cb) {
        Import.drive.files.list(searchParam, function (err, res) {
            console.log(res.data.files);
            searchParam.pageToken = res.nextPageToken;//To be able to get next page
            pageCallback(err, res, param, cb);//To allows caller to take data
        });
    }, function (continuerParam, callou) {
        callou(null, (searchParam.pageToken != undefined) && continuerParam);//Use caller decision
    }, function (err, result) {
        seriesCallback(null, result);
    });
}

/**
 * 
 * @param {string} folder
 * @param {Discord.Snowflake} guild
 * @todo Delete this function : is now useless
 */
function FindFolderLink(folder, guild, seriesCallback) {
    let parts = folder.split('/');
    var idResult = Import.GuildParameters.get(guild).url;

    if (folder == '') {
        seriesCallback(null, idResult);
        return;
    }

    async.timesSeries(parts.length, function (i, next) {
        let searchParam = {
            auth: Import.auth,
            q: "mimeType = 'application/vnd.google-apps.folder'",
            fields: 'files(id)',
            spaces: 'drive',
            corpus: 'user'
        }
        searchParam.q += (" and '" + idResult + "' in parents and name = '" + parts[i] + "'");
        Import.drive.files.list(searchParam, function (err, res) {
            idResult = res.data.files[0].id;
            next(null, res.data.files[0].id);
        });
    }, function (err, result) { seriesCallback(null, idResult); });
}

/*________________________________________*/

/**
 * @param {Discord.Snowflake} guild
 */
function SaveSettings(guild) {
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('SaveSettings');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    const data = JSON.stringify(Import.GuildParameters.get(guild), null, 4);
    fs.writeFileSync("guildsfiles/" + guild + '.jsonset', data, { encoding: 'utf-8' });
}

/**
 * @param {Discord.Snowflake} guild
 */
function LoadSettings(guild) {
    Import.GuildLogStream.get(guild).write('\n');
    Import.GuildLogStream.get(guild).write('LoadSettings');
    Import.GuildLogStream.get(guild).write(JSON.stringify(arguments, null, 4));

    if (fs.existsSync("guildsfiles/" + guild + '.jsonset')) {
        const data = fs.readFileSync("guildsfiles/" + guild + '.jsonset', 'utf-8');
        Import.GuildParameters.set(guild, JSON.parse(data));
    }
    else {
        Import.GuildParameters.set(guild, new Import.SettingsVariable());
    }
}

/**
 * @param {Discord.Snowflake} user
 */
function SaveUserData(user) {
    const data = JSON.stringify(Import.UserParameters.get(user), null, 4);
    fs.writeFileSync("usersfiles/" + user + '.jsonset', data, { encoding: 'utf-8' });
}

/**
 * @param {Discord.Snowflake} user
 */
function LoadUserData(user) {
    if (fs.existsSync("usersfiles/" + user + '.jsonset')) {
        const data = fs.readFileSync("usersfiles/" + user + '.jsonset', 'utf-8');
        Import.UserParameters.set(user, JSON.parse(data));
    }
}

module.exports = {
    name : 'basic_function',
    
    DoubleListContain : DoubleListContain,
    GetRole : GetRole,

    SendDM : SendDM,
    SendRightChannel : SendRightChannel,
    GetMessageParameter : GetMessageParameter,
    DoesIdExist : DoesIdExist,

    GetInfoProperty : GetInfoProperty, //AsyncOKOK
    SetInfoProperty : SetInfoProperty, //AsyncOKOK
    
    MoveFile: MoveFile, //AsyncOKOK
    DeleteFile : DeleteFile, //AsyncOKOK
    GetFileLinkById : GetFileLinkById, //AsyncOKOK
    GetAllFileInPosition: GetAllFileInPosition, //AsyncOKOK
    FindFolderLink: FindFolderLink, //AsyncOKOK

    SaveSettings : SaveSettings,
    LoadSettings : LoadSettings,
    SaveUserData : SaveUserData,
    LoadUserData : LoadUserData
}