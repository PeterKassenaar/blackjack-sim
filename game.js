/**
 * @author Scott Carroll (original: https://github.com/scottux/BlackJack)
 * @author Peter Kassenaar (fork: https://github.com/PeterKassenaar/blackjack-sim)
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
/** @constructor */
var Deck = function () {
	var cards = [];
	/** Creates a new set of cards. */
	var newCards = function () {
		var i,
			suit,
			number;
		for (i = 0; i < 52; i++) {
			suit = i % 4 + 1;
			number = i % 13 + 1;
			cards.push(new Card(suit, number));
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
		if (!cards.length) {
			//console.log("Ran out of cards, new deck");
			newCards();
			this.shuffle();
		}
		return cards.pop();
	};
};
/** @constructor */
var Hand = function (deck, numCards) {
	var cards = [];

	/* Deal one or two cards to begin. */
	//cards.push( deck.deal(), deck.deal());
	numCards === 1
		? cards.push(deck.deal())        // PK: one card for de the dealer
		: cards.push(deck.deal(), deck.deal()); // PK: two cards for the player
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
			if (cardVal == 11) {
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
		if (cards.length < 5) {
			cards.push(deck.deal());
		}
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

/** Play BLACKJACK! */
var BlackJack = (function ($) {
	/* Set up our Game's Deck */
	var deck = new Deck();

	/* win/lose ratio */
	var wins = 0;
	var losses = 0;

	/**
	 *  Check if player or dealer has blackjack (==21 w/ only two cards)
	 */
	var checkBlackjack = function (hand) {
		return ((hand.getHand().length === 2)
		&& (hand.score() === 21));
	};

	/** Tally the score to determine the outcome. */
	var declareWinner = function (userHand, dealerHand) {
		var outcome = '',
			dealerScore = dealerHand.score(),
			userScore = userHand.score(),
			userHasBlackjack = checkBlackjack(userHand);
		console.log('user has blackjack: ' + userHasBlackjack);

		/* I didn't make the rules, I just enforce them. */
		if (userScore > 21 || dealerScore === 21) {
			outcome = "You lose!";
			losses++;
		} else if (dealerScore > 21 || userScore === 21 || userScore > dealerHand.score()) {
			outcome = "You win!";
			wins++;
		} else if (dealerScore > userScore) {
			outcome = "You lose!";
			losses++;
		} else if (dealerScore === userScore) {
			outcome = "You tied!";
		}
		/* Output the result of the round. */
		return outcome + "<br />Dealer: " + dealerHand.score() + "<br />You: " + userScore;
	};

	var dealDealerHand = function () {
		while (dealerHand.score() < 17) {
			dealerHand.hitMe();
			updateUI();
			console.log('dealers score: ', dealerHand.score());
		}
	};

	/** Holds your Hand */
	var yourHand;

	/** PK: Holds dealer Hand */
	var dealerHand;

	/* CACHE SELECTORS!!! */
	var $hitButton = $("#hitMe"),
		$standButton = $("#stand"),
		$dealButton = $("#deal"),
		$score = $("#yourScore"),
		$yourHand = $('#yourHand'),
		$dealerHand = $('#dealerHand');

	/** Show the Deal button, hide others. */
	var showDeal = function () {
		$hitButton.hide();
		$standButton.hide();
		//$score.hide();
		$dealButton.show();
	};

	/** Show the control buttons, hide Deal. */
	var showControls = function () {
		$hitButton.show();
		$standButton.show();
		// $score.show();
		$dealButton.hide();
	};

	/** Update your score and card display. */
	var updateUI = function () {
		/* Cards */
		$yourHand.html(yourHand.toHtml());
		$dealerHand.html(dealerHand.toHtml()); // PK: show dealers hand
		/* Score */
		$score.find(".digits").html(yourHand.score());
		$("#wins").text(wins);
		$("#losses").text(losses);
	};

	/* Deal Button */
	$dealButton.on('click', function () {
		yourHand = new Hand(deck, 2); // PK: two cards for the player
		dealerHand = new Hand(deck, 1); //PK: one card for the dealer.
		updateUI();
		showControls();
	});

	/* Hit Button */
	$hitButton.on('click', function () {
		yourHand.hitMe();
		if (yourHand.getHand().length >= 5 || yourHand.score() > 21) {
			$standButton.trigger('click');
		} else {
			updateUI();
		}
	});

	/* Stand Button */
	$standButton.on('click', function () {
		dealDealerHand();
		$yourHand.html(declareWinner(yourHand, dealerHand));// PK: Compare hands
		showDeal();
	});

	/* Make sure to shuffle. */
	deck.shuffle();
}(jQuery));