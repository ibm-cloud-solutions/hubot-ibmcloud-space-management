'use strict';

const expect = require('chai').expect;
const Helper = require('hubot-test-helper');
const helper = new Helper('../src/scripts');

describe('Space entities', function() {
	let room;

	beforeEach(function() {
		room = helper.createRoom();
	});

	afterEach(function() {
		room.destroy();
	});

	context('verify entity functions', function() {

		it('should retrieve set of space names', function(done) {
			const entities = require('../src/lib/space.entities');
			let res = { message: {text: '', user: {id: 'mimiron'}}, response: room };
			entities.getSpaceNames(room.robot, res, 'spacename', {}).then(function(spaceNames) {
				expect(spaceNames.length).to.eql(1);
				done();
			}).catch(function(error) {
				done(error);
			});
		});
	});
});
