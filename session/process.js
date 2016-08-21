'use strict';


function Process(frame, state) {
    this.frame = frame;
    this.session = frame.session;
    this.state = state;
}

Process.prototype = {
    state: void(0),
    frame: void(0),
    session: void(0),
    request: void(0),
    response: void(0),
    constructor: Process
};


module.exports = Process;
