/******************************************************************************
 *                                                                            *
 *    This file is part of RPB Chess, a JavaScript chess library.             *
 *    Copyright (C) 2017  Yoann Le Montagner <yo35 -at- melix.net>            *
 *                                                                            *
 *    This program is free software: you can redistribute it and/or modify    *
 *    it under the terms of the GNU General Public License as published by    *
 *    the Free Software Foundation, either version 3 of the License, or       *
 *    (at your option) any later version.                                     *
 *                                                                            *
 *    This program is distributed in the hope that it will be useful,         *
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of          *
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           *
 *    GNU General Public License for more details.                            *
 *                                                                            *
 *    You should have received a copy of the GNU General Public License       *
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.   *
 *                                                                            *
 ******************************************************************************/


'use strict';


var bt = require('./basetypes');
var exception = require('./exception');

var Position = require('./position').Position;


/**
 * TODO
 */
var Game = exports.Game = function() {
	this._playerName  = [undefined, undefined];
	this._playerElo   = [undefined, undefined];
	this._playerTitle = [undefined, undefined];
	this._event     = undefined;
	this._round     = undefined;
	this._date      = undefined;
	this._site      = undefined;
	this._annotator = undefined;
	this._result    = bt.LINE;

	this._initialPosition = new Position();
	this._fullMoveNumber  = 1;

	/* jshint nonew:false */ new Variation(this, true); /* jshint nonew:true */

};


/**
 * Get/set the player name.
 */
Game.prototype.playerName = function(color, value) {
	color = bt.colorFromString(color);
	if(color < 0) { throw new exception.IllegalArgument('Game#playerName()'); }
	if(arguments.length === 1) { return this._playerName[color]; }
	else { this._playerName[color] = value; }
};


/**
 * Get/set the player elo.
 */
Game.prototype.playerElo = function(color, value) {
	color = bt.colorFromString(color);
	if(color < 0) { throw new exception.IllegalArgument('Game#playerElo()'); }
	if(arguments.length === 1) { return this._playerElo[color]; }
	else { this._playerElo[color] = value; }
};


/**
 * Get/set the player title.
 */
Game.prototype.playerTitle = function(color, value) {
	color = bt.colorFromString(color);
	if(color < 0) { throw new exception.IllegalArgument('Game#playerTitle()'); }
	if(arguments.length === 1) { return this._playerTitle[color]; }
	else { this._playerTitle[color] = value; }
};


/**
 * Get/set the event.
 */
Game.prototype.event = function(value) {
	if(arguments.length === 0) { return this._event; }
	else { this._event = value; }
};


/**
 * Get/set the round.
 */
Game.prototype.round = function(value) {
	if(arguments.length === 0) { return this._round; }
	else { this._round = value; }
};


/**
 * Get/set the date of the game.
 */
Game.prototype.date = function(value) {
	if(arguments.length === 0) {
		return this._date;
	}
	else if(typeof value === 'undefined' || value === null) {
		this.date = undefined;
	}
	else if(value instanceof Date) {
		this.date = value;
	}
	else if(typeof value === 'object' && typeof value.year === 'number' && typeof value.month === 'number') {
		this.date = { year: value.year, month: value.month };
	}
	else {
		throw new exception.IllegalArgument('Game#date()');
	}
};


/**
 * Get/set where the game takes place.
 */
Game.prototype.site = function(value) {
	if(arguments.length === 0) { return this._site; }
	else { this._site = value; }
};


/**
 * Get/set the annotator.
 */
Game.prototype.annotator = function(value) {
	if(arguments.length === 0) { return this._annotator; }
	else { this._annotator = value; }
};


/**
 * Get/set the result of the game.
 */
Game.prototype.result = function(value) {
	if(arguments.length === 0) {
		return bt.resultToString(this._result);
	}
	else {
		var result = bt.resultFromString(value);
		if(result < 0) {
			throw new exception.IllegalArgument('Game#result()');
		}
		this._result = result;
	}
};
