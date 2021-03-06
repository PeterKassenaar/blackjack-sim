/**
 * Created by PeterKassenaar on 24/04/15.
 */
(function () {
	'use strict';

	angular.module('bjSim')
		.config(myRoutes);

	myRoutes.$inject = ['$routeProvider'];
	function myRoutes($routeProvider) {
		$routeProvider
			.when('/', {
				templateUrl  : 'views/home.html',
				controller   : 'homeController',
				controllerAs : 'vm'
			})
			.when('/play', {
				templateUrl  : 'views/play.html',
				controller   : 'playController',
				controllerAs : 'vm'
			})
			.when('/simulate', {
				templateUrl  : 'views/simulate.html',
				controller   : 'simController',
				controllerAs : 'vm'
			})
			.when('/details', {
				templateUrl  : 'views/details.html',
				controller   : 'detailController',
				controllerAs : 'vm'
			})
			.when('/charts/:id', {
				templateUrl  : 'views/charts.html',
				controller   : 'chartController',
				controllerAs : 'vm'
			})
			.when('/about', {
				templateUrl : 'views/about.html'
			})
			.otherwise({redirectTo : '/'});
	}

})();