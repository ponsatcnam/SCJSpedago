// A minimal  SugarCubes V1 directly translated from java

// from "Objets Reactifs en java" . F Boussinot
// and the thesis of Jean Ferdy Susini
// O Pons juillet 2017;

var DEBUG = true;
function debug() {
	if (DEBUG) {
		[].unshift.call(arguments, "DEBUG:");
		console.log.apply(null, arguments)
	}
}

const TERM = Symbol("TERM");
const STOP = Symbol("STOP");
const SUSP = Symbol("SUSP");

//INSTRUCTIONS
class Instruction {
	constructor() {
		this.terminated = false;

	}
	reset() { this.terminated = false }
	terminate() { this.terminated = true }
	isTerminated() { return this.terminated; }
	activation(m) { throw new TypeError("Do not call abstract method activation from child."); }
	activ(m) {
		if (this.terminated) { return TERM; }
		var res = this.activation(m);
		if (res === TERM) { this.terminated = true }
		return res;
	}
	toString(){
		return this.constructor.name
	}

}

/*class UnaryInstruction extends Instruction{
   
	reset(){super.reset();this.body.reset();}
	toString(){
	return this.construtor.name+"("+body.toString()+")";
	}
}


class BinaryInstruction extends Instruction{
	reset(){
	super.reset();
	this.left.reset();
	this.right.reset();
	}
	toString(){
	return this.construtor.name+"("+left.toString()+","+right.toString()+")";
	}
}*/


class Machine {
	constructor() {
		this.program = new Merge();
		this.eventEnv = new EventEnv();
		this.instant = 1;
		this.endOfInstant = false;
		this.move = false;
		this.pendding = [];


	}

	currentInstant() { return this.instant; }
	newMove() { this.move = true; }
	isEndOfInstant() { return this.endOfInstant; }

	add(inst) {
		this.pendding.push(inst);
		//this.program = new Merge(this.program,inst);
		//this.terminated=false;
		//this.newMove();
	}

	getEvent(name) {
		return this.eventEnv.getEvent(name);
	}

	isGenerated(name) {
		return this.eventEnv.getEvent(name).isPresent(this);

	}


	generate(name) {
		this.eventEnv.getEvent(name).generate(this);
	}

	/*    putEvent(name,event){
		this.eventEnv.put(name,event);
		}*/

	react() {
          //console.log("debut react");
	  for(var p of this.pendding){
		  this.program.add(p);
	  }
	  this.pendding=[];
		this.endOfInstant = false;
		this.move = false;
		var res=TERM;
		while ((res=this.program.activ(this)) == SUSP) {

			if (this.move) {
			  this.move = false
			  //console.log("machine reactivate", res);
			  } else { this.endOfInstant = true }

		}
		this.instant++;

                //console.log("fin react");
		return res!==TERM;
		//debug(this.instant);
	}
}

//INSTRUCTIONS DE BASE
class Nothing extends Instruction {
	activation(m) { return TERM; }
}

class Stop extends Instruction {
	activation(m) {
	  	//console.log("activ stop");
	  	this.terminate();
		return STOP;
	  }
}

class Seq extends Instruction {
	constructor() {
		super();
		this.seq = [];
		for (var p of arguments) {
			this.seq.push(p);
		}
		this.idx = 0;
	}
	reset(){
		super.reset();
		for (var p of this.seq) {
			p.reset();
		}
		this.idx = 0;
	}
	activation(m) {
		//console.log("active seq");
		var res = TERM;
		if (this.idx >= this.seq.length) {
		  	this.terminate();
			//console.log("fin active seq brutale");
		  	return TERM;
		}
		while ((this.idx < this.seq.length)
			&& (TERM === (res = this.seq[this.idx].activ(m)))) {
			this.idx++;
		}
		//console.log("fin active seq", res);
		return res;
	}
	toString(){
		return this.constructor.name;
	}
}


class Merge extends Instruction {
	constructor() {
		super();
		this.branches = [];
		for (var p of arguments) {
			this.branches.push({ status: SUSP, inst: p });
		}
	}
	add(p) {
	  	this.branches.push({ status: SUSP, inst: p });
	}
	reset() {
		super.reset();
		for (var b of this.branches) {
			b.status = SUSP;
			b.inst.reset();
		}
	}
	/*
	activation(m) {
		var res = TERM;
		for (var b of this.branches) {
			if (SUSP === b.status) {
				b.status = b.inst.activ(m);
			}
			if (SUSP === b.status) {
				res = SUSP;
			}
			else if (TERM === res && STOP == b.status) {
				res = STOP;
			}
		}
		if (TERM === res) {
			for (var b of this.branches) {
				if (TERM !== b.status) {
					throw new Error("c'est pas bon");
				}
			}
		}
		if (STOP === res) {
		  //console.log("on STOP le Merge");
			for (var b of this.branches) {
				if (STOP === b.status) {
					b.status = SUSP;
				}
			}
		}
		return res;
	}
	*/
	activation(m) {
		var res = TERM;
		//console.log("debut merge");
		for (var b of this.branches) {
			if (SUSP === b.status) {
			 	//console.log("merge activ branch...");
				b.status = b.inst.activ(m);
			}
		}
		for (var i=0; i < this.branches.length; i++) {
		  	b= this.branches[i];
			if (TERM !== b.status) break
			if(i==this.branches.length-1){
			  //console.log("fin merge TERM");
			  return TERM
			  }
		}
		for (var b of this.branches) {
			if ( SUSP === b.status){
			  //console.log("fin merge SUSP");
			  return SUSP
			}
		}
		for (var b of this.branches) {
			b.status=SUSP
		}
		//console.log("fin merge STOP");
		return STOP
		   
	}

}


class Atom extends Instruction {
	action(m) { }
	activation(m) {
		this.action(m);
		return TERM;
	}
}


class PrintAtom extends Atom {

	constructor(msg) {
		super();
		this.msg = msg;
	}

	action(m) {
		console.log(this.msg);
	}
}


class ActionAtom extends Atom {

	constructor() {
		super();
		this.code = arguments;
	}

	action(m) {
		var f = this.code[0];
		f.apply(null, (Array.prototype.slice.call(this.code, 1)));
	}
}

//boucles

class Loop extends Instruction {
	constructor(body) {
		super();
		this.body = body;
	}
	reset() {
		super.reset();
		this.body.reset();
	}
	activation(m) {
		var res = this.body.activ(m);
		if (res != TERM) {
			return res;
		}
		this.body.reset();
		return STOP;
	}
}




class Repeat extends Instruction {
	constructor(n, body) {
		super();
		this.body = body;
		this.num = n;
		this.counter = n;
	}
	reset() {
		super.reset();
		this.body.reset();
		this.counter = this.num;

	}
	activation(m) {
		var res = this.body.activ(m);
		if (res == TERM) {
			this.counter--;
			this.body.reset();
			return this.counter ? STOP : TERM
		}
		return res;
	}
}


// EVENTS
////////
const PRESENT = Symbol("PRESENT");
const ABSENT = Symbol("ABSENT");
const UNKNOWN = Symbol("UNKNOWN");


class Event {
	constructor(name) {
		this.name = name;
		this.generated = 0;
	}
	generate(m) {
		this.generated = m.currentInstant();
	}
	isPresent(m) {
		return this.generated == m.currentInstant();
	}
	presence(m) {
		if (this.isPresent(m)) { return PRESENT; }
		if (m.endOfInstant) { return ABSENT; }
		return UNKNOWN;
	}
}


// The environment
class EventEnv {
	constructor() {
		this.eventEnv = {};
	}
	getEvent(name) {
		var e = this.eventEnv[name];
		if (e === undefined) {
			//never fails
			debug("new event " + name + " created");
			this.eventEnv[name] = e = new Event(name);
		}
		return e;
	}
}

//configuration
// abstract class just to remember that configuration should have 2 methode
class Config {
	fixed(m) { throw new TypeError("Do not call abstract method fixed from child."); }
	evaluate(m) { throw new TypeError("Do not call abstract method evaluate from child."); }
}


//configuration Unuaires
/*class UnaryConfig extends Config {

	name() {
		return this.eventName
	}
	event(m) {
		return m.getEvent(this.eventName);
	}
	fixed(m) {
		return this.event(m).presence(m) != UNKNOWN;
	}
}*/

class PosConfig extends Config {
	constructor(name) {
		super();
		this.eventName = name
	}

	evaluate(m) {
		return this.event(m).isPresent(machine);
	}
	name() {
		return this.eventName
	}
	event(m) {
		return m.getEvent(this.eventName);
	}
	fixed(m) {
		return this.event(m).presence(m) != UNKNOWN;
	}
}



/*class NegConfig extends UnaryConfig {
	constructor(name) {
		super();
		this.eventName = name;
	}

	evaluate(m) {
		return !event(m).isPresent(machine);
	}
}*/

//configuration binaires

/*class BinaryConfig {
	constructor(c1, c2) {
		this.c1 = c1; this.c2 = c2;
	}
}*/


class AndConfig extends Config {
	constructor() {
		this.configs = [];
		for (var c of arguments) {
			this.configs.push(c);
		}

	}
	fixed(m) {
		var fix=false;
		res=true;
		for(var c of this.configs){
		  fix=fix || (c.fixed(m) && !c.evaluate(m));
		  res=res && c.fixed(m);
		}
		return res || fix;
	}

	evaluate(m) {
		var res=true;
		for(var c of this.configs){
		  res=res && c.evaluate(m);
		}
		return res;
	}
}


class OrConfig extends Config {
	constructor() {
		this.configs = [];
		for (var c of arguments) {
			this.configs.push(c);
		}

	}
	/** La disjunction est fixée  des qu'un element est fixé et evalué a true,
	 l'autre n'a pas besoin d'etre evalué */
	fixed(m) {
		var fix=false;
		res=true;
		for(var c of this.configs){
		  fix=fix || (c.fixed(m) && c.evaluate(m));
		  res=res && c.fixed(m);
		}
		return res || fix;
	}

	evaluate(m) {
		var res=false;
		for(var c of this.configs){
		  res=res || c.evaluate(m);
		}
		return res;
	}
}


//Instruction Evénementielles
class Generate extends Atom {
	constructor(name) {
		super();
		this.eventName = name;
	}
	action(m) {
		var event = m.getEvent(this.eventName);
		m.newMove();
		event.generate(m);
	}
}

//control par un evenement 
class Control extends Instruction {
	constructor(name, body) {
		super();
		this.eventName = name;
		this.body = body;
	}
	reset(){super.reset();this.body.reset();}
	activation(m) {
		var event = m.getEvent(this.eventName);
		//	debug("LOG",this.eventName,"PRESENCE ?",event.presence(m))
		switch (event.presence(m)) {
			case PRESENT: return this.body.activ(machine);
			case ABSENT: return STOP;
			default: return SUSP;
		}
	}

}

class Await extends Instruction {
	constructor(configOrName) { //name ou config
		super();
		this.config = (configOrName instanceof Config) ?
			configOrName :
			new PosConfig(configOrName);
	}

	activation(m) {
		if (!this.config.fixed(m)) { return SUSP };
		if (!this.config.evaluate(m)) { return STOP };
		this.terminate();
		return TERM;

	}
}

class Until extends Instruction {
	constructor(config, body, handler) {
		super();
		this.config = config;
		this.body = body;
		this.handler = (handler || new Nothing());
		this.activHandle = false,
		this.resumeBody = true;
	}
	reset() {
		super.reset();
		this.body.reset();
		this.handler.reset();
		this.activHandle = false,
		this.resumeBody = true;
	}
	activation(m) {
		if (this.activHandle) {
		  return this.handler.activ(m);
		  }
		if (this.resumeBody) {
			var res = this.body.activ(m);
			if (res != STOP) { return res; }
			this.resumeBody = false;
		}
		if (!this.config.fixed(m)) { return SUSP }
		if (this.config.evaluate(m)) {
			this.activHandle = true;
			return STOP;
		}
		this.resumeBody = true;
		return STOP;
	}

}

//Test de configuration
class When extends Instruction {
	constructor(config, cthen, celse) {
		super();
		this.config = config;
		this.cthen = cthen;
		this.celse = celse;
		this.confEvaluated = false;
		this.value=false;
	}
	reset() {
		super.reset();
		this.cthen.reset();
		this.celse.reset();
		this.confEvaluated = false;
	}
	activation(m) {
		if (!this.confEvaluated) {
			if (!this.config.fixed(m)) { return SUSP; }
			this.value= this.config.evaluate(m);
			this.confEvaluated = true;
			if (m.isEndOfInstant()) return STOP;
		}
		return this.value ? this.cthen.activ(m) : this.celse.activ(m);
	}

}

class Reset extends Instruction {
	constructor(config, body) {
		super();
		this.config = config;
		this.body = body;
		this.resumeBody = true;
	}
	reset() {
		super.reset();
		this.body.reset();
		this.resumeBody = true;
	}
	activation(m) {
		if (this.resumeBody) {
			var res = this.body.activ(m);
			if (res != STOP) { return res; }
			this.resumeBody = false;
		}
		if (!this.config.fixed(m)) { return SUSP }
		if (this.config.evaluate(m)) {
			this.body.reset();
		}
		this.resumeBody = true;
		return STOP;
	}

}

//Evenement Local
/*class EventDecl extends UnaryInstruction{
	constructor(name,inst){
	super();
	this.internalName=name;
	this.internal=new Event(name);
	this.body=inst;
	}
	reset(){
	super.reset();
	this.internal=new Event(this.internalName);
	}
	activation(m){
	var save=m.getEvent(this.internalName);
	m.putEvent(this.internalName,this.internal);
	var res=this.body.activ(m);
	m.putEvent(this.internalName,save);
	return res;
	}
}*/


//Instruction Evénementielles
//////////////////////////////


///TESTS
/////////
var machine = new Machine(10);
//test sans boucle
var inst = [
   new PrintAtom("Hello World !"),
   new Seq(new PrintAtom("Hello"), new Stop(), new PrintAtom("World!")),
   new Seq(new PrintAtom("Hello"), new Stop(), new Stop(), new PrintAtom("World!")),
   new Seq(new PrintAtom("Hello"), new Stop(), new Stop(), new Stop(), new PrintAtom("World!")),
   new Merge(new PrintAtom("Hello"), new PrintAtom("World!")),
   new Seq(
	new Merge(
		new Seq(new Stop(), new PrintAtom("left")),
		new PrintAtom("right")),
	new PrintAtom("end of inst")),
   new Loop(new Seq(new PrintAtom("Hello World!"), new Stop())),
   new Repeat(3, new Seq(new PrintAtom("Hello World!"), new Stop())),
   new Merge(new Loop(new Seq(new PrintAtom("Hello World!"), new Stop())),
	new Repeat(5, new PrintAtom("second branche"))),
   new Merge(
		new Merge(
			new Seq(new Await("Hello2"), new PrintAtom("Hello internal World!"))
			, new Seq(new Stop(), new Generate("Hello2"))
		)
	, new Seq(new Generate("Hello"), new Seq(new Stop(), new Seq(new Await("Hello"),
		new PrintAtom("Hello exterior World !"))
	))),
new Merge(
		new Control("Tick",
			new Seq(new PrintAtom("Hello ")
				, new Seq(new Stop(), new Seq(new PrintAtom("World!"), new Stop())))
		),
		new Repeat(4, new Seq(new Generate("Tick"), new Stop()))
	),
	new Merge(
		new Until(new PosConfig("kill_it"),
			new Loop(
				new Seq(new Seq(new Await("Hello")
					, new PrintAtom("Hello World!")), new Stop())
			)
			, new PrintAtom("Goodbye!")
		)
		, new Repeat(4, new Seq(new Generate("kill_it"), new Stop()))
	),
	new Merge(new Loop(new Seq(new ActionAtom(() => console.log(5 * 9)), new Stop())),
	new Repeat(5, new PrintAtom("second branche"))
),
	new Merge(new When(new PosConfig("e")
	                 ,new Seq(new Stop(), new PrintAtom("c'est le then"))
			 ,new Seq(new Stop(), new PrintAtom("c'est le else"))),
		  new Generate("e")),
	new Merge(new When(new PosConfig("e")
	                 ,new Seq(new Stop(), new PrintAtom("c'est le then"))
			 ,new Seq(new Stop(), new PrintAtom("c'est le else"))),
		  new Seq(new Stop(), new Generate("e"))),
	new Merge(new Reset(new PosConfig("e")
	                 ,new Seq(new PrintAtom("Ça reset"), new Stop(), new PrintAtom("Ça reset plus"))),
		  new Seq(new Generate("e")))
];



var i=0;
for(var p of inst){
  console.log("Nouvelle machine");
  machine = new Machine();
  machine.add(p);
  i=0;
  while(machine.react() && i<20){
    i++;
    console.log("---");
    }
  console.log("");
  }

/* moudule */
module.exports = {
	Instruction: Instruction,
	//UnaryInstruction: UnaryInstruction,
	//BinaryInstruction: BinaryInstruction,
	Machine: Machine,
	Nothing: Nothing,
	Stop: Stop,
	Seq: Seq,
	Merge: Merge,
	Atom: Atom,
	PrintAtom: PrintAtom,
	ActionAtom: ActionAtom,
	Loop: Loop,
	Repeat: Repeat,
	Event: Event,
	EventEnv: EventEnv,
	Config: Config,
	//UnaryConfig: UnaryConfig,
	PosConfig: PosConfig,
	//NegConfig: NegConfig,
	//BinaryConfig: BinaryConfig,
	AndConfig: AndConfig,
	OrConfig: OrConfig,
	Generate: Generate,
	Control: Control,
	Await: Await,
	Until: Until,
	When: When,
	//EventDecl: EventDecl

}


/*
var {
Instruction,
	UnaryInstruction,
	BinaryInstruction,
	Machine,
	Nothing,
	Stop,
	Seq,
	Merge,
	Atom,
	PrintAtom,
	ActionAtom,
	Loop,
	Repeat,
	Event,
	EventEnv,

	Config,
	UnaryConfig,
	PosConfig,
	NegConfig,
	BinaryConfig,
	AndConfig,
	OrConfig,
	Generate,
	Control,
	Await,
	Until,
	When,
	EventDecl
}=require("./OP4.js");

*/
