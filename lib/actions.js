'use strict';
var fs = require('fs');
var path = require('path');
var workspace = require('loopback-workspace');
var Workspace = workspace.models.Workspace;

var actions = exports;

// All actions defined in this file should be called with `this` pointing
// to a generator instance

/**
 * Decide where to create the project, possibly asking the user,
 * and set the generator environment so that everything is generated
 * in the target directory.
 */
actions.configureDestinationDir = function() {
  var self = this;
  if (this.options.nested && this.options.projectDir) {
    // no-op when called from `yo loopback:example`
    return;
  }

  if (this.appname === path.basename(this.destinationRoot())) {
    // When the project name is the same as the current directory,
    // we are assuming the user has already created the project dir
    return;
  }

  var done = this.async();
  this.prompt([
    {
      name: 'dir',
      message: 'Enter name of the directory to contain the project:',
      default: this.appname
    }
  ], function(answers) {
    var dir = answers.dir;
    self.dir = dir;
    if (!dir || dir === '.') return done();

    var root = path.join(this.destinationRoot(), dir);
    if (!fs.existsSync(root)) {
      this.log.create(dir + '/');
      fs.mkdirSync(root);
    }
    this.destinationRoot(root);
    this.log.info('change the working directory to %s', dir);
    this.log();
    done();
  }.bind(this));
};

/**
 * Initialize the workspace to use the destination root as WORKSPACE_DIR.
 */
actions.initWorkspace = function() {
  if (this.options.nested && this.options.projectDir) {
    this._externalProject = true;
    this.projectDir = this.options.projectDir;
    return true;
  }

  this.projectDir = this.destinationRoot();
  process.env.WORKSPACE_DIR = this.projectDir;

  return false;
};

/**
 * Load the project in `this.destinationRoot()`.
 * Set `this.projectDir`.
 * @async
 */
actions.loadProject = function() {
  if (actions.initWorkspace.call(this))
    return;

  var done = this.async();
  Workspace.isValidDir(done);
};

/**
 * Save the current project, update all project files.
 */
actions.saveProject = function() {
  if (this._externalProject) {
    return;
  }

  // no-op in workspace 3.0
};

/**
 * Load all models of the current project.
 * `this.projectModels` will contain an array of all models (Array.<Model>)
 * `this.modelNames` will contain an array of names (Array.<string>)
 */
actions.loadModels = function() {
  var done = this.async();
  workspace.models.ModelDefinition.find(function(err, results) {
    if (err) return done(err);
    this.projectModels = results;
    this.modelNames = results.map(function(m) {
      return m.name;
    });
    done();
  }.bind(this));
};

/**
 * Install npm dependencies, unless the option "skip-install" is enabled.
 */
actions.installDeps = function() {
  this._skipInstall = this.options['skip-install'];

  // Workaround for sync/async inconsistency of the yeoman API
  var done = this._skipInstall ? function(){} : this.async();

  this.installDependencies({
    npm: true,
    bower: false,
    skipInstall: this._skipInstall,
    callback: done
  });
};

/**
 * Load all data sources of the current project
 * `this.dataSources` will contain an array of data sources
 */
actions.loadDataSources = function () {
  var self = this;
  var done = self.async();

  workspace.models.DataSourceDefinition.find(function (err, results) {
    if (err) {
      return done(err);
    }
    self.dataSources = results.map(function (ds) {
      return {
        name: ds.name + ' (' + ds.connector + ')',
        value: ds.name,
        _connector: ds.connector
      };
    });
    done();
  });
};

/**
 * Modify the list of datasources created by {@link loadDataSources}
 * and prepend an item for `null` datasource.
 */
actions.addNullDataSourceItem = function() {
  this.dataSources.unshift({
    name: '(no data-source)',
    value: null
  });
};
