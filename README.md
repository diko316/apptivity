# apptivity

An activity player that runs actions, conditions, fork, merge and prompt inputs. It also has the ability to monitor state changes and data conversions across the workflow while running.

## Installation

This little library is packaged by npm. Source can be found in https://github.com/diko316/apptivity.git

```sh
npm install apptivity --save
```

## Usage

Require the package and register a workflow.

```javascript
var workflow = require('./index.js');

workflow.create("createUser").
			// create action
			action("fetchFromBackend").
            	describe("fetch something from the backend",
                		"or find something to populate the initial input data",
                        "Remember: [describe], [guard] and [handler] is optional").
				guard(function (input) {
                	return Promise.resolve(input);
                }).
                handler(function (input) {
                	return Ajax.requestAndReturnPromise(input);
                }).
			// your last action
			action("renderAndExit").
            	describe("Nothing special if no [handler]").
                handler(function (data) {
                	return { name: "whatever! your last data will be this" };
                });

```
Run registered workflow. (after the code above)

```javascript
workflow("createUser").
	// register event listener
	on("state-change",
        function (session, data) {
        	console.log("state: ", session.state === data);
            console.log("yes! do something about this immutable [data]");
        }).
	// run the workflow
    run({ name: "first input" });
```

Listen to other workflow sessions running.

```javascript
var stopListening = workflow.subscribe("createUser", "state-change",
								function (session, data) {
                                	console.log("what should I do with this?");
                                });
// I change my mind, I don't have to listen to "createUser" workflow's  "state-change" events
stopListening();
```
> **Note**: You can subscribe anytime even if workflow do not exist.


## API

### workflow(name:*String*):*sessionAPI*

Creates session endpoint object from a registered workflow. The session endpoint object exposes session the following functionalites:

1. **sessionAPI.on(eventName:*String*, handler:*Function*):*sessionAPI***
	Listens to events specific to the current session.

2. **sessionAPI.un(eventName:*String*, handler:*Function*):*sessionAPI***
	Remove listener to events specific to the current session.

3. **sessionAPI.run(inputData:*Mixed*):*Promise***
	Runs the workflow in the current session with the given inputData parameter as request data.

4. **sessionAPI.answer(action:*String*, value:*Mixed*):*sessionAPI***
	Reply to prompts whenever the session encounters input actions.

5. **sessionAPI.get():*Session***
	Reply to prompts whenever the session encounters input actions.

### workflow.create(name:*String*):*Activity*

Creates and registers workflow and returns Activity Object in order chain-define actions. The following are the actions that Activity can configure:

1. **Activity.action(actionName:*String*):*Activity***
	Creates action activity.

2. **Activity.describe(description:*String*, [nextLine:*String*]):*Activity***
	Describes the last defined activity.

3. **Activity.guard([name:*String*], condition:*Function*):*Activity***
	Guards the action from calling its handler if condition parameter returns a rejected Promise. This can also be useful if activity is defined as option for **condition** activity.

4. **Activity.handler(handler:*Function*):*Activity***
	Defines the callback of the action. The returned data or resolved Promise becomes the input of the next action. If action is the last one then it will become the reponse data of the whole activity.
> must have an action defined first before chain-calling **describe()**, **guard()** and **handler()**.

5. **Activity.condition(activiy:*Activty*, [other:*Activity*]):*Activity***
	Runs only the first of its activity parameters that satisfies their guard condition. If none of the guarded activity is satisfied, it will run the unguarded activity as a fallback.
> == more to come, I'm sleepy right now :-( ==


## License

[MIT](https://github.com/primus/eventemitter3/blob/master/LICENSE)
