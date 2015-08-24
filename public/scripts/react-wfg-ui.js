/* Initial state as an example how WGS world is defined */
var INITIAL_STATE = {
  wolf: {name: "wolf", side:"left"},
  goat: {name: "goat", side:"left"},
  salad: {name: "salad", side:"left"},
  rower:"left",
  notification: "Initial state"
}

function complementSide(side) {
  return side === 'left' ? 'right' : 'left';
}

function newSideWhenPicking(thingSide, rowerSide) {
  if(thingSide === 'boat') {
    return rowerSide;
  }
  if(thingSide === rowerSide) {
    return 'boat';
  }
  return thingSide;
}


var stateConstraints = (function() {
  return {
    isSafe: function(state) {
      if(state.wolf.side === state.goat.side && state.rower !== state.wolf.side && state.wolf.side !== 'boat') {
        return false;
      }
      if(state.goat.side === state.salad.side && state.rower !== state.goat.side && state.goat.side !== 'boat') {
        return false;
      }
      return true;
    }
  };
})();

/* This one is used to create _representations_ from state */
var stateRepresenter = (function () {

  // It'a a kreator for array representations of state
  var kreator = (function(side, state) {
    var arr = [];
    var addIfOnSide = function(thing) {
      if(thing.side === side) {
        arr.push(thing);
      }
    }
    return {
      kreate: function() {
        addIfOnSide(state.wolf);
        addIfOnSide(state.goat)
        addIfOnSide(state.salad)
        return arr;
      }
    };
  });

  return {
    left: function(state) {
      return kreator("left", state).kreate();
    },
    right: function(state) {
      return kreator("right", state).kreate();
    },
    inBoat: function(state) {
      return kreator("boat", state).kreate();
    },
    rower: function(state) {
      return state.rower;
    },
    boatIsFull: function(state) {
      return kreator("boat", state).kreate().length === 1;
    },
    stateIsFinished: function(state) {
      return kreator("right", state).kreate().length === 3;
    }
  };
})();


var stateTransformations = (function() {
  return {
    pickToBoat: function(state, thingName) {
      var newPosition = newSideWhenPicking(state[thingName].side, state.rower);
      if(stateRepresenter.boatIsFull(state) && newPosition === 'boat') {
        // Boat is already full
        newPosition = state[thingName].side;
      }

      var stub = React.addons.update(state, {notification: {$set: "Took " + thingName + " to " + newPosition}});
      stub[thingName].side = newPosition;
      return stub;
    },
    rowToOtherSide: function(state) {
      // Just switch side of the rower
      var notification = "Rowed " + state.rower + " -> " + complementSide(state.rower);
      return React.addons.update(state, {rower: {$apply:
                                                 function(side) {
                                                   return complementSide(side);
                                                 } },
                                         notification: {$set: notification}});
    }
  };
})();

// Really really simple publish-subscribe module
// TODO: separate and test
var pubsub = (function() {
  var events = {};

  return {
    subscribe: function(id, listener) {
      if(events[id] == null) {
        events[id] = [listener];
      } else {
        events[id].push(listener);
      }
      console.log("Added listener to " + id + " has " + events[id].length + " listeners");
    },
    publish: function(id, data) {
      if(events[id] == null) {
        console.log("No listeners for " + id);
      }
      for(i = 0; i < events[id].length; i++) {
        events[id][i](data);
      }
    }
  };
})();


var WFGWorld = React.createClass({
  selectToBoat: function(thing) {
    this.setState(stateTransformations.pickToBoat(this.state, thing.name), function() {
        if(stateRepresenter.stateIsFinished(this.state)) {
          alert("Wupee!");
        }
    });
  },
  rowToOtherSide: function() {
    var newState = stateTransformations.rowToOtherSide(this.state);
    if(stateConstraints.isSafe(newState)) {
      this.setState(newState);
    } else {
      alert("That is not safe move!");
    }
  },
  getInitialState: function() {
    return INITIAL_STATE;
  },
  componentDidMount: function() {
    pubsub.subscribe("SELECT_TO_BOAT", this.selectToBoat);
    pubsub.subscribe("SWITCH_SIDE", this.rowToOtherSide);
  },
  render: function() {
    var inside = [];
    return (
      <div>
        <div>{this.state.notification}</div>
        <Boat side={stateRepresenter.rower(this.state)} inside={stateRepresenter.inBoat(this.state)}/>
        <RiverBank side="left" things={stateRepresenter.left(this.state)}/>
        <div className="container river"></div>
        <RiverBank side="right" things={stateRepresenter.right(this.state)}/>
      </div>
    );
  }
});

var RiverBank = React.createClass({
  render: function() {
    var classNames = 'container ' + this.props.side;
    return (
      <div className={classNames}>
        <h1>{this.props.side} river bank</h1>
        <div>
          {this.props.things.map(function(thing, i) {
            return (
              <Thing type={thing} key={i}/>
            )
          }, this)}
        </div>
      </div>
    );
  },
});

var Thing = React.createClass({
  handleClick: function() {
    pubsub.publish("SELECT_TO_BOAT", this.props.type);
  },
  render: function() {
    var classes = 'thing ' + this.props.type.name;
    return (<div onClick={this.handleClick} className={classes}></div>)
  }
});

var Boat = React.createClass({
  handleRowClick: function() {
    pubsub.publish("SWITCH_SIDE");
  },
  render: function() {
    var classes = "boat " + this.props.side;
    return (
      <div className={classes}>
        <button onClick={this.handleRowClick}>Row</button>
        {this.props.inside.map(function(thing, i) {
          return (<Thing type={thing} key={i}/>);
        })}
      </div>
    );
  }
});

React.render(
  <WFGWorld/>,
  document.getElementById('container')
);
