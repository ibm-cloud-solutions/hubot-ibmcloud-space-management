'use strict';

const Helper = require('hubot-test-helper');
const helper = new Helper('../src/scripts');

describe('Load modules through index', function() {

	let room;

	beforeEach(function() {
		room = helper.createRoom();
	});

	afterEach(function() {
		room.destroy();
	});

	context('`load index`', function() {
		it('should load without problems', function() {
			require('../index')(room.robot);
		});
	});
});
