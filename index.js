'use strict';

//global.Promise = require('bluebird');
//require('./fsm.js');


var define = require('./workflow/index.js');
//var processor = require('./workflow/processor.js');
//var p1, p2;
//p1 = processor('data',
//        function (data) {
//            console.log('processed p1! ', data);
//            return data;
//        });
//p1.name = 'p1';
//
//p2 = p1.spawn('data',
//        function (data) {
//            console.log('processed p2! ', data);
//            return data;
//        });
//p2.name = 'p2';
//
//processor.subscribe('initialize',
//                    function (process) {
//                        
//                        console.log('initialized ', process.name);
//                        if (process.name === 'p1') {
//                            process.kill();
//                            //process.cancel();
//                        }
//                        else {
//                            
//                        }
//                    });
//
//processor.subscribe('success',
//                    function (process) {
//                        console.log('succeeded ', process.name);
//                    });
//
//processor.subscribe('complete',
//                    function (process) {
//                        console.log('completed ', process.name);
//                    });
//
//processor.subscribe('cancel',
//                    function (process) {
//                        console.log('cancelled ', process.name);
//                    });

//var workflow = define('createUser').
//
//        action('requestForm').
//            describe('this is a test').
//            handler(function () {
//                console.log('handler');
//            }).
//            
//        action('render').
//            describe('rendering form').
//            handler(function () {
//                console.log('rendering!');
//            }).
//            
//        condition(
//            define('renderedToHTML').
//                action('renderToHTML'),
//                
//            define('failedRender').
//                action('doNothing')
//        ).
//        
//        finalize();
//
//
//console.log('workflow ', workflow.config);
//
//console.log(require('util').inspect(DEFINE.workflow().constructor.prototype, { showHidden: true }));
//






module.exports = {};

