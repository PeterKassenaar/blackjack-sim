/**
 * Created by PeterKassenaar on 24/04/15.
 */
(function(){
    'use strict';

    angular.module('bjSim')
		.controller('detailController', detailController);

	detailController.$inject=['bjService'];
	function detailController(bjService){
		var vm=this;
		// load current sessions from service
		vm.sessions = bjService.getSessions();
		vm.sessionResult = bjService.sessionResult(true); // getter


	}

})();