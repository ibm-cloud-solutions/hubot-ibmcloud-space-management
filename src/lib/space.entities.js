/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const cf = require('hubot-cf-convenience');
const nlcconfig = require('hubot-ibmcloud-cognitive-lib').nlcconfig;

const NAMESPACE = 'IBMcloudSpaceManagement';
const PARAM_SPACENAME = 'spacename';

var functionsRegistered = false;


function buildGlobalName(parameterName) {
	return NAMESPACE + '_' + parameterName;
}
function buildGlobalFuncName(parameterName) {
	return NAMESPACE + '_func' + parameterName;
}

function registerEntityFunctions() {
	if (!functionsRegistered) {
		nlcconfig.setGlobalEntityFunction(buildGlobalFuncName(PARAM_SPACENAME), getSpaceNames);
		functionsRegistered = true;
	}
}

function getSpaceNames(robot, res, parameterName, parameters) {
	return new Promise(function(resolve, reject) {
		cf.Orgs.getSummary(cf.guids.org).then((result) => {
			var spaceNames = result.spaces.map(function(space){
				return space.name;
			});
			nlcconfig.updateGlobalParameterValues(buildGlobalName(PARAM_SPACENAME), spaceNames);
			resolve(spaceNames);
		}).catch(function(err) {
			reject(err);
		});
	});
}

module.exports.registerEntityFunctions = registerEntityFunctions;
module.exports.getSpaceNames = getSpaceNames;
