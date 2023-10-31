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
  copy(){
    return this;
    }
  rewrite(m){
    return this;
    }
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
    this.actions=[];
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
  addAction(f){
    this.actions.push(f);
  }
  getValuesOf(evtName){
    return this.getEvent(evtName).getValues(this);
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
    for(var f of this.actions){
      f(this);
      }
    this.actions=[];
    var messages=this.getEvent('stdout').getValues(this);
    if(messages){
      for(var m of messages){
        console.log(m);
      }
    }
    /*
    Test le rewrite en observant le comportement de la machine qui a chaque
    fin d'instant remplace le programme par sa réécriture.
    */
    //const remains=this.program.rewrite(m);
    //this.program=remains;
    this.instant++;
    return res!==TERM;
  }
}

//INSTRUCTIONS DE BASE
class Nothing extends Instruction {
  activation(m) { return TERM; }
  toString(){ return "SC.Nothing()"; }
}

class Stop extends Instruction {
  activation(m) {
    this.terminate();
    return STOP;
    }
  copy(){
    return new Stop();
    }
  rewrite(m){
    return this.terminated?NOTHING:this.copy();
    }
  toString(){ return "SC.Stop()"; }
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
  copy(){
    const s=[null];
    for (var b of this.seq) {
      s.push(b.copy());
    }
    return new (Function.prototype.bind.apply(Seq, s));
    }
  rewrite(m){
    const s=[null];
    for (var i=this.idx; i<this.seq.length; i++) {
      const tmp=this.seq[i].rewrite(m);
      if(tmp instanceof Seq){
        for(var si of tmp.seq){
          if(si instanceof Nothing){
            continue;
          }
          s.push(si);
          }
        }
      else if(!(tmp instanceof Nothing)){
        s.push(tmp);
        }
    }
    return this.terminated?NOTHING
            :new (Function.prototype.bind.apply(Seq,s));
    }
  toString(){
    var bs=[];
    for (var b of this.seq) {
      bs.push(b.toString());
    }
    return "SC.Seq("+bs.join(", ")+")";
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
  copy(){
    const s=[null];
    for (var b of this.branches) {
      s.push(b.inst.copy());
    }
    return new (Function.prototype.bind.apply(Merge, s));
    }
  rewrite(m){
    const s=[null];
    for (var i of this.branches) {
      if(SUSP===i.status){
        s.push(i.inst.rewrite(m));
        }
    }
    return this.terminated?NOTHING
            :new (Function.prototype.bind.apply(Merge, s));
    }
  toString(){
    var bs=[];
    for (var b of this.branches) {
      bs.push(b.inst.toString());
    }
    return "SC.Merge("+bs.join(", ")+")";
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
  constructor(fun) {
    super();
    this.code = fun;
  }

  action(m) {
    m.addAction(this.code);
  }
  copy(){
    return new ActionAtom(this.code);
    }
  rewrite(m){
    return this.terminated?NOTHING
            :this.copy();
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
  copy(){
    return new Loop(this.body.copy());
    }
  rewrite(m){
    return this.terminated?NOTHING
            :SC.Seq(this.body.rewrite(m), SC.Stop()
                  , SC.Loop(this.body.copy()));
    }
  toString(){
    return "SC.Loop("+this.body.toString()+')';
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
  copy(){
    return new Repeat(this.num, this.body.copy());
    }
  rewrite(m){
    return this.terminated?NOTHING
            :SC.Seq(this.body.rewrite(m)
                  , this.counter>1?SC.Stop():SC.Nothing()
                  , SC.Repeat(this.counter-1, this.body.copy()));
    }
  toString(){
    return "SC.Repeat("+this.num+", "+this.body.toString()+')';
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
  toString(){ throw new TypeError("Do not call abstract method evaluate from child."); }
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
  toString(){ // Faut encoder la chaîne !
    return '"'+this.eventName+'"';
  }
}

class AndConfig extends Config {
  constructor() {
    super();
    this.configs = [];
    for (var c of arguments) {
      this.configs.push(c);
    }
  }

  fixed(m) {
    var fix=false;
    var res=true;
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
  toString(){
    var cs=[];
    for (var c of this.configs) {
      cs.push(c.toString());
    }
    return 'SC.And('+cs.join(', ')+')';
  }
}


class OrConfig extends Config {
  constructor() {
    super();
    this.configs = [];
    for (var c of arguments) {
      this.configs.push(c);
    }

  }
  /** La disjunction est fixée  des qu'un element est fixé et evalué a true,
   l'autre n'a pas besoin d'etre evalué */
  fixed(m) {
    var fix=false;
    var res=true;
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
  toString(){
    var cs=[];
    for (var c of this.configs) {
      cs.push(c.toString());
    }
    return 'SC.Or('+cs.join(', ')+')';
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
  copy(){
    return new Generate(this.eventName, this.value);
    }
  rewrite(m){
    return this.terminated?NOTHING:this.copy();
    }
  toString(){ // Faut encoder la chaîne !
    var value=this.value;
    if("string"==typeof(this.value)){
      value='"'+value+'"';
      }
    return 'SC.Generate("'+this.eventName+'"'
            +((undefined!==value)?(", "+value):"")+")";
  }
}

//control par un evenement 
class Control extends Instruction {
  constructor(name, body) {
    super();
    if("string"==typeof(name)){
      name = new PosConfig(name);
      }
    this.config = name;
    this.body = body;
  }

  reset(){ super.reset(); this.body.reset(); }
  collectValues(m){
    this.body.collectValues(m);
  }
  activation(m) {
    if(this.config.fixed(m)){
      if(this.config.evaluate(m)){
        return this.body.activ(m);
        }
      else{
        return STOP;
        }
      }
    return SUSP;
    }
  copy(){
    return new Control(this.config, this.body.copy());
    }
  rewrite(m){
    return this.terminated?NOTHING
            :new Control(this.config, this.body.rewrite(m));
    }
  toString(){
    return 'SC.Control('+this.config.toString()+', '+this.body.toString()+')';
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
  copy(){
    return new Await(this.config);
    }
  rewrite(m){
    return this.terminated?NOTHING:this.copy();
    }
  toString(){
    return 'SC.Await('+this.config.toString()+')';
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
  copy(){
    return new Until(this.config, this.body.copy(), this.handler.copy());
    }
  rewrite(m){
    return this.terminated?NOTHING
            :(this.activHandle?this.handler.rewrite(m)
                              :new Until(this.config, this.body.rewrite(m)
                                       , this.handler.copy()));
    }
  toString(){
    return 'SC.Until('+this.config.toString()+', '+this.body.toString()
            +(undefined!==this.handler?', '+this.handler.toString():'')+')';
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
  copy(){
    return new When(this.config, this.cthen.copy(), this.celse.copy());
    }
  rewrite(m){
    return this.terminated?NOTHING
            :(this.confEvaluated?(this.value?this.cthen:this.celse).rewrite(m)
                              :this.copy());
    }
  toString(){
    return 'SC.When('+this.config.toString()+', '+this.cthen.toString()
            +(undefined!==this.celse?', '+this.celse.toString():'')+')';
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
  copy(){
    return new Reset(this.config, this.body.copy());
    }
  rewrite(m){
    return this.terminated?NOTHING
            :new Reset(this.config, this.body.rewrite(m));
    }
  toString(){
    return 'SC.Reset('+this.config.toString()+', '+this.body.toString()+')';
  }
}

class FreezeOn extends Instruction {
  constructor(evtName, body) {
    super();
    this.eventName = evtName;
    this.body = body;
    this.resumeBody = true;
    this.emitted=false;
    this.value=null;
  }

  reset() {
    super.reset();
    this.body.reset();
    this.resumeBody = true;
    this.emitted=false;
    this.value=null;
  }
  collectValues(m){
    if(this.emitted){
      m.getEvent(this.eventName).addValue(this.value);
      this.value=null;
      this.emitted=false;
    }
    this.body.collectValues(m);
  }
  activation(m) {
    if (this.resumeBody) {
      var res = this.body.activ(m);
      if (res != STOP) { return res; }
      this.resumeBody = false;
    }
    var event=m.getEvent(this.eventName);
    switch(event.presence(m)){
      case PRESENT:{
        this.value=this.body.rewrite(m);
        this.emitted=true;
        return TERM;
        }
      case ABSENT:{
        this.resumeBody = true;
        return STOP;
      }
      default: return SUSP;
    }
  }
  copy(){
    return new FreezeOn(this.eventName, this.body.copy());
    }
  rewrite(m){
    return this.terminated?NOTHING
            :new FreezeOn(this.eventName, this.body.rewrite(m));
    }
  toString(){
    return 'SC.FreezeOn("'+this.eventName+'", '+this.body.toString()+')';
  }
}

class PrintAtom extends Generate {
  constructor(msg) {
    super('stdout', msg);
  }
}

const NOTHING=new Nothing();

var SC={
  Machine: function(){
    return new Machine();
    },
  Seq: function(){
    const s=[null];
    for(var i of arguments){
      if(i instanceof Seq){
        for(var si of i.seq){
          s.push(si);
          }
        }
      else if(i instanceof Nothing){ continue; }
      else if(i instanceof Instruction){
        s.push(i);
        }
      }
    return new (Function.prototype.bind.apply(Seq, s));
    },
  Par: function(){
    const s=[null];
    for(var i of arguments){
      if(i instanceof Merge){
        for(var si of i.branches){
          s.push(si.inst);
          }
        }
      else if(i instanceof Nothing){ continue; }
      else if(i instanceof Instruction){
        s.push(i);
        }
      }
    return new (Function.prototype.bind.apply(Merge, s));
    },
  Action: function(f){
    if("function"==typeof(f)){
      return new ActionAtom(f);
      }
    },
  Nothing: function(){ return NOTHING; },
  Stop: function(){ return new Stop(); },
  Loop: function(){
    const s=[null];
    for(var i of arguments){
      if(i instanceof Seq){
        for(var si of i.seq){
          s.push(si);
          }
        }
      else if(i instanceof Nothing){ continue; }
      else if(i instanceof Instruction){
        s.push(i);
        }
      }
    return new Loop(new (Function.prototype.bind.apply(Seq, s)));
    },
 Repeat: function(n){
    const insts=Array.prototype.slice.call(arguments,1);
    const s=[null];
    for(var i of insts){
      if(i instanceof Seq){
        for(var si of i.seq){
          s.push(si);
          }
        }
      else if(i instanceof Nothing){ continue; }
      else if(i instanceof Instruction){
        s.push(i);
        }
      }
    if(!(isNaN(n)) && n>0){
      return new Repeat(parseInt(n), new (Function.prototype.bind.apply(Seq, s)));
      }
    },
  PresenceOf: function(name){
    if("string"!=typeof(name)){
      return null;
      }
    return new PosConfig(name);
    },
  And: function(){
    const cl=[null];
    for(var c of arguments){
      if("string"==typeof(c)){
        cl.push(new PosConfig(c));
        }
      else if(c instanceof AndConfig){
        for(var ci of c.configs){
          cl.push(ci);
          }
        }
      else if(c instanceof Config){
        cl.push(c);
        }
      }
    return new (Function.prototype.bind.apply(AndConfig, cl));
    },
  Or: function(){
    const cl=[null];
    for(var c of arguments){
      if("string"==typeof(c)){
        cl.push(new PosConfig(c));
        }
      else if(c instanceof OrConfig){
        for(var ci of c.configs){
          cl.push(ci);
          }
        }
      else if(c instanceof Config){
        cl.push(c);
        }
      }
    return new (Function.prototype.bind.apply(OrConfig, cl));
    },
  Generate: function(name, value){
    if("string"!=typeof(name)){
      return null;
      }
    return new Generate(name, value);
    },
  Control: function(config){
    if("string"==typeof(config)){
      config=new PosConfig(config);
      }
    const s=[null];
    for(var i of arguments){
      if(i instanceof Seq){
        for(var si of i.seq){
          s.push(si);
          }
        }
      else if(i instanceof Nothing){ continue; }
      else if(i instanceof Instruction){
        s.push(i);
        }
      }
    var p = this.Seq.apply(this, s);
    if(config instanceof Config){
      return new Control(config, p);
      }
    },
  Await: function(config){
    if("string"==typeof(config)){
      config=new PosConfig(config);
      }
    if(config instanceof Config){
      return new Await(config);
      }
    },
  Kill: function(config, p, h){
    if("string"==typeof(config)){
      config=new PosConfig(config);
      }
    if(config instanceof Config && p instanceof Instruction
       && (undefined==h || h instanceof Instruction)){
      return new Until(config, p, h);
      }
    },
  When: function(config, t, e){
    if("string"==typeof(config)){
      config=new PosConfig(config);
      }
    if(config instanceof Config && t instanceof Instruction
       && (undefined==e || e instanceof Instruction)){
      return new When(config, t, e);
      }
    },
  Reset: function(config){
    if("string"==typeof(config)){
      config=new PosConfig(config);
      }
    const s=[null];
    for(var i of arguments){
      if(i instanceof Seq){
        for(var si of i.seq){
          s.push(si);
          }
        }
      else if(i instanceof Nothing){ continue; }
      else if(i instanceof Instruction){
        s.push(i);
        }
      }
    var body = this.Seq.apply(this, s);
    if(config instanceof Config){
      return new Reset(config, body);
      }
    },
  Write: function(msg){
    return new PrintAtom(msg);
    },
  FreezeOn: function(evtName){
    if("string"!=typeof(evtName)){
        throw new TypeError("first argument must be an event name");
      }
    const s=[null];
    for(var i of arguments){
      if(i instanceof Seq){
        for(var si of i.seq){
          s.push(si);
          }
        }
      else if(i instanceof Nothing){ continue; }
      else if(i instanceof Instruction){
        s.push(i);
        }
      }
    var body = this.Seq.apply(this, s);
    return new FreezeOn(evtName, body);
    }
  };

/* moudule */
module.exports = {
  SC: SC,
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
  Reset: Reset,
  FreezeOn: FreezeOn
}

