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

describe('Interacting with Natural Language -', function() {

	let room;
	let cf;

	before(function() {
		mockUtils.setupMockery();
		mockESUtils.setupMockery();
		cf = require('hubot-cf-convenience');
		return cf.promise.then();
	});

	beforeEach(function() {
		room = helper.createRoom();
	});

	afterEach(function() {
		room.destroy();
	});

	context('space help - user says `I want help with spaces` ', function() {
		it('should display help', function(done) {
			// add event hook
			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.contain('space current|show');
				expect(event.message).to.contain('space set|use [space]');
				expect(event.message).to.contain('spaces show|list');
				done();
			});

			let res = { message: {text: 'I want help with spaces'}, response: room };
			room.robot.emit('bluemix.space.help', res, {});
		});
	});

	context('space get - user says `What is my current space` ', function() {
		it('should list current space', function(done) {
			// add event hook
			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.equal('You\'re using the *testSpace* space.');
				done();
			});

			let res = { message: {text: 'What is my current space', user: {real_name: 'test', email_address: 'test@us.ibm.com'}}, response: room};
			room.robot.emit('bluemix.space.get', res, {});
		});
	});

	context('space set - user says `I want to use space testSpace` ', function() {
		it('should switch to testSpace space', function(done) {
			// this is not a generally recommended way to do this
			// but we know there are two events and they come in a certain order
			// and we need to know the contents of each respective event
			let eventCount = 0;
			// add event hook
			room.robot.on('ibmcloud.formatter', (event) => {
				eventCount++;
				if (eventCount === 1) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.equal(i18n.__('space.set.in.progress', 'testSpace'));
				}
				if (eventCount === 2) {
					expect(event.message).to.be.a('string');
					expect(event.message).to.equal(i18n.__('space.set.success', 'testSpace'));
					done();
				}
			});

			let res = { message: {text: 'I want to use space testSpace', user: {real_name: 'test', email_address: 'test@us.ibm.com'}}, response: room};
			room.robot.emit('bluemix.space.set', res, {spacename: 'testSpace'});
		});
	});

	context('space set - missing space name ', function() {
		it('should switch to testSpace space', function(done) {
			// add event hooks
			room.robot.on('ibmcloud.formatter', (event) => {
				expect(event.message).to.be.a('string');
				expect(event.message).to.eql(i18n.__('cognitive.parse.problem.space.set'));
				done();
			});

			let res = { message: {text: 'I want to use space testSpace', user: {real_name: 'test', email_address: 'test@us.ibm.com'}}, response: room};
			room.robot.emit('bluemix.space.set', res, {});
		});
	});

	context('space get - user says `What are my spaces` ', function() {
		it('should list all spaces', function(done) {
			// add event hook
			room.robot.on('ibmcloud.formatter', (event) => {
				if (event.attachments){
					expect(event.attachments.length).to.eql(1);
					expect(event.attachments[0].title).to.eql('testSpace');
					done();
				}
			});

			let res = { message: {text: 'What are my spaces', user: {real_name: 'test', email_address: 'test@us.ibm.com'}}, response: room};
			room.robot.emit('bluemix.space.list', res, {});
		});
	});
});
