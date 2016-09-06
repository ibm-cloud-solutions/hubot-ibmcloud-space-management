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
const portend = require('portend');

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
	});

	afterEach(function() {
		room.destroy();
	});

	context('user calls `space help`', function() {
		it('should respond with the help', function() {
			room.user.say('mimiron', '@hubot space help');

			return portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.eql('\nhubot space current|show - Show the current space.\nhubot space set|use [space] - Set your active space.\nhubot spaces show|list - Show all of the spaces in the organization.\n');
			});
		});
	});

	context('user calls `spaces help`', function() {
		it('should respond with the help', function() {
			room.user.say('mimiron', '@hubot spaces help');

			return portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.eql('\nhubot space current|show - Show the current space.\nhubot space set|use [space] - Set your active space.\nhubot spaces show|list - Show all of the spaces in the organization.\n');
			});
		});
	});

	context('user calls `space set`', function() {
		it('should respond with the cannot find the space', function() {
			room.user.say('mimiron', '@hubot space set unknownSpace');

			return portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.eql(i18n.__('space.set.in.progress', 'unknownSpace'));
				expect(events[1].message).to.eql(i18n.__('space.not.found', 'unknownSpace'));
			});
		});

		it('should respond with the space', function() {
			room.user.say('mimiron', '@hubot space set testSpace');

			return portend.twice(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.eql(i18n.__('space.set.in.progress', 'testSpace'));
				expect(events[1].message).to.eql(i18n.__('space.set.success', 'testSpace'));
			});
		});
	});

	context('user calls `space current`', function() {
		it('should respond with current space', function() {
			room.user.say('mimiron', '@hubot space current');

			return portend.once(room.robot, 'ibmcloud.formatter').then(events => {
				expect(events[0].message).to.be.a('string');
				expect(events[0].message).to.eql(`${i18n.__('space.current', 'testSpace')}`);
			});
		});
	});

	context('user calls `list my spaces`', function() {
		it('should respond with the spaces', function() {
			room.user.say('mimiron', '@hubot list my spaces');

			return portend.once(room.robot, 'ibmcloud.formatter').then(event => {
				expect(event[0].attachments.length).to.eql(1);
				expect(event[0].attachments[0].title).to.eql('testSpace');
			});
		});
	});
});
