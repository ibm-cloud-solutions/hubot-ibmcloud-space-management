/*
 * Licensed Materials - Property of IBM
 * (C) Copyright IBM Corp. 2016. All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or
 * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
 */
'use strict';

const Helper = require('hubot-test-helper');
const helper = new Helper('../src/scripts');
const expect = require('chai').expect;
const mockUtils = require('./mock.utils.cf.js');
const mockESUtils = require('./mock.utils.es.js');

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
const i18n = new (require('i18n-2'))({
	locales: ['en'],
	extension: '.json',
	// Add more languages to the list of locales when the files are created.
	directory: __dirname + '/../src/messages',
	defaultLocale: 'en',
	// Prevent messages file from being overwritten in error conditions (like poor JSON).
	updateFiles: false
});
// At some point we need to toggle this setting based on some user input.
i18n.setLocale('en');

// Passing arrow functions to mocha is discouraged: https://mochajs.org/#arrow-functions
// return promises from mocha tests rather than calling done() - http://tobyho.com/2015/12/16/mocha-with-promises/
describe('Interacting with Bluemix via Slack', function() {

	let room;
	let cf;

	before(function() {
		mockUtils.setupMockery();
		mockESUtils.setupMockery();
		// initialize cf, hubot-test-helper doesn't test Middleware
		cf = require('hubot-cf-convenience');
		return cf.promise.then();
	});

	beforeEach(function() {
		room = helper.createRoom();
		// Force all emits into a reply.
		room.robot.on('ibmcloud.formatter', function(event) {
			if (event.message) {
				event.response.reply(event.message);
			}
			else {
				event.response.send({attachments: event.attachments});
			}
		});
	});

	afterEach(function() {
		room.destroy();
	});

	context('user calls `space help`', function() {
		beforeEach(function() {
			return room.user.say('mimiron', '@hubot space help');
		});

		it('should respond with the help', function() {
			expect(room.messages.length).to.eql(2);
			expect(room.messages[1][1]).to.be.a('string');
		});
	});

	context('user calls `spaces help`', function() {
		beforeEach(function() {
			return room.user.say('mimiron', '@hubot spaces help');
		});

		it('should respond with the help', function() {
			expect(room.messages.length).to.eql(2);
			expect(room.messages[1][1]).to.be.a('string');
		});
	});
	context('user calls `space set`', function() {
		beforeEach(function() {
			room.user.say('mimiron', '@hubot space set unknownSpace');
			return room.user.say('mimiron', '@hubot space set testSpace');
		});

		it('should respond with the cannot find the space', function() {
			expect(room.messages.length).to.eql(6);
			expect(room.messages[4]).to.eql(['hubot', '@mimiron ' + i18n.__('space.not.found', 'unknownSpace')]);
		});

		it('should respond with the space', function() {
			expect(room.messages.length).to.eql(6);
			expect(room.messages[5]).to.eql(['hubot', '@mimiron ' + i18n.__('space.set.success', 'testSpace')]);
		});
	});

	context('user calls `space current`', function() {
		it('should respond with current space', function() {
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.attachments.length).to.eql(1);
				expect(event.attachments[0].title).to.eql('testSpace');
			});
			room.user.say('mimiron', '@hubot space current').then();
		});
	});

	context('user calls `list my spaces`', function() {
		it('should respond with the spaces', function() {
			room.robot.on('ibmcloud.formatter', function(event) {
				expect(event.attachments.length).to.eql(1);
				expect(event.attachments[0].title).to.eql('testSpace');
			});
			room.user.say('mimiron', '@hubot list my spaces').then();
		});
	});
});
