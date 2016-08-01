// Description:
//	Listens for commands to list the spaces in the org
//
// Configuration:
//	 HUBOT_BLUEMIX_API Bluemix API URL
//	 HUBOT_BLUEMIX_ORG Bluemix Organization
//	 HUBOT_BLUEMIX_SPACE Bluemix space
//	 HUBOT_BLUEMIX_USER Bluemix User ID
//	 HUBOT_BLUEMIX_PASSWORD Password for the Bluemix User
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
const palette = require('hubot-ibmcloud-utils').palette;
const utils = require('hubot-ibmcloud-utils').utils;
const nlcconfig = require('hubot-ibmcloud-cognitive-lib').nlcconfig;
const activity = require('hubot-ibmcloud-activity-emitter');

const SPACES = /spaces|((show|list)\s+((my)*\s+)*spaces)/i;

module.exports = (robot) => {

	robot.on('bluemix.space.list', (res) => {
		robot.logger.debug(`${TAG}: Natural Language match!`);
		listSpaces(res);
	});

	robot.respond(SPACES, {id: 'bluemix.space.list'}, (res) => {
		robot.logger.debug(`${TAG}: RegEx match!`);
		listSpaces(res);
	});

	function listSpaces(res) {
		robot.logger.debug(`${TAG}: res.message.text=${res.message.text}.`);
		robot.logger.info(`${TAG}: ${res.message.user.real_name} <${res.message.user.email_address}> asked for a list of spaces.`);
		robot.logger.info(`${TAG}: Asynch call using cf library to obtain Organization summary.`);
		cf.Orgs.getSummary(cf.guids.org).then((summary) => {
			let summaryStr = '';
			if (summary) {
				summaryStr = JSON.stringify(summary);
			}
			robot.logger.info(`${TAG}: cf library returned with summary ${summaryStr}.`);
			const attachments = summary.spaces.map((space) => {
				return {
					title: space.name,
					color: palette.positive,
					fields: [
						{title: 'Services', value: space.service_count, short: true},
						{title: 'Apps', value: space.app_count, short: true},
						{title: 'Memory', value: utils.formatMemory(space.mem_dev_total), short: true}
					]
				};
			}).sort((l, r) => l.title.localeCompare(r.title));
			if (attachments.length) {
				attachments[0].pretext = `Spaces in \`${summary.name}\``;
				attachments[0].mrkdwn = true;
				attachments[0].mrkdwn_in = ['pretext'];
			}

			var spaceNames = summary.spaces.map((space) => {
				return space.name;
			});
			nlcconfig.updateGlobalParameterValues('IBMcloudSpaceManagement_spacename', spaceNames);

			// Emit the app status as an attachment
			robot.emit('ibmcloud.formatter', {
				response: res,
				attachments
			});

			activity.emitBotActivity(robot, res, {activity_id: 'activity.space.list'});
		}, robot.logger.error.bind(robot.logger));
	};
};
