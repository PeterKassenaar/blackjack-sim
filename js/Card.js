/**
 * Created by Peter Kassenaar on 14-4-2015.
 */
/** @constructor */
var Card = function (suit, number) {
	/** @returns {Number} The number of the card in the deck. (1-52) */
	this.getNumber = function () {
		return number;
	};
	/** @returns {String} The name of the suit. "Hearts","Clubs","Spades", or "Diamonds." */
	this.getSuit = function () {
		var suitName = '';
		switch (suit) {
			case 1:
				suitName = "Hearts";
				break;
			case 2:
				suitName = "Clubs";
				break;
			case 3:
				suitName = "Spades";
				break;
			case 4:
				suitName = "Diamonds";
				break;
		}
		return suitName;
	};
	/** @returns {String} The HTML-encoded symbol of the suit. */
	this.getSymbol = function () {
		var suitName = '';
		switch (suit) {
			case 1:
				suitName = "&hearts;";
				break;
			case 2:
				suitName = "&clubs;";
				break;
			case 3:
				suitName = "&spades;";
				break;
			case 4:
				suitName = "&diams;";
				break;
		}
		return suitName;
	};
	/** @returns {Number} The value of the card for scoring. */
	this.getValue = function () {
		var value = number;
		if (number >= 10) {
			value = 10;
		}
		if (number === 1) {
			value = 11;
		}
		return value;
	};
	/** @returns {String} The full name of the card. "Ace of Spades" */
	this.getName = function () {
		var cardName = '';
		switch (number) {
			case 1:
				cardName = "A";
				break;
			case 13:
				cardName = "K";
				break;
			case 12:
				cardName = "Q";
				break;
			case 11:
				cardName = "J";
				break;
			default:
				cardName = number;
				break;
		}
		return cardName + this.getSymbol();
	};
};
