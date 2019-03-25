/**
 * Created by PeterKassenaar on 24/04/15.
 */
(function () {
	'use strict';

	angular.module('bjSim')
		.controller('playController', playController);

	playController.$inject = ['bjService'];
	function playController(bjService) {
		var vm = this;

		// UI-variables in playController
		vm.btnDoubleDisabled = false;
		vm.btnSplitDisabled = false;
		vm.btnHitDisabled = false;
		vm.btnBetsDisabled = false;
		vm.betSize = 0;
		vm.playerAmount = 1000; // TODO: make dynamic

		// Local variable
		var deck = new Deck(6);
		deck.shuffle();

		// Holds all hands (including splitted hands)
		var hands = [];
		var numSplitHands = 0;

		// Holds your current Hand
		var yourHand;		// local/private
		vm.yourHand = ''; 	// for UI
		vm.yourHandScore = 0;
		vm.playerHasBlackjack = false;

		// Holds dealer Hand
		var dealerHand;		// local/private
		vm.dealerHand = '';	// for UI
		vm.dealerHandScore = 0;

		// win/lose ratio and other statistics
		var wins = 0;
		var losses = 0;
		var ties = 0;
		var playerBlackjacks = 0;
		var dealerBlackjacks = 0;
		var winPercentage = 0;
		var losePercentage = 0;
		var msg = '';

		//*****************
		// UI functions
		//****************

		// Add chip value to bet
		vm.addBet = function (betSize) {
			vm.betSize += parseInt(betSize);
			vm.playerAmount -= parseInt(betSize);
		};

		// Clear/reset bet
		vm.clearBet = function () {
			vm.playerAmount += vm.betSize;
			vm.betSize = 0;
		};

		// Deal new hands.
		vm.deal = function () {
			vm.btnBetsDisabled = true; // no more betting, please.
			yourHand = new Hand(deck, null, vm.betSize);
			dealerHand = new Hand(deck, 1);
			if(yourHand.isBlackjack()){
				vm.playerHasBlackjack = true;
				dealDealerHand(vm.playerHasBlackjack);
			}
			updateUI();
			updateControls();
		};

		// Hit player hand
		vm.hit = function(){
			yourHand.hitMe();
			// check if total >=21
			if(yourHand.score() >= 21){
				dealDealerHand();
			}
			updateUI();
			updateControls();
		};

		// Stand
		vm.stand = function(){
			dealDealerHand(vm.playerHasBlackjack);
			updateUI();
			declareWinner(yourHand, dealerHand);
		};

		// Double
		vm.double = function(){

		};

		// Split
		vm.split = function(){

		};


		//*****************
		// local/private helper functions
		//****************
		function updateUI() {
			vm.yourHand = yourHand.toHtml();
			vm.yourHandScore = yourHand.score();
			vm.dealerHand = dealerHand.toHtml();
			vm.dealerHandScore = dealerHand.score();
		}

		function updateControls() {
			console.log('TODO: update controls...')
		}

		// Deal dealers hand.
		function dealDealerHand(playerHasBlackjack){
			dealerHand = bjService.dealDealerHand(dealerHand, playerHasBlackjack);
		}

		function declareWinner(playerHand, dealerHand){
			var result = bjService.declareWinner(playerHand, dealerHand);
			console.log('result: ', result)
		}

		// Reset UI and variables after hand played.
		function reset(){
			vm.playerHasBlackjack = false;
			vm.btnBetsDisabled = false;
		}
	}// end playController

})();