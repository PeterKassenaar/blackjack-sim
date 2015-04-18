/**
 * @author Peter Kassenaar (fork: https://github.com/PeterKassenaar/blackjack-sim)
 * @author Scott Carroll (original: https://github.com/scottux/BlackJack)
 */

/** Play BLACKJACK! */
var BlackJack = (function ($) {
	/********************/
	/* initialization & variables */
	/********************/
	/* Set up our Game's Deck */
	var deck;

	/** Holds all hands (including splitted hands) */
	var hands = [];
	var numSplitHands = 0;

	/** Holds your current Hand */
	var yourHand;

	/** Holds dealer Hand */
	var dealerHand;

	/* CACHE SELECTORS!!! */
	var $hitButton = $("#hitMe"),
		$standButton = $("#stand"),
		$doubleButton = $("#double"),
		$dealButton = $("#deal"),
		$resetButton = $('#reset'),
		$autoPlayButton = $('#autoPlay'),
		$score = $("#yourScore"),
		$yourHand = $('#yourHand'),
		$dealerHand = $('#dealerHand'),
		$betSize = $('#betSize'),
		$playerAmount = $('#playerAmount'),
		$handsPlayed = $('#handsPlayed');

	/* win/lose ratio and other statistics */
	var wins = 0;
	var losses = 0;
	var ties = 0;
	var playerBlackjacks = 0;
	var dealerBlackjacks = 0;
	var winPercentage = 0;
	var losePercentage = 0;

	/* playerAmount & bets */
	var playerAmount = 1000;
	var minPlayerAmount = playerAmount;
	var maxPlayerAmount = playerAmount;
	var betSize = 50;
	var units = playerAmount / betSize;
	var handsPlayed = 0;
	var isSplitted = false;

	/********************/
	/* Functions below here */
	/********************/
	/* Re-initialize the game */
	var init = function () {
		deck = new Deck($('#numDecks').val() || 6); // find the requested number of decks. Default: six decks
		wins = 0;
		losses = 0;
		ties = 0;
		playerBlackjacks = 0;
		dealerBlackjacks = 0;
		isSplitted = false;
		playerAmount = 1000; // TODO: read dynamically
		minPlayerAmount = playerAmount;
		maxPlayerAmount = playerAmount;
		betSize = 50; // TODO: read dynamically
		handsPlayed = 0;
		numSplitHands = 0;
		winPercentage = 0;
		losePercentage = 0;
		/* Make sure to shuffle at the start of the game. */
		deck.shuffle();
	};
	init();

	/** Check if player or dealer has blackjack (==21 w/ only two cards)
	 * @Returns {bool} true if the hand is a blackjack, false if not.
	 */
	var checkBlackjack = function (hand) {
		return ((hand.getHand().length === 2) && (hand.score() === 21));
	};

	/** Calculate percentage of value 1 from value 2 and return
	 * percentage, rounded to 1 decimal.
	 * @param val1, the smallest value
	 * @param val2, the bigges value (from which the percentage is requested)
	 * @returns {number} percentage, rounded to 1 decimal.
	 */
	var toPercentage = function (val1, val2) {
		return Math.round((( val1 / val2) * 100) * 10) / 10;
	};

	/** Check if the hand has a pair (2,2, 3,3, 4,4 etc.).
	 * @returns {bool} true is the hand is a pair, false if not
	 * @param hand
	 */
	var checkPair = function (hand) {
		if (!hand.getHand().length === 2) {
			return false;
		} else {
			var currentHand = hand.getHand();
			if (currentHand[0].getValue() === currentHand[1].getValue()) {
				return true;
			}
		}
		return false;
	};

	/** Double down your bet */
	//var doubleDown = function () {
	//	betSize *= 2;
	//	isDoubled = true;
	//};

	/** Double down only allowed on first two cards
	 * @returns {bool} true if doubling down is allowed
	 * @param hand
	 * */
	var canDouble = function (hand) {
		return hand.getHand().length === 2;
	};

	/** stand a hand. Called from AutoPlay
	 *
	 */
	var stand = function () {
		// Only play dealer hand if you're not busted
		var dealerHasToPlay = false;
		var playerHasBlackjack = false;
		if (isSplitted) {
			hands.shift(); // hand was splitted. Remove first hand (w/ the pair) from hands[]
		}
		for (var i = 0; i < hands.length; i++) {
			yourHand = hands[i];
			playerHasBlackjack = (hands.length === 1 && checkBlackjack(yourHand));
			if (playerHasBlackjack || yourHand.score() <= 21) {
				dealerHasToPlay = true;
				break; // if dealer has to play, break no matter what.
			}
		}
		if (dealerHasToPlay) {
			dealDealerHand(playerHasBlackjack);
		}
		declareWinner(hands, dealerHand);// Compare hands and declare a winner per hand
	};

	/** Tally the score to determine the outcome. */
	var declareWinner = function (yourHands, dealerHand) {
		for (var i = 0; i < yourHands.length; i++) {
			var outcome = '',
				result = '',
				yourHand = yourHands[i],
				dealerScore = dealerHand.score(),
				userScore = yourHand.score(),
				userHasBlackjack = checkBlackjack(yourHand),
				dealerHasBlackjack = checkBlackjack(dealerHand);

			/* I didn't make the rules, I just enforce them. */
			if (userHasBlackjack && !dealerHasBlackjack) {
				outcome = "You win: Blackjack!";
				wins++;
				playerBlackjacks++;
				playerAmount += 1.5 * yourHand.betSize();
			} else if (dealerHasBlackjack && !userHasBlackjack) {
				outcome = "You lose: dealer has blackjack!";
				losses++;
				dealerBlackjacks++;
				playerAmount -= yourHand.betSize();
			} else if (dealerHasBlackjack && userHasBlackjack) {
				outcome = "Tie: you both have blackjack!";
				ties++;
				dealerBlackjacks++;
				playerBlackjacks++;
			}
			else if (userScore > 21 || dealerScore === 21) {
				outcome = "You lose!";
				losses++;
				playerAmount -= yourHand.betSize();
			} else if (dealerScore > 21 || userScore === 21 || userScore > dealerScore) {
				outcome = "You win!";
				wins++;
				playerAmount += yourHand.betSize();
			} else if (dealerScore > userScore) {
				outcome = "You lose!";
				losses++;
				playerAmount -= yourHand.betSize();
			} else if (dealerScore === userScore) {
				outcome = "You tied!";
				ties++;
			}
			result += outcome + "<br />Dealer: " + dealerHand.score() + "<br />You: " + userScore;
			/* Output the result of the round. */
		}
		// record stats and return resul
		hands = []; // reset hands.
		if (playerAmount > maxPlayerAmount) {
			maxPlayerAmount = playerAmount;
		}
		if (playerAmount < minPlayerAmount) {
			minPlayerAmount = playerAmount;
		}
		handsPlayed++;
		return result;
	};

	/** Deal cards for the dealer. No strategy, Dealer must stand on 17 */
	var dealDealerHand = function (playerHasBlackjack) {
		var dealerHasTenOrAce = (dealerHand.score() === 10 || dealerHand.score() === 11);
		if (playerHasBlackjack && dealerHasTenOrAce) {
			dealerHand.hitMe(); // hit once to see if dealer also gets a blackjack
			if (checkBlackjack(dealerHand)) {
				updateUI();
				console.log('dealers score: Blackjack! ');
			}
		} else {
			while (dealerHand.score() < 17) { // Stand on soft 17
				dealerHand.hitMe();
				updateUI();
				console.log('dealers score: ', dealerHand.score());
			}
		}
	};

	/** Split current hand into two seperate hands. It contains a pair.
	 * @param yourHand
	 */
	var splitHand = function (yourHand) {
		var currentHand = yourHand.getHand(); // currentHand now holds array w/ the pair.
		hands.push(new Hand(deck, null, betSize, currentHand[0]));
		hands.push(new Hand(deck, null, betSize, currentHand[1]));
	};

	/** autoPlay without any strategy.
	 * - Hit if you're under 17 and dealer has strong upcard
	 * - Stand if you're over 12 and dealer has weak upcard
	 */
	var autoPlayWithoutStrategy = function () {
		var dealerScore = dealerHand.score();
		if (dealerScore >= 7) {
			if (yourHand.score() >= 17) {
				$standButton.trigger('click')
			} else {
				while (yourHand.score() <= 17) {
					yourHand.hitMe();
				}
				$standButton.trigger('click');
			}
		}
		else if (dealerScore < 7) {
			if (yourHand.score() >= 12) {
				$standButton.trigger('click')
			} else {
				while (yourHand.score() <= 12) {
					yourHand.hitMe();
				}
				$standButton.trigger('click');
			}
		}
	};

	/** autoPlay with Basic strategy, without doubling or splitting
	 *  - uses the chart in basicStrategyChart.js
	 */
	var autoPlayBasicStrategy = function () {
		var rowNumber = 0;	// Total of own card
		var colNumber = 0;	// Dealers up card
		var decision = '';
		var yourScore;

		colNumber = dealerHand.score() - 2;// mapping to chart in basicStrategyChart.js
		while (true) {
			//  TODO: Further implement basic strategy chart / decisions here.
			// 1. check for 21 or higher
			if (yourHand.score() >= 21) {
				break;
			}

			// 2. Calculate rowNumber to pick from (mapping)
			if (yourHand.getHand().length === 2 && checkPair(yourHand)) {
				switch (yourHand.score()) {
					case 4:
					{//2,2
						rowNumber = 26;
						break;
					}
					case 6:
					{	// 3,3
						rowNumber = 27;
						break;
					}
					case 8:
					{	// 4,4
						rowNumber = 28;
						break;
					}
					case 10:
					{	// 5,5
						rowNumber = 29;
						break;
					}
					case 12: // TODO: a pair of sixes and a pair of aces both return 12!
					{	// 6,6
						rowNumber = 30;
						break;
					}
					case 14:
					{	// 7,7
						rowNumber = 31;
						break;
					}
					case 16:
					{	// 8,8
						rowNumber = 32;
						break;
					}
					case 18:
					{	// 9,9
						rowNumber = 33;
						break;
					}
					case 20:
					{	// T,T
						rowNumber = 34;
						break;
					}
					default :
						break;
				}
				// TODO: account for Soft Hands. Not done yet!
			} else {
				// Hard hand.
				rowNumber = yourHand.score() - 5;
			}
			// 3. Pick from basic strategy chart
			decision = strategyChart[rowNumber][colNumber];

			// 4. Read out decision to make
			if (decision === 'H' || decision === 'RH' || decision === 'QH') {
				yourHand.hitMe();
			}
			else if (decision === 'DH') {
				//Double if allowed (only on first two cards), otherwise Hit.
				if (canDouble(yourHand)) {
					yourHand.double();
					yourHand.hitMe();
					break;
				} else {
					yourHand.hitMe();
				}
			}
			else if (decision === 'S' || decision === 'DS') {
				break;
			}
			else if (decision === 'P') {
				// If hand is not splitted, split it. Re-splitting not allowed (=not implemented yet).
				if (!isSplitted) {
					splitHand(yourHand);
					numSplitHands++;
					isSplitted = true;
					break;
				} else {
					// otherwise just hit.
					yourHand.hitMe();
				}
			}
		}
	};

	/** Show the Deal button, hide others. */
	var showDeal = function () {
		$hitButton.hide();
		$standButton.hide();
		$doubleButton.hide();
		$dealButton.show();
	};

	/** Show the control buttons, hide Deal. */
	var showControls = function () {
		$hitButton.show();
		$standButton.show();
		$doubleButton.show();
		$dealButton.hide();
	};

	/** Update your score and card display. */
	var updateUI = function () {
		/* Cards */
		if (yourHand) {
			$yourHand.html(yourHand.toHtml());
			$score.find(".digits").html(yourHand.score());
		}
		if (dealerHand) {
			$dealerHand.html(dealerHand.toHtml());
		}

		/* Score */
		$("#wins").text(wins);
		$("#losses").text(losses);

		/* Statistics */
		$playerAmount.text(playerAmount);
		$betSize.text(betSize);
		$handsPlayed.text(handsPlayed);
	};

	/********************/
	/* event handlers */
	/********************/
	/* Deal Button */
	$dealButton.on('click', function () {
		$doubleButton.show();
		yourHand = new Hand(deck, 2, betSize); // PK: two cards for the player
		dealerHand = new Hand(deck, 1); //PK: one card for the dealer.
		updateUI();
		showControls();
	});

	/* Hit Button */
	$hitButton.on('click', function () {
		// doubling not possible after hitting the first card
		$doubleButton.hide();
		yourHand.hitMe();
		if (yourHand.score() > 21) {
			$standButton.trigger('click');
		} else {
			updateUI();
		}
	});

	/* Reset Button */
	$resetButton.on('click', function () {
		init();
		showDeal();
		updateUI();
		deck.shuffle(); // should not be necessary here.
	});

	/** Double Button.
	 * Double bet size and deal one more card. */
	$doubleButton.on('click', function () {
		doubleDown();
		yourHand.hitMe();
		$standButton.trigger('click');
	});

	/* Stand Button */
	$standButton.on('click', function () {
		// Only play dealer hand if you're not busted
		var dealerHasToPlay = false;
		var playerHasBlackjack = false;
		if (isSplitted) {
			hands.shift(); // hand was splitted. Remove first hand (w/ the pair) from hands[]
		}
		for (var i = 0; i < hands.length; i++) {
			yourHand = hands[i];
			playerHasBlackjack = (hands.length === 1 && checkBlackjack(yourHand));
			if (playerHasBlackjack || yourHand.score() <= 21) {
				dealerHasToPlay = true;
				break; // if dealer has to play, break no matter what.
			}
		}
		if (dealerHasToPlay) {
			dealDealerHand(playerHasBlackjack);
		}
		$yourHand.html(declareWinner(hands, dealerHand));// Compare hands and declare a winner per hand
		showDeal();
	});

	/* Auto Play button */
	$autoPlayButton.on('click', function () {
		console.clear();
		console.time('session');
		var numHands = $('#numAutoPlayHands').val();
		$resetButton.trigger('click');
		for (var i = 0; i < numHands; i++) {
			// reset hand and trigger new deal
			console.info('New hand: # ' + i);
			isSplitted = false;
			hands.push(new Hand(deck, 2, betSize)); // New hand for player, two cards.
			dealerHand = new Hand(deck, 1); // One card for dealer.
			//***************************************
			// check if user must stand or hit. Pick a strategy by (un)commenting.
			for (var j = 0; j < hands.length; j++) {
				//autoPlayWithoutStrategy();
				yourHand = hands[j];
				autoPlayBasicStrategy();
			}
			//$standButton.trigger('click');
			stand();
		}
		// calculate and log some derived stats
		winPercentage = toPercentage(wins, numHands); // round to 1 decimal
		losePercentage = toPercentage(losses, numHands);
		console.group('Stats');
		console.log('num Hands: ', numHands);
		console.log('num wins: ', wins, '(', winPercentage, '%)');
		console.log('num losses: ', losses, '(', losePercentage, '%)');
		console.log('num ties: ', ties, '(', toPercentage(ties, numHands), '%)');
		console.log('hands played: ', handsPlayed);
		console.log('num player blackjacks: ', playerBlackjacks, '(', toPercentage(playerBlackjacks, numHands), '%)');
		console.log('num dealer blackjacks: ', dealerBlackjacks, '(', toPercentage(dealerBlackjacks, numHands), '%)');
		console.log('num splitted hands: ', numSplitHands, '(', toPercentage(numSplitHands, numHands), '%)');
		console.groupEnd('Stats');
		// amount of money
		console.group('Amount');
		console.log('max player amount: ', maxPlayerAmount);
		console.log('min player amount: ', minPlayerAmount);
		console.log('current player amount: ', playerAmount);
		console.groupEnd('Amount');
		console.timeEnd('session');
	});
}(jQuery));