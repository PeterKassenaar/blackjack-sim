/**
 * Created by PeterKassenaar on 03/05/15.
 */
(function () {
	'use strict';

	angular.module('bjSim')
		.service('bjService', bjService);

	bjService.$inject = [];
	function bjService() {

		// Public API for this service
		this.addSession = addSession;
		this.sessionResult = sessionResult;
		this.getSessions = getSessions;
		this.resetSessions = resetSessions;
		this.streak = streak;
		this.getWinningStreak = getWinningStreak;
		this.getLosingStreak = getLosingStreak;
		this.initStreak = initStreak;
		this.toPercentage = toPercentage;
		this.dealDealerHand = dealDealerHand;
		this.declareWinner = declareWinner;

		//*********************************
		// Implementation details below.
		// Local vars & functions.
		//***************************
		var sessions = [];
		var sessionResults = {};
		var maxWinningStreak = 0;
		var currentWinningStreak = 0;
		var maxLosingStreak = 0;
		var currentLosingStreak = 0;

		// Reset sessions-array and stats
		function resetSessions() {
			sessions = [];
			sessionResults = {};
		}

		function toPercentage(val1, val2) {
			return Math.round((( val1 / val2) * 100) * 10) / 10;
		}

		function addSession(session) {
			sessions.push(session);
		}

		/** sessionResult
		 * store session details in sessions[]
		 * @param getResult {bool} if true, the results are returned instead of setted
		 */
		function sessionResult(getResult) {
			if (!getResult) {
				// SETTER
				// TODO: remove console.logs
				var numBankrupts = 0,
					numGoalReached = 0,
					thisGoal = {};
				for (var m = 0; m < sessions.length; m += 1) {
					if (sessions[m].bankrupt) {
						numBankrupts += 1;
					}
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
				} // end for()
				console.log('Num bankrupts:', numBankrupts, '(', toPercentage(numBankrupts, sessions.length), '%)');
				console.log('Num win percentage goals reached:', numGoalReached, '(', toPercentage(numGoalReached, sessions.length), '%)');
				sessionResults.bankrupts = {
					numBankrupts       : numBankrupts,
					bankruptPercentage : toPercentage(numBankrupts, sessions.length)
				};
				sessionResults.goalsReached = {
					numGoalsReached           : numGoalReached,
					numGoalsReachedPercentage : toPercentage(numGoalReached, sessions.length)
				};
				sessionResults.numSessions = sessions.length;
			} else if (getResult) {
				//GETTER
				return sessionResults;
			}
		}

		function getSessions() {
			return sessions;
		}

		/** Set or get statistics for winning/losing streak
		 *  @param outcome {string} 'W' for winning hand, 'L' for losing hand
		 */
		function streak(outcome) {
			if (outcome) {
				// SETTER: set current streak
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
				} else {
					// GETTER: return current streak
					var streak = {
						type : '',
						num  : 0
					};
					if (currentWinningStreak > 0) {
						streak.type = 'W';
						streak.num = currentWinningStreak;
					} else if (currentLosingStreak > 0) {
						streak.type = 'L';
						streak.num = currentLosingStreak;
					}
					return streak;
				}
			}
		}

		function getWinningStreak() {
			return maxWinningStreak;
		}

		function getLosingStreak() {
			return maxLosingStreak;
		}

		function initStreak() {
			maxWinningStreak = 0;
			currentWinningStreak = 0;
			maxLosingStreak = 0;
			currentLosingStreak = 0;
		}

		/** Deal cards for the dealer. No strategy, Dealer must stand on all 17s */
		function dealDealerHand(dealerHand, playerHasBlackjack) {
			var dealerHasTenOrAce = (dealerHand.score() === 10 || dealerHand.score() === 11);
			if (playerHasBlackjack && dealerHasTenOrAce) {
				dealerHand.hitMe(); // hit once to see if dealer also gets a blackjack
				//console.log('dealers score: Blackjack! ');
			} else {
				while (dealerHand.score() < 17) { // Stand on soft 17
					dealerHand.hitMe();
				}
			}
			return dealerHand;
		}

		/** Tally the score to determine the outcome. */
		function declareWinner(yourHand, dealerHand) {
			var result = { // TODO: put class in global/constant?
				outcome         : '** unknown **',
				win             : false,
				lose            : false,
				tie             : false,
				playerBlackjack : false,
				dealerBlackjack : false,
				playerAmount    : 0
			};

			var dealerScore = dealerHand.score(),
				userScore = yourHand.score(),
				userHasBlackjack = yourHand.isBlackjack(),
				dealerHasBlackjack = dealerHand.isBlackjack();

			/* I didn't make the rules, I just enforce them. */
			if (userHasBlackjack && !dealerHasBlackjack) {
				result.outcome = "You win: Blackjack!";
				result.win = true;
				result.playerBlackjack = true;
				result.playerAmount += 1.5 * yourHand.betSize();
				streak('W');
			} else if (dealerHasBlackjack && !userHasBlackjack) {
				result.outcome = "You lose: dealer has blackjack!";
				result.lose = true;
				result.dealerBlackjack = true;
				result.playerAmount -= yourHand.betSize();
				streak('L');
			} else if (dealerHasBlackjack && userHasBlackjack) {
				result.outcome = "Tie: you both have blackjack!";
				result.tie = true;
				result.dealerBlackjack = true;
				result.playerBlackjack = true;
			}
			else if (userScore > 21 || dealerScore === 21) {
				result.outcome = "You lose!";
				result.lose = true;
				result.playerAmount -= yourHand.betSize();
				streak('L');
			} else if (dealerScore > 21 || userScore === 21 || userScore > dealerScore) {
				result.outcome = "You win!";
				result.win = true;
				result.playerAmount += yourHand.betSize();
				streak('W');
			} else if (dealerScore > userScore) {
				result.outcome = "You lose!";
				result.lose = true;
				result.playerAmount -= yourHand.betSize();
				streak('L');
			} else if (dealerScore === userScore) {
				result.outcome = "You tied!";
				result.tie = true;
			}
			result.outcome += "<br />Dealer: " + dealerHand.score() + "<br />You: " + userScore;
			return result;
		} // end declareWinner();
	}

})();