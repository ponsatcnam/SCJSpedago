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

  reset() { this.terminated = false; }
  terminate() { this.terminated = true; }
  isTerminated() { return this.terminated; }
  activation(m) { throw new TypeError("Do not call abstract method activation from child."); }
  activ(m) {
    if (this.terminated) { return TERM; }
    var res = this.activation(m);
    if (res === TERM) { this.terminated = true; }
    return res;
  }
  collectValues(m){ }
  toString(){
    return this.constructor.name;
  }
}

class Machine {
  constructor() {
    this.program = new Merge();
    this.eventEnv = new EventEnv();
    this.instant = 1;
    this.endOfInstant = false;
    this.move = false;
    this.pendding = [];
    this.getEvent("stdout");
  }

  currentInstant() { return this.instant; }
  newMove() { this.move = true; }
  isEndOfInstant() { return this.endOfInstant; }
  add(inst) { this.pendding.push(inst); }
  getEvent(name) {
    return this.eventEnv.getEvent(name);
  }
  isGenerated(name) {
    return this.getEvent(name).isPresent(this);
  }
  generate(name) {
    this.getEvent(name).generate(this);
  }
  react() {
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
        } else { this.endOfInstant = true }
    }
    this.program.collectValues(this);
    var messages=this.getEvent('stdout').getValues(this);
    if(messages){
      for(var m of messages){
        console.log(m);
      }
    }
    this.instant++;
    return res!==TERM;
  }
}

//INSTRUCTIONS DE BASE
class Nothing extends Instruction {
  activation(m) { return TERM; }
}

class Stop extends Instruction {
  activation(m) {
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
  collectValues(m){
    for (var b of this.seq) {
      b.collectValues(m);
    }
  }
  activation(m) {
    var res = TERM;
    if (this.idx >= this.seq.length) {
        return TERM;
    }
    while ((this.idx < this.seq.length)
      && (TERM === (res = this.seq[this.idx].activ(m)))) {
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
      this.add(p);
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
  collectValues(m){
    for (var b of this.branches) {
      b.inst.collectValues(m);
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
      else if (TERM === res && STOP == b.status) {
        res = STOP;
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
  collectValues(m){
    this.body.collectValues(m);
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
    this.counter = this.num = n;
  }

  reset() {
    super.reset();
    this.body.reset();
    this.counter = this.num;
  }
  collectValues(m){
    this.body.collectValues(m);
  }
  activation(m) {
    var res = this.body.activ(m);
    if (res == TERM) {
      this.counter--;
      this.body.reset();
      return this.counter>0 ? STOP : TERM
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
    this.reset();
  }

  generate(m) {
    if(!this.isPresent(m)){
      this.reset();
      }
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
  addValue(v){
    this.values.push(v);
  }
  getValues(m){
    if(this.isPresent(m)){
      return this.values;
    }
  }
  reset(){ this.values=[]; }
}


// The environment
class EventEnv {
  constructor() {
    this.eventEnv = {};
  }
  getEvent(name) {
    var e = this.eventEnv[name];
    if (e === undefined) {
      this.eventEnv[name] = e = new Event(name);
    }
    return e;
  }
}

//configuration
class Config {
  fixed(m) { throw new TypeError("Do not call abstract method fixed from child."); }
  evaluate(m) { throw new TypeError("Do not call abstract method evaluate from child."); }
}

class PosConfig extends Config {
  constructor(name) {
    super();
    this.eventName = name
  }

  evaluate(m) {
    return this.event(m).isPresent(m);
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
    this.value=arguments[1];
    if(undefined !== this.value){
      this.emitted=false;
      }
  }
  collectValues(m){
    if(this.emitted){
      m.getEvent(this.eventName).addValue(this.value);
      this.emitted=false;
    }
  }
  action(m) {
    var evt = m.getEvent(this.eventName);
    m.newMove();
    evt.generate(m);
    if(undefined !== this.value){
      this.emitted=true;
      }
  }
}

//control par un evenement 
class Control extends Instruction {
  constructor(name, body) {
    super();
    this.eventName = name;
    this.body = body;
  }

  reset(){ super.reset(); this.body.reset(); }
  collectValues(m){
    this.body.collectValues(m);
  }
  activation(m) {
    var event = m.getEvent(this.eventName);
    switch (event.presence(m)) {
      case PRESENT: return this.body.activ(m);
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
  collectValues(m){
    this.body.collectValues(m);
    this.handler.collectValues(m);
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
    }
    else{ this.resumeBody = true; }
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
  collectValues(m){
    this.cthen.collectValues(m);
    this.celse.collectValues(m);
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
  collectValues(m){
    this.body.collectValues(m);
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

class PrintAtom extends Generate {
  constructor(msg) {
    super('stdout', msg);
  }
}


/* moudule */
module.exports = {
  Machine: Machine,
  Nothing: Nothing,
  Stop: Stop,
  Seq: Seq,
  Merge: Merge,
  PrintAtom: PrintAtom,
  ActionAtom: ActionAtom,
  Loop: Loop,
  Repeat: Repeat,
  PosConfig: PosConfig,
  AndConfig: AndConfig,
  OrConfig: OrConfig,
  Generate: Generate,
  Control: Control,
  Await: Await,
  Until: Until,
  When: When,
  Reset: Reset
}

