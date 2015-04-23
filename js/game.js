/**
 * @author Peter Kassenaar (fork: https://github.com/PeterKassenaar/blackjack-sim)
 * @author Scott Carroll (original: https://github.com/scottux/BlackJack)
 */

/** Play BLACKJACK! */
var BlackJack = (function ($) {
	/********************/
	/* initialization & variables */
	/********************/
	/* Input for the various simulations */
	var numSessions = 30;		 	// TODO: Make numSessions dynamic
	var numHands = 100;				// TODO: make dynamic
	var numDecks = 6;
	var winPercentageGoal = 20; 	// TODO: Make winPercentageGoal dynamic
	var playerAmount = 1000; 		// TODO: make playerAmount dynamic
	var betSize = 50;				// TODO: make betSize dynamic

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
	var $autoPlayButton = $('#autoPlay');

	/* win/lose ratio and other statistics */
	var wins = 0;
	var losses = 0;
	var ties = 0;
	var playerBlackjacks = 0;
	var dealerBlackjacks = 0;
	var winPercentage = 0;
	var losePercentage = 0;
	var sessions = [];
	var currentStreak = 0;
	var maxWinningStreak = 0;
	var currentWinningStreak = 0;
	var maxLosingStreak = 0;
	var currentLosingStreak = 0;

	/* playerAmount & bets */
	var playerStartAmount = playerAmount;
	var minPlayerAmount = playerAmount;
	var maxPlayerAmount = playerAmount;
	var units = playerAmount / betSize;
	var handsPlayed = 0;
	var isSplitted = false;

	/********************/
	/* Functions below here */
	/********************/
	/* Re-initialize the game */
	var init = function () {
		deck = new Deck(numDecks); // find the requested number of decks. Default: six decks
		wins = 0;
		losses = 0;
		ties = 0;
		playerBlackjacks = 0;
		dealerBlackjacks = 0;
		isSplitted = false;
		playerAmount = 1000; // TODO: read playerAmount dynamically
		minPlayerAmount = playerAmount;
		maxPlayerAmount = playerAmount;
		playerStartAmount = playerAmount;
		betSize = 50; // TODO: read betSize dynamically
		handsPlayed = 0;
		numSplitHands = 0;
		winPercentage = 0;
		losePercentage = 0;
		currentWinningStreak = 0;
		currentLosingStreak = 0;
		maxWinningStreak = 0;
		maxLosingStreak = 0;

		/* Make sure to shuffle at the start of the game. */
		deck.shuffle();
	};
	init();

	/** Reset sessions-array and stats */
	function resetSessions () {
		sessions = [];
		numSessions = 30; // TODO read numSessions dynamically
	}

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

	/** Double down only allowed on first two cards
	 * @returns {bool} true if doubling down is allowed
	 * @param hand
	 * */
	var canDouble = function (hand) {
		return hand.getHand().length === 2;
	};

	/** Set statistics for winning/losing streak
	 *  @param outcome {string} 'W' for winning hand, 'L' for losing hand
	 */
	var setStreak = function (outcome) {
		if (outcome === 'W') {
			// 1. Hand won
			if (currentLosingStreak > 0) {
				currentLosingStreak = 0;
			}
			currentWinningStreak += 1;
			if (maxWinningStreak < currentWinningStreak) {
				maxWinningStreak = currentWinningStreak;
			}
		} else if (outcome === 'L') {
			// 2 .Hand Lost
			if (currentWinningStreak > 0) {
				currentWinningStreak = 0;
			}
			currentLosingStreak += 1;
			if (maxLosingStreak < currentLosingStreak) {
				maxLosingStreak = currentLosingStreak;
			}
		}
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
				wins += 1;
				playerBlackjacks += 1;
				playerAmount += 1.5 * yourHand.betSize();
				setStreak('W');
			} else if (dealerHasBlackjack && !userHasBlackjack) {
				outcome = "You lose: dealer has blackjack!";
				losses += 1;
				dealerBlackjacks += 1;
				playerAmount -= yourHand.betSize();
				setStreak('L');
			} else if (dealerHasBlackjack && userHasBlackjack) {
				outcome = "Tie: you both have blackjack!";
				ties += 1;
				dealerBlackjacks += 1;
				playerBlackjacks += 1;
			}
			else if (userScore > 21 || dealerScore === 21) {
				outcome = "You lose!";
				losses += 1;
				playerAmount -= yourHand.betSize();
				setStreak('L');
			} else if (dealerScore > 21 || userScore === 21 || userScore > dealerScore) {
				outcome = "You win!";
				wins += 1;
				playerAmount += yourHand.betSize();
				setStreak('W');
			} else if (dealerScore > userScore) {
				outcome = "You lose!";
				losses += 1;
				playerAmount -= yourHand.betSize();
				setStreak('L');
			} else if (dealerScore === userScore) {
				outcome = "You tied!";
				ties += 1;
			}
			result += outcome + "<br />Dealer: " + dealerHand.score() + "<br />You: " + userScore;
		}
		// record stats and return resul
		hands = []; // reset hands.
		if (playerAmount > maxPlayerAmount) {
			maxPlayerAmount = playerAmount;
		}
		if (playerAmount < minPlayerAmount) {
			minPlayerAmount = playerAmount;
		}
		handsPlayed += 1;
		return result;
	};

	/** Deal cards for the dealer. No strategy, Dealer must stand on 17 */
	var dealDealerHand = function (playerHasBlackjack) {
		var dealerHasTenOrAce = (dealerHand.score() === 10 || dealerHand.score() === 11);
		if (playerHasBlackjack && dealerHasTenOrAce) {
			dealerHand.hitMe(); // hit once to see if dealer also gets a blackjack
			if (checkBlackjack(dealerHand)) {
				//console.log('dealers score: Blackjack! ');
			}
		} else {
			while (dealerHand.score() < 17) { // Stand on soft 17
				dealerHand.hitMe();
				//console.log('dealers score: ', dealerHand.score());
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

	/** autoPlay without (almost) any strategy.
	 * - Hit if you're under 17 and dealer has strong upcard
	 * - Stand if you're over 12 and dealer has weak upcard
	 */
	var autoPlayWithoutStrategy = function () {
		var dealerScore = dealerHand.score();
		if (dealerScore >= 7) {
			if (yourHand.score() >= 17) {
				stand();
			} else {
				while (yourHand.score() <= 17) {
					yourHand.hitMe();
				}
				stand();
			}
		}
		else if (dealerScore < 7) {
			if (yourHand.score() >= 12) {
				stand();
			} else {
				while (yourHand.score() <= 12) {
					yourHand.hitMe();
				}
				stand();
			}
		}
	};

	/** autoPlay/simulate with Basic strategy
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

			// 2. Check if hand is a pair and can be splitted.
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
					case 12:
					{	// 6,6 or A,A
						if (yourHand.isPairOfAces()) {
							rowNumber = 35;
						} else {
							rowNumber = 30;
						}
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

			// 3. Check if hand is a soft hand and adjust row number according to Basic Strategy Table
			if (yourHand.isSoftHand()) {
				//console.log ('soft hand!: ', yourHand);
				rowNumber = yourHand.score() + 4;
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

	/********************/
	/* event handlers */
	/********************/

	/* Auto Play button */
	$autoPlayButton.on('click', function () {
		console.clear();
		console.time('session');
		console.log('session started. Simulating...');

		//*********
		// Play Sessions
		//*********
		resetSessions();
		for (var k = 0; k < numSessions; k++) {
			console.log('***Currently playing: session #', k);
			init();
			// *********
			// Play Hands
			//*********
			for (var i = 0; i < numHands; i++) {
				// reset hand and trigger new deal
				// console.info('New hand: # ' + i);
				isSplitted = false;
				hands.push(new Hand(deck, 2, betSize)); // New hand for player, two cards.
				dealerHand = new Hand(deck, 1); // One card for dealer.
				//***************************************
				// check if user must stand or hit. Pick a strategy by (un)commenting.
				for (var j = 0; j < hands.length; j++) {

					yourHand = hands[j];
					//autoPlayWithoutStrategy();
					autoPlayBasicStrategy();
				}
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
			console.log('max Winning Streak: ', maxWinningStreak);
			console.log('max Losing Streak: ', maxLosingStreak);
			console.groupEnd('Amount');
			console.timeEnd('session');
			// Store session in object
			var currentSession = new Session(numHands, playerStartAmount, betSize, wins, losses,
				playerBlackjacks, dealerBlackjacks, numSplitHands,
				(playerAmount <= 0), winPercentageGoal, "unclear", handsPlayed,
				maxWinningStreak,maxLosingStreak,
				maxPlayerAmount, minPlayerAmount, playerAmount);
			// store played session in array
			sessions.push(currentSession);
		}
		console.log('Stats from series: ', sessions);
		// more stats. TODO: make dynamic, pull from console
		var numBankrupts = 0,
			numGoalReached = 0;
		for (var m = 0; m < sessions.length; m++) {
			if (sessions[m].bankrupt) {
				numBankrupts++;
			}
			if (toPercentage((sessions[m].maxPlayerAmount - parseInt(sessions[m].bankroll)), sessions[m].bankroll)
				> sessions[m].goal) {
				numGoalReached++
			}

		}
		console.log('Num bankrupts:', numBankrupts, '(', toPercentage(numBankrupts, numSessions), '%)');
		console.log('Num win percentage goals reached:', numGoalReached, '(', toPercentage(numGoalReached, numSessions), '%)');
	});
}(jQuery));