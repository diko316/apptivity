'use strict';

var ACTIVITY_GEN_ID = 0,
    ACTIVITIES = {};
var END;

function get(id) {
    var list = ACTIVITIES;
    return list.hasOwnProperty(id) ? list[id] : null;
}

function create(type, name) {
    if (!type || typeof type !== 'string') {
        throw new Error('invalid [type] parameter');
    }
    if (!name || typeof name !== 'string') {
        throw new Error('invalid [name] parameter');
    }
    return new Activity(type, name);
}

function Activity(type, name) {
    var id = type + (++ACTIVITY_GEN_ID);
    ACTIVITIES[id] = this;
    this.type = type;
    this.id = id;
    this.name = name;
    this.desc = id + '[' + name + ']';
    
}


Activity.prototype = {
    id: void(0),
    type: 'action',
    name: void(0),
    desc: void(0),
    descriptions: void(0),
    options: void(0),
    guard: void(0),
    guardName: void(0),
    handler: void(0),
    next: null,
    constructor: Activity
};

//END = create('end');
//END.type = 'end';

module.exports = get;
get.create = create;
get.end = END;
