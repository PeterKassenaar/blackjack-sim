/**
 * Created by Peter Kassenaar on 14-4-2015.
 */
/** @constructor
 * @param {Deck} deck - The deck from which the cards are dealt.
 * @param {number} numCards - the number of cards that are dealt. Two for the player, one for the dealer.
 * @param {number} value - the value (i.e. betting size) for this hand.
 * @param {boolean} splitHandCard - true if this new hand is based on a previous splitted hand.
 * */
var Hand = function (deck, numCards, value, splitHandCard) {
	var cards = [];
	var betSize = value ? value : 0;

	if (splitHandCard) {
		/** Hand is based on split of a previous hand.
		 *  Create a new hand with the existing card and
		 *  deal one new card */
		cards.push(splitHandCard);
		cards.push(deck.deal());
	} else {
		/* New Hand. Deal one or two cards to begin. */
		numCards === 1
			? cards.push(deck.deal())        		// one card for de the dealer
			: cards.push(deck.deal(), deck.deal()); // two cards for the player
	}
	/** @returns {Array} The array of Cards representing the Hand. */
	this.getHand = function () {
		return cards;
	};
	/** @returns {Number} The score of the Hand. */
	this.score = function () {
		var i,
			score = 0,
			cardVal = 0, // Stashing the Card's value
			aces = 0; // Stores the # of Aces in the Hand

		for (i = 0; i < cards.length; i++) {
			cardVal = cards[i].getValue();
			if (cardVal === 11) {
				aces += 1;
			}
			score += cardVal;
		}
		/* Check to see if Aces should be 1 or 11 */
		while (score > 21 && aces > 0) {
			score -= 10;
			aces -= 1;
		}
		return score;
	};

	this.isPairOfAces = function () {
		if (cards.length === 2) {
			return (cards[0].getValue() === 11) && (cards[1].getValue() === 11);
		}
		return false;
	};

	/** Check if player or dealer has blackjack (==21 w/ only two cards)
	 * @Returns {bool} true if the hand is a blackjack, false if not.
	 */
	this.isBlackjack = function () {
		return (cards.length === 2) && (this.score() === 21);
	};

	/** Double down only allowed on first two cards
	 * @returns {bool} true if doubling down is allowed
	 * */
	this.canDouble = function () {
		return cards.length === 2;
	};


	/** Check if the hand has a pair (2,2, 3,3, 4,4 etc.).
	 * @returns {bool} true is the hand is a pair, false if not
	 */
	this.isPair = function () {
		if (cards.length !== 2) {
			return false;
		} else {
			//var currentHand = hand.getHand();
			if (cards[0].getValue() === cards[1].getValue()) {
				return true;
			}
		}
		return false;
	};

	/** Check if this hand is considered a soft hand (i.e. it contains an
	 * ace that is counted as 11.
	 * @returns {boolean} true if hand is soft hand. False if not.
	 */
	this.isSoftHand = function () {
		var i,
			score = 0,
			cardVal = 0, // Stashing the Card's value
			aces = 0; // Stores the # of Aces in the Hand

		for (i = 0; i < cards.length; i++) {
			cardVal = cards[i].getValue();
			if (cardVal === 11) {
				aces += 1;
			}
			score += cardVal;
		}
		/* if there is one (or more) ace, and the score is
		 * still below 21, it is a soft hand */
		return (score < 21 && aces > 0);
	};

	/** Getter and setter for size of bet for this hand
	 *
	 * @param value The value to set for the betsize.
	 * @returns {number} The betsize for this hand
	 */
	this.betSize = function (value) {
		if (value) {
			betSize = value;
		} else {
			return betSize;
		}

	};

	/** Doubles the bet size for this hand. */
	this.double = function () {
		betSize *= 2;
	};

	/** @returns {String} Comma separated list of Card names in the Hand. */
	this.printHand = function () {
		var arrayOut = [],
			i;

		for (i = 0; i < cards.length; i++) {
			arrayOut.push(cards[i].getName());
		}
		return arrayOut.join();
	};
	/** Adds a Card from the Deck into the Hand. */
	this.hitMe = function () {
		cards.push(deck.deal());
	};
	/** @returns {String} HTML representation of the Cards in the Hand. */
	this.toHtml = function () {
		var arrayOut = [],
			i;

		for (i = 0; i < cards.length; i++) {
			arrayOut.push('<div class="card ', cards[i].getSuit(), ' ', cards[i].getNumber(), '">', cards[i].getName(), '</div>');
		}
		return arrayOut.join('');
	};
};
