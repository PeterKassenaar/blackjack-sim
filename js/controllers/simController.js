(function () {
	'use strict';

	angular.module('bjSim')
		.controller('simController', simController);

	simController.$inject = ['bjService'];
	function simController(bjService) {
		var vm = this;

		// 1. Init: Default values
		vm.betSize = 50;
		vm.numSessions = 30;
		vm.numHands = 100;
		vm.numDecks = 6;
		vm.winPercentageGoal = 20;
		vm.playerStartAmount = 1000;
		vm.units = vm.playerStartAmount / vm.betSize;
		vm.showLoader = false;
		vm.resultsReady = false;
		vm.results = {};
		vm.results.sessionResults = [];
		vm.results.goalsReached = [];
		vm.resultMsg = '';

		// 2. Old method: Setup watcher for # units
		//$scope.$watch('vm.playerStartAmount', updateUnits);
		//$scope.$watch('vm.betSize', updateUnits);
		// 2a. New method: define function on viewmodel
		vm.updateUnits = function () {
			vm.units = Math.floor(vm.playerStartAmount / vm.betSize);
		};

		//********************
		// 3. Capture click and start simulation
		//********************
		vm.simulate = function () {
			// set up games' deck
			var deck;

			// Holds all hands (including splitted hands)
			var hands = [];
			var numSplitHands = 0;

			// Holds your current Hand
			var yourHand;

			// Holds dealer Hand
			var dealerHand;

			// win/lose ratio and other statistics
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
			var sessionTimer, sessionStartTimer, sessionEndTimer;
			var msg = '';

			// playerAmount & bets (local for this function!)
			var playerStartAmount = vm.playerStartAmount;
			var playerAmount = vm.playerStartAmount;
			var minPlayerAmount = vm.playerStartAmount;
			var maxPlayerAmount = vm.playerStartAmount;
			var betSize = vm.betSize;
			var units = vm.units;
			var handsPlayed = 0;
			var isSplitted = false;
			var playerWentBankrupt = false;
			var goalReached = false;
			// (Re)set global Controller values
			vm.resultsReady = false;
			vm.results = {};
			vm.results.sessionResults = [];
			vm.results.goalsReached = [];

			/* Re-initialize the game */
			var init = function () {
				deck = new Deck(vm.numDecks); // find the requested number of decks. Default: six decks
				wins = 0;
				losses = 0;
				ties = 0;
				playerBlackjacks = 0;
				dealerBlackjacks = 0;
				isSplitted = false;
				playerAmount = vm.playerStartAmount;
				minPlayerAmount = vm.playerStartAmount;
				maxPlayerAmount = vm.playerStartAmount;
				playerStartAmount = vm.playerStartAmount;
				betSize = vm.betSize;
				handsPlayed = 0;
				numSplitHands = 0;
				winPercentage = 0;
				losePercentage = 0;
				currentWinningStreak = 0;
				currentLosingStreak = 0;
				maxWinningStreak = 0;
				maxLosingStreak = 0;
				playerWentBankrupt = false;

				/* Make sure to shuffle at the start of the game. */
				deck.shuffle();
			};
			init();

			// Reset sessions-array and stats
			function resetSessions() {
				sessions = [];
			}

			/** Calculate percentage of value 1 from value 2 and return
			 * percentage, rounded to 1 decimal.
			 * @param val1, the smallest value
			 * @param val2, the bigges value (from which the percentage is requested)
			 * @returns {number} percentage, rounded to 1 decimal.
			 */
			var toPercentage = function (val1, val2) {
				return Math.round((( val1 / val2) * 100) * 10) / 10;
			};

			/** Set statistics for winning/losing streak
			 *  @param outcome {string} 'W' for winning hand, 'L' for losing hand
			 */
			// TODO: move to bjService
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

			/** stand a hand. Called from AutoPlay     */
			var stand = function () {
				// Only play dealer hand if you're not busted
				var dealerHasToPlay = false;
				var playerHasBlackjack = false;
				if (isSplitted) {
					hands.shift(); // hand was splitted. Remove first hand (w/ the pair) from hands[]
				}
				for (var i = 0; i < hands.length; i++) {
					yourHand = hands[i];
					playerHasBlackjack = (hands.length === 1 && yourHand.isBlackjack());
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
						userHasBlackjack = yourHand.isBlackjack(),
						dealerHasBlackjack = dealerHand.isBlackjack();

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

			/** Deal cards for the dealer. No strategy, Dealer must stand on all 17s */
			var dealDealerHand = function (playerHasBlackjack) {
				var dealerHasTenOrAce = (dealerHand.score() === 10 || dealerHand.score() === 11);
				if (playerHasBlackjack && dealerHasTenOrAce) {
					dealerHand.hitMe(); // hit once to see if dealer also gets a blackjack
					if (dealerHand.isBlackjack()) {
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
				var colNumber = dealerHand.score() - 2;	// Dealers up card, mapping to chart in basicStrategyChart.js
				var decision = '';

				while (true) {
					// 1. check for 21 or higher
					if (yourHand.score() >= 21) {
						break;
					}

					// 2. Check if hand is a pair and can be splitted.
					if (yourHand.isPair()) {
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
						if (yourHand.canDouble()) {
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

			console.clear();
			console.time('session');
			console.log('session started. Simulating...');
			sessionStartTimer = new Date();
			//*********
			// Play Sessions
			//*********
			resetSessions();
			vm.showLoader = true;
			// Play at least one session
			if (vm.numSessions <= 0) {
				vm.numSessions = 1;
			}
			for (var k = 0; k < vm.numSessions; k++) {
				console.log('***Currently playing: session #', k);
				init();
				// *********
				// Play Hands
				//*********
				for (var i = 0; i < vm.numHands; i++) {
					// 1. Reset hand and trigger new deal
					isSplitted = false;
					hands.push(new Hand(deck, 2, betSize)); // New hand for player, two cards.
					dealerHand = new Hand(deck, 1); // One card for dealer.

					// 2. Check if user must stand or hit. Pick a strategy by (un)commenting.
					for (var j = 0; j < hands.length; j++) {
						yourHand = hands[j];
						//autoPlayWithoutStrategy();
						autoPlayBasicStrategy();
					}
					stand();
					// 3. Check if winPercentage goal is reached
					winPercentage = toPercentage((playerAmount - playerStartAmount), playerStartAmount); // round to 1 decimal
					if (winPercentage >= vm.winPercentageGoal) {
						goalReached = true;
						playerWentBankrupt = false;
						break;
					}
					// 4. Check if player went bankrupt
					else if (playerAmount <= 0) {
						playerWentBankrupt = true;
						goalReached = false;
						break;

					} else {
						// 5. Move on, nothing to see here.
						playerWentBankrupt = false;
						goalReached = false;
					}
				} // end for()
				sessionEndTimer = new Date();
				sessionTimer = sessionStartTimer - sessionEndTimer;
				// calculate and log some derived stats
				winPercentage = toPercentage(wins, vm.numHands); // round to 1 decimal
				losePercentage = toPercentage(losses, vm.numHands);
				console.group('Stats');
				msg = 'num Hands: ' + vm.numHands;
				vm.resultMsg += msg + '\n';
				console.log(msg);
				msg = 'num wins: ' + wins + '(' + winPercentage + '%)';
				vm.resultMsg += msg + '\n';
				console.log(msg);
				console.log('num losses: ', losses, '(', losePercentage, '%)');
				console.log('num ties: ', ties, '(', toPercentage(ties, vm.numHands), '%)');
				console.log('hands played: ', handsPlayed);
				console.log('num player blackjacks: ', playerBlackjacks, '(', toPercentage(playerBlackjacks, vm.numHands), '%)');
				console.log('num dealer blackjacks: ', dealerBlackjacks, '(', toPercentage(dealerBlackjacks, vm.numHands), '%)');
				console.log('num splitted hands: ', numSplitHands, '(', toPercentage(numSplitHands, vm.numHands), '%)');
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
				var currentSession = new Session(vm.numHands, playerStartAmount, betSize, wins, losses,
					playerBlackjacks, dealerBlackjacks, numSplitHands,
					playerWentBankrupt, vm.winPercentageGoal, goalReached, handsPlayed,
					maxWinningStreak, maxLosingStreak,
					maxPlayerAmount, minPlayerAmount, playerAmount, sessionTimer);
				// store played session in array
				sessions.push(currentSession);
				if (goalReached) {
					console.log('Goal Reached: ** YES ** , after ', handsPlayed, ' hands played.');
				}
				// Store session in results-object
				vm.results.sessionResults.push(currentSession);
			}
			console.log('Stats from sessions: ', sessions);
			// more stats. TODO: make dynamic, report in UI instead of console
			var numBankrupts = 0,
				numGoalReached = 0,
				thisGoal = {};
			for (var m = 0; m < sessions.length; m += 1) {
				if (sessions[m].bankrupt) {
					numBankrupts += 1;
				}
				//if (toPercentage((sessions[m].maxPlayerAmount - parseInt(sessions[m].bankroll)), sessions[m].bankroll) >= sessions[m].goal) {
				if (sessions[m].goalReached) {
					thisGoal.goal = 'YES';
					console.log(m, ': Goal: ** YES ** , after ', sessions[m].handsPlayed, ' hands played.');
					numGoalReached += 1;
				} else {
					thisGoal.goal = 'NO';
					console.log(m, ': Goal: ** NO ** , played ', sessions[m].handsPlayed, ' hands.');
				}
				thisGoal.sessionNumber = m;
				thisGoal.handsPlayed = sessions[m].handsPlayed;
				vm.results.goalsReached.push(thisGoal);
			} // end for()
			console.log('Num bankrupts:', numBankrupts, '(', toPercentage(numBankrupts, vm.numSessions), '%)');
			console.log('Num win percentage goals reached:', numGoalReached, '(', toPercentage(numGoalReached, vm.numSessions), '%)');
			vm.results.bankrupts = {
				numBankrupts       : numBankrupts,
				bankruptPercentage : toPercentage(numBankrupts, vm.numSessions)
			};
			vm.results.goalsReached = {
				numGoalsReached           : numGoalReached,
				numGoalsReachedPercentage : toPercentage(numGoalReached, vm.numSessions)
			};
			vm.showLoader = false;
			vm.resultsReady = true;
		}; // end vm.simulate()
	}// end simController()
})();