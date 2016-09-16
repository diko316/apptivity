'use strict';

var EXPORTS = require('./parser.js'),
    EXPORTER = require('./export.js');


module.exports = EXPORTS;
EXPORTS.exportFSM = EXPORTER.exportFSM;
EXPORTS.registerTransformer = EXPORTS.register;