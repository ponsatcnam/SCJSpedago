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
		this.program = new Nothing();
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
		this.endOfInstant = false;
		this.move = false;
		while (this.program.activ(this) == SUSP) {

			if (this.move) { this.move = false } else { this.endOfInstant = true }

		}
		this.instant++;


		//debug(this.instant);
	}
}

//INSTRUCTIONS DE BASE
class Nothing extends Instruction {
	activation(m) { return TERM; }
}

class Stop extends Instruction {
	activation(m) { this.terminate(); return STOP; }
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
	activation(m) {
		var res = TERM;
		if (this.idx == this.seq.length) { return TERM; }
		while (TERM == (res = this.seq[this.idx].activ(m))
			&& (this.idx < this.seq.length)) {
			this.idx++;
		}
		return res;
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
	reset() {
		super.reset();
		for (var b of this.branches) {
			b.status = SUSP;
		}
	}
	activation(m) {
		var res = TERM;
		for (var b of this.branches) {
			if (SUSP === b.status) {
				b.status = b.inst.activ(m);
			}
			if (SUSP === b.status) {
				res = SUSP;
			}
			if (TERM === res && TERM !== b.status) {
				res = STOP;
			}
		}
		/* le if qui suit est du code défensif */
		if (TERM === res) {
			for (var b of this.branches) {
				if (TERM !== b.status) {
					throw new Error("c'est pas bon");
				}
			}
		}
		if (STOP === res) {
			for (var b of this.branches) {
				if (STOP === b.status) {
					b.status = SUSP;
				}
			}
		}
		return res;
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
		else { return res; }
		return TERM;
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
			e = new Event(name);
			this.put(name, e);
		}
		return e;
	}
	put(name, event) { this.eventEnv[name] = event; }
}

//configuration
// abstract class just to remember that configuration should have 2 methode
class Config {
	fixed(m) { throw new TypeError("Do not call abstract method fixed from child."); }
	evaluate(m) { throw new TypeError("Do not call abstract method evaluate from child."); }
}


//configuration Unuaires
class UnaryConfig extends Config {

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

class PosConfig extends UnaryConfig {
	constructor(name) {
		super();
		this.eventName = name
	}

	evaluate(m) {
		return this.event(m).isPresent(machine);
	}
}



class NegConfig extends UnaryConfig {
	constructor(name) {
		super();
		this.eventName = name;
	}

	evaluate(m) {
		return !event(m).isPresent(machine);
	}
}

//configuration binaires

class BinaryConfig {
	constructor(c1, c2) {
		this.c1 = c1; this.c2 = c2;
	}
}


class AndConfig extends BinaryConfig {
	constructor(c1, c2) {
		super(c1, c2);
	}
	fixed(m) {
		var b1 = this.c1.fixed(m);
		var b2 = this.c2.fixed(m);
		if (b1 && !this.c1.evaluate(m)) { return true }
		if (b2 && !t.c2.evaluate(m)) { return true }
		return b1 && b2;
	}

	evaluate(m) {
		return this.c1.evaluate(m) && this.c2.evaluate(m);
	}
}


class OrConfig extends BinaryConfig {
	constructor(c1, c2) {
		super(c1, c2);
	}
	/** La disjunction est fixée  des qu'un element est fixé et evalué a true,
	 l'autre n'a pas besoin d'etre evalué */
	fixed(m) {
		var b1 = this.c1.fixed(m);
		var b2 = this.c2.fixed(m);
		if (b1 && this.c1.evaluate(m)) { return true }
		if (b2 && this.c2.evaluate(m)) { return true }
		return b1 && b2;
	}

	evaluate(m) {
		return this.c1.evaluate(m) || this.c2.evaluate(m);
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
		m.newMove(),
			event.generate(m);
	}
}

//control par un evenement 
class Control extends UnaryInstruction {
	constructor(name, body) {
		super();
		this.eventName = name;
		this.body = body;
	}
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
		return m.isEndOfInstant() ? STOP : TERM;

	}
}



class Until extends BinaryInstruction {
	constructor(config, body, handler) {
		super();
		this.config = config;
		this.left = body;
		this.right = (handler || new Nothing());
		this.activHandle = false,
			this.resumeBody = true;
	}
	reset() {
		super.reset();
		this.activHandle = false,
			this.resumeBody = true;
	}
	activation(m) {
		//	console.log("LOG",this.config,"  ",this.config.constructor.name)
		if (this.activHandle) { return this.right.activ(m); }
		if (this.resumeBody) {
			var res = this.left.activ(m);
			if (res != STOP) { return res; }
			this.resumeBody = false;
		}
		if (!this.config.fixed(m)) { return SUSP }
		if (this.config.evaluate(m)) {
			this.activeHandle = true;
			if (m.isEndOfInstant()) { return STOP; }
			return this.right.activ(m);
		}

		this.resumeBody = true;
		return STOP;
	}

}

//Test de configuration
class When extends BinaryInstruction {
	constructor(config, cthen, celse) {
		super();
		this.config = config;
		this.left = cthen;
		this.right = celse;
		this.confEvaluated = false;

	}
	reset() {
		super.reset();
		evaluated = false;
	}
	activation(m) {
		if (!this.confEvaluated) {
			if (this.config.fixed(m)) { return SUSP; }
			var value = this.config.evaluate(m);
			this.confEvaluated = true;
			if (m.isEndOfInstant()) return STOP;
		}
		return value ? this.left.activ(m) : this.right.activ(m);
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
var inst = new Seq(
	new Merge(
		new Seq(new Stop(), new PrintAtom("left")),
		new PrintAtom("right")),
	new PrintAtom("end of inst")
);

//test boucle
var inst = new Loop(new Seq(new PrintAtom("Hello World!"), new Stop()));
var inst = new Merge(new Loop(new Seq(new PrintAtom("Hello World!"), new Stop())),
	new Repeat(5, new PrintAtom("second branche"))
);


var inst = new Merge(
	new EventDecl("Hello",
		new Merge(
			new Seq(new Await("Hello"), new PrintAtom("Hello internal World!"))
			, new Seq(new Stop(), new Generate("Hello"))
		))
	, new Seq(new Generate("Hello"), new Seq(new Stop(), new Seq(new Await("Hello"),
		new PrintAtom("Hello exterior World !"))
	)));


var inst =
	new Merge(
		new Control("Tick",
			new Seq(new PrintAtom("Hello ")
				, new Seq(new Stop(), new Seq(new PrintAtom("World!"), new Stop())))
		),
		new Repeat(4, new Seq(new Generate("Tick"), new Stop()))
	);

var inst =
	new Merge(
		new Until(new PosConfig("kill_it"),
			new Loop(
				new Seq(new Seq(new Await("Hello")
					, new PrintAtom("Hello World!")), new Stop())
			)
			, new PrintAtom("Goodbye!")
		)
		, new Repeat(4, new Seq(new Generate("kill_it"), new Stop()))
	);



var inst = new Merge(new Loop(new Seq(new ActionAtom(() => console.log(5 * 9)), new Stop())),
	new Repeat(5, new PrintAtom("second branche"))
);

/*
machine.add(inst);
machine.react();
  */
/* moudule */
module.exports = {
	Instruction: Instruction,
	UnaryInstruction: UnaryInstruction,
	BinaryInstruction: BinaryInstruction,
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
	UnaryConfig: UnaryConfig,
	PosConfig: PosConfig,
	NegConfig: NegConfig,
	BinaryConfig: BinaryConfig,
	AndConfig: AndConfig,
	OrConfig: OrConfig,
	Generate: Generate,
	Control: Control,
	Await: Await,
	Until: Until,
	When: When,
	EventDecl: EventDecl

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
