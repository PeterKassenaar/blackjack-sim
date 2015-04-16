/**
 * Created by Peter Kassenaar on 14-4-2015.
 */
/** @constructor */
var Deck = function (numDecks) {
	var cards = [];
	/** Creates a new set of cards. */
	var newCards = function () {
		var i,
			j,
			suit,
			number;
		if (!numDecks) {
			numDecks = 1;
		}

		/* Create a cards[] array of the requested number of decks */
		for (j = 0; j < numDecks; j++) {
			for (i = 0; i < 52; i++) {
				suit = i % 4 + 1;
				number = i % 13 + 1;
				cards.push(new Card(suit, number));
			}
		}
	};
	/* Create those new cards. */
	newCards();

	/** Shuffles the cards. Modifies the private instance of the cards array.
	 * @returns {Array} An array of Cards representing the shuffled version of the deck.
	 */
	this.shuffle = function () {
		for (var j, x, i = cards.length; i; j = parseInt(Math.random() * i), x = cards[--i], cards[i] = cards[j], cards[j] = x);
		return cards;
	};
	/** @returns {Array} An array of cards representing the Deck. */
	this.getCards = function () {
		return cards;
	};
	/** @returns {Card} Deals the top card off the deck. Removes it from the Deck. */
	this.deal = function () {
		if (cards.length < Math.floor((numDecks * 52) * 0.25)) { // TODO: add penetration parameter into consideration. Now spiked at 25%
			console.log("Ran out of cards, new deck");
			newCards();
			this.shuffle();
		}
		return cards.pop();
	};
};
