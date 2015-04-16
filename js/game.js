/**
 * @author Scott Carroll (original: https://github.com/scottux/BlackJack)
 * @author Peter Kassenaar (fork: https://github.com/PeterKassenaar/blackjack-sim)
 */

/** Play BLACKJACK! */
var BlackJack = (function ($) {
	/********************/
	/* initialization & variables */
	/********************/
	/* Set up our Game's Deck */
	var deck;

	/** Holds your Hand */
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

	/* win/lose ratio */
	var wins = 0;
	var losses = 0;
	var ties = 0;
	var playerBlackjacks = 0;
	var dealerBlackjacks = 0;

	/* playerAmount & bets */
	var playerAmount = 1000;
	var betSize = 50;
	var units = playerAmount / betSize;
	var handsPlayed = 0;
	var isDoubled = false;

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
		isDoubled = false;
		playerAmount = 1000; // TODO: read dynamically
		betSize = 50; // TODO: read dynamically
		handsPlayed = 0;
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
	var doubleDown = function () {
		betSize *= 2;
		isDoubled = true;
	};

	/** Double down only allowed on first two cards
	 * @returns {bool} true if doubling down is allowed
	 * @param hand
	 * */
	var canDouble = function (hand) {
		return hand.getHand().length === 2;
	};

	/** Tally the score to determine the outcome. */
	var declareWinner = function (userHand, dealerHand) {
		var outcome = '',
			dealerScore = dealerHand.score(),
			userScore = userHand.score(),
			userHasBlackjack = checkBlackjack(userHand),
			dealerHasBlackjack = checkBlackjack(dealerHand);

		/* I didn't make the rules, I just enforce them. */
		if (userHasBlackjack && !dealerHasBlackjack) {
			outcome = "You win: Blackjack!";
			wins++;
			playerBlackjacks++;
			playerAmount += 1.5 * betSize;

		} else if (dealerHasBlackjack && !userHasBlackjack) {
			outcome = "You lose: dealer has blackjack!";
			losses++;
			dealerBlackjacks++;
			playerAmount -= betSize;
		} else if (dealerHasBlackjack && userHasBlackjack) {
			outcome = "Tie: you both have blackjack!";
			ties++;
			dealerBlackjacks++;
			playerBlackjacks++;
		}
		else if (userScore > 21 || dealerScore === 21) {
			outcome = "You lose!";
			losses++;
			playerAmount -= betSize;
		} else if (dealerScore > 21 || userScore === 21 || userScore > dealerScore) {
			outcome = "You win!";
			wins++;
			playerAmount += betSize;
		} else if (dealerScore > userScore) {
			outcome = "You lose!";
			losses++;
			playerAmount -= betSize;
		} else if (dealerScore === userScore) {
			outcome = "You tied!";
			ties++;
		}
		/* Output the result of the round. */
		handsPlayed++;
		return outcome + "<br />Dealer: " + dealerHand.score() + "<br />You: " + userScore;
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
	 *  - uses the chart in basicStrategy.js
	 */
	var autoPlayBasicStrategy = function () {
		var rowNumber = 0;	// Total of own card
		var colNumber = 0;	// Dealers up card
		var decision = '';
		var yourScore;

		colNumber = dealerHand.score() - 2;// mapping to chart in basicStrategy.js
		while (true) {
			//  TODO: Further implement basic strategy chart / decisions here.
			// 1. check for 21 or higher
			if (yourHand.score() >= 21) {
				$standButton.trigger('click');
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
					doubleDown();
					yourHand.hitMe();
					$standButton.trigger('click');
					break;
				} else {
					yourHand.hitMe();
				}
			}
			else if (decision === 'S' || decision === 'DS') {
				$standButton.trigger('click');
				break;
			}
			else if (decision === 'P') {
				// TODO: implent splitting. For now: Hit
				yourHand.hitMe();
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
		// reset flag isDoubled prior to dealing if necessary
		if (isDoubled) {
			betSize /= 2;
			isDoubled = false;
		}
		$doubleButton.show();
		yourHand = new Hand(deck, 2); // PK: two cards for the player
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

	/* Stand Button */
	$standButton.on('click', function () {
		// Only play dealer hand if you're not busted
		var playerHasBlackjack = checkBlackjack(yourHand);
		if (playerHasBlackjack || yourHand.score() <= 21) {
			dealDealerHand(playerHasBlackjack);
		}
		$yourHand.html(declareWinner(yourHand, dealerHand));// PK: Compare hands
		showDeal();
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

	/* Auto Play button */
	$autoPlayButton.on('click', function () {
		console.clear();
		var numHands = $('#numAutoPlayHands').val();
		$resetButton.trigger('click');
		for (var i = 0; i < numHands; i++) {
			// reset hand and trigger new deal
			console.info('New hand: # ' + i);
			// reset flag isDoubled prior to dealing if necessary
			if (isDoubled) {
				betSize /= 2;
				isDoubled = false;
			}
			yourHand = new Hand(deck, 2); // PK: two cards for the player
			dealerHand = new Hand(deck, 1); //PK: one card for the dealer.
			// check if user must stand or hit. Pick a strategy by (un)commenting.
			 //autoPlayWithoutStrategy();
			autoPlayBasicStrategy(); // HIER VERDER!
		}
		console.group('stats');
		console.log('num Hands: ', numHands);
		console.log('num wins: ', wins);
		console.log('num losses: ', losses);
		console.log('num ties: ', ties);
		console.log('hands played: ', handsPlayed);
		console.log('num player blackjacks: ', playerBlackjacks);
		console.log('num dealer blackjacks: ', dealerBlackjacks);
		console.groupEnd('stats');
	});

}(jQuery));