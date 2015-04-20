/**
 * Created by Peter Kassenaar on 19-4-2015.
 */
/** An object holding the statistics for one played session of XX-hands with given betsize and goal
 *
 * @param maxNumhands
 * @param bankroll
 * @param betSize
 * @param wins
 * @param losses
 * @param playerBlackjacks
 * @param dealerBlackjacks
 * @param splitHands
 * @param bankrupt
 * @param goal
 * @param goalReached
 * @param handsPlayed
 * @param maxPlayerAmount
 * @param minPlayerAmount
 * @param endPlayerAmount
 * @constructor
 */
var Session = function (maxNumhands, bankroll, betSize, wins, losses,
						playerBlackjacks, dealerBlackjacks, splitHands, bankrupt,
						goal, goalReached, handsPlayed,
						maxPlayerAmount, minPlayerAmount, endPlayerAmount) {
	this.maxNumhands = maxNumhands;
	this.bankroll = bankroll;
	this.betSize = betSize;
	this.units = Math.floor(bankroll / betSize);
	this.wins = wins;
	this.winPercentage = Math.round((( wins / handsPlayed) * 100) * 10) / 10;
	this.losses = losses;
	this.losePercentage = Math.round((( losses / handsPlayed) * 100) * 10) / 10;
	this.playerBlackjacks = playerBlackjacks;
	this.dealerBlackjacks = dealerBlackjacks;
	this.splitHands = splitHands;
	this.splitHandPercentage = Math.round((( splitHands / handsPlayed) * 100) * 10) / 10;
	this.bankrupt = bankrupt;
	this.goal = goal;
	this.goalReached = goalReached;
	this.handsPlayed = handsPlayed;
	this.maxPlayerAmount = maxPlayerAmount;
	this.minPlayerAmount = minPlayerAmount;
	this.endPlayerAmount = endPlayerAmount;
};