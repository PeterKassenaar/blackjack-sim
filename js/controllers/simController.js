(function () {
    'use strict';

    angular.module('bjSim')
        .controller('simController', simController);

    simController.$inject = ['bjService', '$timeout'];
    function simController(bjService, $timeout) {
        var vm = this;

        // 1. Init: Default values
        function init() {
            vm.betSize = 50;
            vm.numSessions = 30;
            vm.numHands = 100;
            vm.numDecks = 6;
            vm.winPercentageGoal = 20;
            vm.playerStartAmount = 1000;
            vm.units = vm.playerStartAmount / vm.betSize;
            vm.resultsReady = false;
            vm.showSpinner = false;
            vm.numTotalHands = 0;
            vm.resultMsg = '';
            vm.sessionGoalReached = '';
            vm.numBankrupts = '';
            vm.numGoalsReached = 0;
            vm.numGoalsReachedPercentage = 0;
            vm.numBankrupts = 0;
            vm.bankruptPercentage = 0;
            // load details from previous session, if present
            showSessionResults();
        }

        init();

        // 2. Old method: Setup watcher for # units
        //$scope.$watch('vm.playerStartAmount', updateUnits);
        //$scope.$watch('vm.betSize', updateUnits);
        // 2a. New method: define function on viewmodel
        vm.updateUnits = function () {
            vm.units = Math.floor(vm.playerStartAmount / vm.betSize);
        };

        // 2b. Hide results if Num Sessions or %winning is changed
        vm.changeNumSessions = function () {
            vm.resultsReady = false;
        };
        vm.changePercentage = function () {
            vm.resultsReady = false;
        };

        //********************
        // 3. Kick-off: Capture click and start simulation
        //********************
        vm.startSimulate = function () {
            // show loading indicator for at least 1 second.
            // wrap it in a $timeout, to give Angular a change to
            // update $digest cycle and paint canvas
            // prior to simulating (== local process. Otherwise spinner can't be shown).
            vm.showSpinner = true;
            vm.resultsReady = false;
            vm.numTotalHands = vm.numSessions * vm.numHands;
            $timeout(function () {
                simulate();
                showSessionResults();
                vm.showSpinner = false;
            }, 1000);
        };


        /////////////////////////////////////////////////////////////
        var simulate = function () {
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
            vm.resultsReady = false;

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
                playerWentBankrupt = false;

                /* Make sure to shuffle at the start of the game. */
                deck.shuffle();
            };
            init();

            /** stand a hand. Called from AutoPlay     */
            var stand = function () {
                // Only play dealer hand if you're not busted
                var dealerHasToPlay = false;
                var playerHasBlackjack = false;
                var result = {};
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
                    dealerHand = bjService.dealDealerHand(dealerHand, playerHasBlackjack);
                }
                // Declare a winner per hand and record the results.
                for (i = 0; i < hands.length; i++) {
                    yourHand = hands[i];
                    result = bjService.declareWinner(yourHand, dealerHand);// Compare hands and declare a winner per hand
                    if (result.win) {
                        wins += 1;
                    }
                    if (result.lose) {
                        losses += 1;
                    }
                    if (result.tie) {
                        ties += 1;
                    }
                    if (result.dealerBlackjack) {
                        dealerBlackjacks += 1;
                    }
                    if (result.playerBlackjack) {
                        playerBlackjacks += 1;
                    }
                    playerAmount += result.playerAmount;
                }
                // record stats
                if (playerAmount > maxPlayerAmount) {
                    maxPlayerAmount = playerAmount;
                }
                if (playerAmount < minPlayerAmount) {
                    minPlayerAmount = playerAmount;
                }
                hands = []; // reset hands.
                handsPlayed += 1;
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
                            {   //2,2
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
                        // Stand
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
            //*********
            // Play Sessions
            //*********
            bjService.resetSessions();
            // Play at least one session
            if (vm.numSessions <= 0) {
                vm.numSessions = 1;
            }
            for (var k = 0; k < vm.numSessions; k++) {
                console.log('***Currently playing: session #', k);
                sessionStartTimer = new Date();
                init();
                // **************************
                // Play Hands in this session
                //*************************
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
                    winPercentage = bjService.toPercentage((playerAmount - playerStartAmount), playerStartAmount); // round to 1 decimal
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
                sessionTimer = sessionEndTimer - sessionStartTimer;
                // calculate and log some derived stats
                winPercentage = bjService.toPercentage(wins, handsPlayed); // round to 1 decimal
                losePercentage = bjService.toPercentage(losses, handsPlayed);
                console.group('Stats');
                msg = 'num Hands: ' + vm.numHands;
                vm.resultMsg += msg + '\n';
                console.log(msg);
                msg = 'num wins: ' + wins + '(' + winPercentage + '%)';
                vm.resultMsg += msg + '\n';
                console.log(msg);
                console.log('num losses: ', losses, '(', losePercentage, '%)');
                console.log('num ties: ', ties, '(', bjService.toPercentage(ties, vm.numHands), '%)');
                console.log('hands played: ', handsPlayed);
                console.log('num player blackjacks: ', playerBlackjacks, '(', bjService.toPercentage(playerBlackjacks, vm.numHands), '%)');
                console.log('num dealer blackjacks: ', dealerBlackjacks, '(', bjService.toPercentage(dealerBlackjacks, vm.numHands), '%)');
                console.log('num splitted hands: ', numSplitHands, '(', bjService.toPercentage(numSplitHands, vm.numHands), '%)');
                console.groupEnd('Stats');
                // amount of money
                console.group('Amount');
                console.log('max player amount: ', maxPlayerAmount);
                console.log('min player amount: ', minPlayerAmount);
                console.log('current player amount: ', playerAmount);
                console.log('max Winning Streak: ', bjService.getWinningStreak());
                console.log('max Losing Streak: ', bjService.getLosingStreak());
                console.groupEnd('Amount');
                console.timeEnd('session');
                // Store session in object
                var currentSession = new Session(vm.numHands, playerStartAmount, betSize, wins, losses,
                    playerBlackjacks, dealerBlackjacks, numSplitHands,
                    playerWentBankrupt, vm.winPercentageGoal, goalReached, handsPlayed,
                    bjService.getWinningStreak(), bjService.getLosingStreak(),
                    maxPlayerAmount, minPlayerAmount, playerAmount, sessionTimer);
                // store played session in array via Service
                bjService.addSession(currentSession);
                bjService.initStreak(); // reset winning/losing streak for session.
                if (goalReached) {
                    console.log('Goal Reached: ** YES ** , after ', handsPlayed, ' hands played.');
                }
            }
            console.log('Stats from sessions, via bjService:');
            // Store session results via Service
            bjService.sessionResult();
        }; // end vm.simulate()

        //********************
        // 4. Clear results  & reset
        //********************
        vm.clear = function () {
            bjService.resetSessions();
            init();
        };

        //********************
        // 5. Show SessionResults
        //********************
        function showSessionResults() {
            var sessionResult = bjService.sessionResult(true); // getter
            if (sessionResult.numSessions) {
                vm.numGoalsReached = sessionResult.goalsReached.numGoalsReached;
                vm.numGoalsReachedPercentage = sessionResult.goalsReached.numGoalsReachedPercentage;
                vm.numBankrupts = sessionResult.bankrupts.numBankrupts;
                vm.bankruptPercentage = sessionResult.bankrupts.bankruptPercentage;
                vm.resultsReady = true;
            }
        }
    }
})();