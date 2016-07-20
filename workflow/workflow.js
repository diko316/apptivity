'use strict';

var Definition = require('./definition.js');

function create(definition) {
    
}


function Workflow(definition) {
    
}

Workflow.prototype = {
    constructor: Workflow
};





var definition = new Definition();

definition.
    link('start', 'end').
    link('start', ['action3', 'action4']).
    link(['action3', 'action4'], 'end');
    
    
    
console.log(definition.states);