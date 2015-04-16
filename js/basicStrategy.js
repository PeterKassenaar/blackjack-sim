/**
 * Created by Peter Kassenaar on 14-4-2015.
 * Credits for table: http://wizardofodds.com/games/blackjack/strategy/calculator/
 * Rules:
 * 		- 6 decks, no surrender. Dealer has no hole card/peek for blackjack. As in most European Casinos (certainly in Holland Casino)
 * 		- Dealer stands on soft 17
 * 		- Double After Split (DAS) allowed
 */
var strategyChart =
	[
		// Position in Array:
		// 0	 1     2     3     4     5     6     7    8     9    10    11

		// Dealer up card:
		// 2     3     4     5     6     7     8     9     T     A    ET    EA

		[ "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H", "RH"],   // Hard  5, row [0]
		[ "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H", "RH"],   // Hard  6, row [1]
		[ "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H", "RH"],   // Hard  7, row [2]
		[ "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H",  "H"],   // Hard  8, row [3]
		[ "H", "DH", "DH", "DH", "DH",  "H",  "H",  "H",  "H",  "H",  "H",  "H"],   // Hard  9, row [4]
		["DH", "DH", "DH", "DH", "DH", "DH", "DH", "DH",  "H",  "H",  "H",  "H"],   // Hard 10, row [5]
		["DH", "DH", "DH", "DH", "DH", "DH", "DH", "DH", "DH",  "H",  "H",  "H"],   // Hard 11, row [6]
		[ "H",  "H",  "S",  "S",  "S",  "H",  "H",  "H",  "H",  "H",  "H", "RH"],   // Hard 12, row [7]
		[ "S",  "S",  "S",  "S",  "S",  "H",  "H",  "H",  "H",  "H",  "H", "RH"],   // Hard 13, row [8]
		[ "S",  "S",  "S",  "S",  "S",  "H",  "H",  "H",  "H",  "H", "RH", "RH"],   // Hard 14, row [9]
		[ "S",  "S",  "S",  "S",  "S",  "H",  "H",  "H", "RH",  "H", "RH", "RH"],   // Hard 15, row [10]
		[ "S",  "S",  "S",  "S",  "S",  "H",  "H", "RH", "RH", "RH", "RH", "RH"],   // Hard 16, row [11]
		[ "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S", "RS"],   // Hard 17, row [12]
		[ "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"],   // Hard 18, row [13]
		[ "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"],   // Hard 19, row [14]
		[ "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"],   // Hard 20, row [15]
		[ "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"],   // Hard 21, row [16]
		[ "H",  "H",  "H", "DH", "DH",  "H",  "H",  "H",  "H",  "H",  "H",  "H"],   // Soft 13, row [17]
		[ "H",  "H",  "H", "DH", "DH",  "H",  "H",  "H",  "H",  "H",  "H",  "H"],   // Soft 14, row [18]
		[ "H",  "H", "DH", "DH", "DH",  "H",  "H",  "H",  "H",  "H",  "H",  "H"],   // Soft 15, row [19]
		[ "H",  "H", "DH", "DH", "DH",  "H",  "H",  "H",  "H",  "H",  "H",  "H"],   // Soft 16, row [20]
		[ "H", "DH", "DH", "DH", "DH",  "H",  "H",  "H",  "H",  "H",  "H",  "H"],   // Soft 17, row [21]
		[ "S", "DS", "DS", "DS", "DS",  "S",  "S",  "H",  "H",  "H",  "H",  "H"],   // Soft 18, row [22]
		[ "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"],   // Soft 19, row [23]
		[ "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"],   // Soft 20, row [24]
		[ "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"],   // Soft 21, row [25]
		["QH", "QH",  "P",  "P",  "P",  "P",  "H",  "H",  "H",  "H",  "H",  "H"],   // 2,2, row [26]
		["QH", "QH",  "P",  "P",  "P",  "P",  "H",  "H",  "H",  "H",  "H", "RH"],   // 3,3, row [27]
		[ "H",  "H",  "H", "QH", "QH",  "H",  "H",  "H",  "H",  "H",  "H",  "H"],   // 4,4, row [28]
		["DH", "DH", "DH", "DH", "DH", "DH", "DH", "DH",  "H",  "H",  "H",  "H"],   // 5,5, row [29]
		["QH",  "P",  "P",  "P",  "P",  "H",  "H",  "H",  "H",  "H",  "H", "RH"],   // 6,6, row [30]
		[ "P",  "P",  "P",  "P",  "P",  "P",  "H",  "H",  "H",  "H", "RH", "RH"],   // 7,7, row [31]
		[ "P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "P", "RH", "RH"],   // 8,8, row [32]
		[ "P",  "P",  "P",  "P",  "P",  "S",  "P",  "P",  "S",  "S",  "S",  "S"],   // 9,9, row [33]
		[ "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S",  "S"],   // T,T, row [34]
		[ "P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "P",  "H"]    // A,A, row [35]
	];

var PlayerHand = [ "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "13", "14", "15", "16", "17", "18", "19", "20", "21", "2,2", "3,3", "4,4", "5,5", "6,6", "7,7", "8,8", "9,9", "10,10", "A,A" ];
