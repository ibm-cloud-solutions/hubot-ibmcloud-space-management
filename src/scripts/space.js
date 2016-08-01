// Description:
//	Listens for commands to initiate actions against Bluemix
//
// Configuration:
//	 HUBOT_BLUEMIX_API Bluemix API URL
//	 HUBOT_BLUEMIX_ORG Bluemix Organization
//	 HUBOT_BLUEMIX_SPACE Bluemix space
//	 HUBOT_BLUEMIX_USER Bluemix User ID
//	 HUBOT_BLUEMIX_PASSWORD Password for the Bluemix User
//
// Commands:
//   hubot space(s) help - Show available commands in the space category.
//
// Author:
//	nsandona
//
/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

var path = require('path');
var TAG = path.basename(__filename);

const cf = require('hubot-cf-convenience');
const activity = require('hubot-ibmcloud-activity-emitter');

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
const i18n = new (require('i18n-2'))({
	locales: ['en'],
	extension: '.json',
	// Add more languages to the list of locales when the files are created.
	directory: __dirname + '/../messages',
	defaultLocale: 'en',
	// Prevent messages file from being overwritten in error conditions (like poor JSON).
	updateFiles: false
});
// At some point we need to toggle this setting based on some user input.
i18n.setLocale('en');

const SPACE_HELP = /(spaces|space)\s+help/i;
const SPACE = /space\s+(current|show)/i;
const SET_SPACE = /space\s+(set|use)\s+(.*)/i;

module.exports = function(robot) {

	robot.on('bluemix.space.get', (res) => {
		robot.logger.debug(`${TAG}: Natural Language match!`);
		getSpace(res);
	});

	robot.respond(SPACE, {id: 'bluemix.space.get'}, (res) => {
		robot.logger.debug(`${TAG}: RegEx match!`);
		getSpace(res);
	});

	function getSpace(res){
		robot.logger.debug(`${TAG}: bluemix.space.get bluemix.space.get res.message.text=${res.message.text}.`);
		robot.logger.info(`Requested current space for ${res.message.user.real_name} <${res.message.user.email_address}>`);
		let space = cf.activeSpace(robot, res).name;
		let message = i18n.__('space.current', space);
		robot.emit('ibmcloud.formatter', { response: res, message: message});
		robot.logger.debug(`${TAG}: current space ${space}.`);
	}

	robot.on('bluemix.space.set', (res, parameters) => {
		robot.logger.debug(`${TAG}: bluemix.space.set - Natural Language match - res.message.text=${res.message.text}.`);
		if (parameters && parameters.spacename) {
			setSpace(res, parameters.spacename);
		}
		else {
			robot.logger.error(`${TAG}: Error extracting Space Name from text [${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.space.set');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}
	});

	robot.respond(SET_SPACE, {id: 'bluemix.space.set'}, (res) => {
		robot.logger.debug(`${TAG}: bluemix.space.set res.message.text=${res.message.text}.`);
		const name = res.match[2];
		setSpace(res, name);
	});

	function setSpace(res, name){
		robot.logger.info(`Setting space ${name} for ${res.message.user.real_name} <${res.message.user.email_address}>`);
		let message = i18n.__('space.set.in.progress', name);
		robot.emit('ibmcloud.formatter', { response: res, message: message});
		robot.logger.info(`${TAG}: Asynch call using cf library to obtain Organization summary.`);
		cf.Orgs.getSummary(cf.guids.org).then((org) => {
			let orgStr = '';
			if (org){
				orgStr = JSON.stringify(org);
			}
			robot.logger.info(`${TAG}: cf library returned with summary ${orgStr}.`);
			const found = org.spaces.some((space) => {
				if (space.name === name) {
					let info = robot.brain.get(res.message.user.id);
					if (!info) {
						info = {};
						robot.brain.set(res.message.user.id, info);
					}
					info.space = space;
					return true;
				}
			});
			if (!found) {
				robot.logger.error(`${TAG}: The space ${name} was not found.`);
				let message = i18n.__('space.not.found', name);
				robot.emit('ibmcloud.formatter', { response: res, message: message});
			}
			else {
				let message = i18n.__('space.set.success', name);
				robot.emit('ibmcloud.formatter', { response: res, message: message});
				activity.emitBotActivity(robot, res, {
					activity_id: 'activity.space.set',
					space_name: cf.activeSpace(robot, res).name,
					space_guid: cf.activeSpace(robot, res).guid
				});
				robot.logger.debug(`${TAG}: space set to ${name}.`);
			}
		});
	};

	robot.on('bluemix.space.help', (res) => {
		robot.logger.debug(`${TAG}: Natural Language match!`);
		getHelp(res);
	});

	robot.respond(SPACE_HELP, (res) => {
		robot.logger.debug(`${TAG}: RegEx match!`);
		getHelp(res);
	});

	function getHelp(res){
		robot.logger.debug(`${TAG}: bluemix.space.help res.message.text=${res.message.text}.`);
		let help = robot.name + ' space current|show - ' + i18n.__('help.space.show') + '\n'
			+ robot.name + ' space set|use [space] - ' + i18n.__('help.space.set') + '\n'
			+ robot.name + ' spaces show|list - ' + i18n.__('help.spaces.show') + '\n';

		robot.emit('ibmcloud.formatter', { response: res, message: '\n' + help});
	};
};
