/*global describe, beforeEach, it */
'use strict';
var path = require('path');
var helpers = require('yeoman-generator').test;
var SANDBOX =  path.resolve(__dirname, 'sandbox');
var fs = require('fs');
var expect = require('must');
var common = require('./common');

describe('loopback:model generator', function() {
  beforeEach(common.resetWorkspace);

  beforeEach(function createSandbox(done) {
    helpers.testDirectory(SANDBOX, done);
  });

  beforeEach(function createProject(done) {
    common.createDummyProject(SANDBOX, 'test-app', done);
  });

  it('creates models/{name}.json', function(done) {
    var modelGen = givenModelGenerator(['Product']);
    helpers.mockPrompt(modelGen, {
      dataSource: 'db',
      propertyName: ''
    });

    modelGen.run({}, function() {
      var productJson = path.resolve(SANDBOX, 'models/product.json');
      expect(fs.existsSync(productJson), 'file exists');
      var content = JSON.parse(fs.readFileSync(productJson));
      expect(content).to.have.property('name', 'Product');
      expect(content).to.not.have.property('public');
      done();
    });
  });

  it('adds an entry to rest/models.json', function(done) {
    var modelGen = givenModelGenerator(['Product']);
    helpers.mockPrompt(modelGen, {
      dataSource: 'db',
      public: false,
      propertyName: ''
    });

    var builtinModels = Object.keys(readModelsJsonSync('rest'));
    modelGen.run({}, function() {
      var modelConfig = readModelsJsonSync('rest');
      var newModels = Object.keys(modelConfig);
      var expectedModels = builtinModels.concat(['Product']);
      expect(newModels).to.have.members(expectedModels);
      expect(modelConfig.Product).to.eql({
        dataSource: 'db',
        public: false
      });
      done();
    });
  });

  function givenModelGenerator(modelArgs) {
    var path = '../../model';
    var name = 'loopback:model';
    var deps = [ ['../../property', 'loopback:property'] ];
    var gen = common.createGenerator(name, path, deps, modelArgs, {});
    return gen;
  }

  function readModelsJsonSync(component) {
    var filepath = path.resolve(SANDBOX, component || '.', 'models.json');
    var content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  }
});