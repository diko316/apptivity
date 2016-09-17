'use strict';

var EXPORTS = require('./parser.js'),
    EXPORTER = require('./export.js');


module.exports = EXPORTS;
EXPORTS.exportFSM = EXPORTER.exportFSM;
EXPORTS.transformerExist = EXPORTER.exist;
EXPORTS.registerTransformer = EXPORTS.register;