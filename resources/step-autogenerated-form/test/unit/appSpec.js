'use strict';

describe('Step auto generated form', function () {

  var $rootScope, scope, $location, $window, $q, deferedTaskExecution, $httpBackend, createController;

  beforeEach(module('autogeneratedForm'));

  beforeEach(inject(function ($injector, $controller) {

    $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');
    $location = $injector.get('$location');
    $window = $injector.get('$window');
    $httpBackend = $injector.get('$httpBackend');

    scope = $rootScope.$new();

    $httpBackend.expect('GET', '../API/system/session/unusedId').respond([{}]);

    var urlParserMock = {
      getQueryStringParamValue: function () {
        return '1';
      }
    };

    var i18nServiceMock = {
      then: function () {
        scope.i18nLoaded = true;
      }
    };

    var humanTaskAPIMock = {
      get: function(parameters, success, error) {
        return success({id:1});
      }
    };

    var contractSrvcMock = jasmine.createSpyObj('contractSrvc', ['fetchContract', 'executeTask']);
    contractSrvcMock.fetchContract.and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve({data:'{}', status: 200});
      return deferred.promise;
    });
    deferedTaskExecution = $q.defer();
    contractSrvcMock.executeTask.and.callFake(function() {
      return deferedTaskExecution.promise;
    });

    spyOn($window.location, 'assign');
    spyOn($window.parent, 'postMessage');

    createController = function() {
      return $controller('MainCtrl', {
        '$scope': scope,
        'contractSrvc': contractSrvcMock,
        'urlParser': urlParserMock,
        '$window': $window,
        'humanTaskAPI': humanTaskAPIMock,
        'i18nService': i18nServiceMock
      });
    }
  }));

  describe('postMessage', function () {

    var currentWindow;

    var stringifiedJSONArgsMatcher = function(actualArgs, expectedArgs) {
      for (var i= 0; i < actualArgs.length; i++) {
        var argBeforeStringify;
        try {
          argBeforeStringify = JSON.parse(actualArgs[i]);
        } catch (e) {
          argBeforeStringify = actualArgs[i];
        }
        if (!jasmine.matchersUtil.equals(argBeforeStringify, expectedArgs[i])) {
          return false;
        }
      }
      return true;
    };

    beforeEach(function () {
      currentWindow = $window.self;

      createController();
      $httpBackend.flush();
      $rootScope.$digest();
    });

    afterEach(function () {
      $window.self = currentWindow;
    });

    it('should be sent on success', function () {
      jasmine.addCustomEqualityTester(stringifiedJSONArgsMatcher);
      $window.self = null;
      var responseStatus = 204;
      deferedTaskExecution.resolve({data:'', status: responseStatus});

      scope.postData();

      $rootScope.$digest();

      expect($window.parent.postMessage).toHaveBeenCalledWith(jasmine.objectContaining(
        {
          message: 'success',
          status: responseStatus,
          action: 'Submit task',
          targetUrlOnSuccess: '/bonita'
        }), '*');
    });

    it('should be sent on error', function () {
      jasmine.addCustomEqualityTester(stringifiedJSONArgsMatcher);
      $window.self = null;
      var responseStatus = 500;
      deferedTaskExecution.reject({data:'FileTooBigError', status: responseStatus});

      scope.postData();

      $rootScope.$digest();

      expect($window.parent.postMessage).toHaveBeenCalledWith(jasmine.objectContaining(
        {
          message: 'error',
          status: responseStatus,
          action: 'Submit task',
          targetUrlOnSuccess: '/bonita'
        }), '*');
    });

    it('should not be sent if not in an iframe', function () {
      $window.self = $window.parent;

      scope.postData();

      $rootScope.$digest();

      expect($window.parent.postMessage).not.toHaveBeenCalled();
    });
  });
});
