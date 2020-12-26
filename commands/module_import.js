/*
 * "commands/module_import.js"
 * Created by Math's
 */

 //Necessary modules
const fs = require('fs');
const Discord = require('discord.js');
const { google } = require('googleapis');
const BasePrefix = 'Biblio:';
const auth_path = require('../auth.json');

//Instances creation
let client = new Discord.Client({ ws: { intents: ['DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'GUILDS', 'GUILD_INTEGRATIONS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_PRESENCES'] }});
let drive = google.drive('v3');

//Google's authentification
let privatekey = require("../" + auth_path.path + auth_path.google_keys[0]);
let jwtClient = new google.auth.JWT(privatekey.client_email, null, privatekey.private_key, ['https://www.googleapis.com/auth/drive']);
jwtClient.authorize(function (err, tokens) { console.log("Successfully connected!"); });

/*________________________________________*/

/**
 * @class 
 * @description Class used to store all the guild's settings.
 */
class SettingsVariable {
    constructor()
    {
        this.subject_name = [];
        this.channel_subject = [];
        this.role_subject = [];
        this.level_name = [];
        this.role_level = [];
        this.channel_prof = [];
        this.url = '';
        this.lastId = 0;
        this.Idlost = [];
        this.IsThereAValidation = true;
        this.IsThereARefuse = false;
        this.prefix = BasePrefix;
    }
    
    /**
     * @public
     * @type {string[]}
     */
    subject_name = [];
    /**
     * @public
     * @type {Discord.Snowflake[][]}
     */
    channel_subject = [];
    /**
     * @public
     * @type {Discord.Snowflake[]}
     * @description Roles (of prof) sorted by subject_n
     */
    role_subject = [];

    /**
     * @public
     * @type {string[]}
     */
    level_name = [];
    /**
     * @public
     * @type {Discord.Snowflake[]}
     */
    role_level = [];

    /**
     * @public
     * @type {Discord.Snowflake[]}
     */
    channel_prof;

    /**
     * @type {string}
     */
    url;

    /**
     * @type {number}
     */
    lastId;

    /**
     * @type {number[]}
     */
    Idlost;

    /**
     * @type {boolean}
     */
    IsThereAValidation;

    /**
     * @type {boolean}
    */
    IsThereARefuse;

    /**
     * @type {string}
     */
    prefix;
};

/**
 * @type {Discord.Collection<Discord.Snowflake, SettingsVariable>} 
 * @description Stores guilds' settings.
 */
var GuildParameters = new Discord.Collection();

/*________________________________________*/

/**
 * @type {Discord.Collection<Discord.Snowflake, fs.WriteStream>}
 */
var GuildLogStream = new Discord.Collection();

/*________________________________________*/

module.exports = {
    name :'import',

    client : client,
    BasePrefix : BasePrefix,

    SettingsVariable : SettingsVariable,
    GuildParameters: GuildParameters,
    GuildLogStream: GuildLogStream,

    drive: drive,
    auth: jwtClient,
    privatekey: privatekey
}