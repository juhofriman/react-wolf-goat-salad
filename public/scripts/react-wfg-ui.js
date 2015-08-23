var state = (function () {
  // This is bit retarded
  var wolf = {name: "wolf", side:"left"};
  var goat = {name: "goat", side:"left"};
  var salad = {name: "salad", side:"left"};
  var rower = "left";

  // It'a a kreator for array representations of state
  var kreator = (function(side) {
    var arr = [];
    var addIfOnSide = function(thing) {
      if(thing.side === side) {
        arr.push(thing);
      }
    }
    return {
      kreate: function() {
        addIfOnSide(wolf);
        addIfOnSide(goat)
        addIfOnSide(salad)
        return arr;
      }
    };
  });

  return {
    left: function() {
      return kreator("left").kreate();
    },
    right: function() {
      return kreator("right").kreate();
    },
    inBoat: function() {
      return kreator("boat").kreate();
    },
    rower: function() {
      return rower;
    },
    rowToOtherSide: function() {
      rower = rower === 'left' ? 'right' : 'left';
      return this;
    },
    selectToBoat: function(thing) {
      if(thing.side === 'boat') {
        thing.side = rower;
      } else if(thing.side === rower) {
        thing.side = "boat";
      }
      return this;
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
    this.setState(state.selectToBoat(thing));
  },
  rowToOtherSide: function() {
    this.setState(state.rowToOtherSide());
  },
  getInitialState: function() {
    return state;
  },
  componentDidMount: function() {
    pubsub.subscribe("SELECT_TO_BOAT", this.selectToBoat);
    pubsub.subscribe("SWITCH_SIDE", this.rowToOtherSide);
  },
  render: function() {
    var inside = [];
    return (
      <div>
        <Boat side={this.state.rower()} inside={this.state.inBoat()}/>
        <RiverBank side="left" things={this.state.left()}/>
        <div className="container river"></div>
        <RiverBank side="right" things={this.state.right()}/>
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
