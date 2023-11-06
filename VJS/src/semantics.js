// A minimal SugarCubesJS version based on v1.

// from "Objets Reactifs en java" . F Boussinot
// and the thesis of Jean Ferdy Susini
// O Pons, JFS (MNF) nov. 2023;

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
    this.instant++;
    return res!==TERM;
  }
}
/*
instant(t,⌀) -> u
-----------------
  react(t) -> u

 activ(close(t), E) -> TERM(nothing, E_)
---------------------------------------
       instant(t,E) -> nothing

 activ(close(t), E) -> STOP(t_, E_)
---------------------------------------
       instant(t,E) -> t_

activ(t, E) -> SUSP(t_, E_) ; E=E_ ; eoi(t_, E) -> t__
---------------------------------------------------------
        activ(close(t), E) -> STOP(t__, E)

activ(t, E) -> SUSP(t_, E_) ; E≠E_ ; activ(close(t_), E_) -> STOP(t__, E__)
---------------------------------------------------------------------------
        activ(close(t), E) -> STOP(t__, E__)

activ(t, E) -> SUSP(t_, E_) ; E≠E_ ; activ(close(t_), E_) -> TERM(t__, E__)
---------------------------------------------------------------------------
        activ(close(t), E) -> STOP(t__, E__)

    activ(t, E) -> STOP(t_, E_)
------------------------------------
 activ(close(t), E) -> STOP(t_, E_)

*/

//INSTRUCTIONS DE BASE
class Nothing extends Instruction {
  activation(m) { return TERM; }
}
/*
activ(nothing, E) -> TERM(nothing, E)
*/

class Stop extends Instruction {
  activation(m) {
    this.terminate();
    return STOP;
    }
}

/*
activ(stop, E) -> STOP(nothing, E)
*/

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
/*

      l≠nil ; activ(head(l),E)->SUSP(t_,E_)
----------------------------------------------------
activ(seq(l), E) -> SUSP(seq(cons(t_, tail(l))), E_)

      l≠nil ; activ(head(l),E)->STOP(t_,E_)
----------------------------------------------------
activ(seq(l), E) -> STOP(seq(cons(t_, tail(l))), E_)

 l≠nil ; activ(head(l),E)->TERM(nothing, E_) ; activ(seq(tail(l)), E_) -> SUSP(u, E__)
---------------------------------------------------------------------------------------
                      activ(seq(l), E) -> SUSP(u, E__)

                  l=nil
----------------------------------------
  activ(seq(l), E) -> TERM(nothing, E)


On doit pouvoir déconditionnaliser tout de suite car forcément l DOIT être différent de nil...
C'est défensif...

                   l≠nil
----------------------------------------------------
  eoi(seq(l), E) -> seq(cons(eoi(head(l), tail(l)))
*/


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
/*

                 l=nill
----------------------------------------
 activ(Merge(l), E) -> TERM(nothing, E)

 l≠nill ; head(l)=SUSP(p) ; activ(p,E) -> SUSP(p_,E_) activ(Merge(tail(l)), E_) -> TERM(nothing, E__)
------------------------------------------------------------------------------------------------------
           activ(Merge(l), E) -> SUSP(Merge([SUSP(p_)]), E__)

 l≠nill ; head(l)=SUSP(p) ; activ(p,E) -> STOP(p_,E_) activ(Merge(tail(l)), E_) -> TERM(nothing, E__)
------------------------------------------------------------------------------------------------------
           activ(Merge(l), E) -> STOP(Merge([SUSP(p_)]), E__)

 l≠nill ; head(l)=SUSP(p) ; activ(p,E) -> TERM(nothing,E_) activ(Merge(tail(l)), E_) -> TERM(nothing, E__)
-----------------------------------------------------------------------------------------------------------
           activ(Merge(l), E) -> TERM(nothing, E__)

 l≠nill ; head(l)=SUSP(p) ; activ(p,E) -> TERM(nothing,E_) activ(Merge(tail(l)), E_) -> STOP(Merge(l'), E__)
-------------------------------------------------------------------------------------------------------------
           activ(Merge(l), E) -> STOP(Merge(l'), E__)

 l≠nill ; head(l)=SUSP(p) ; activ(p,E) -> STOP(p_,E_) activ(Merge(tail(l)), E_) -> STOP(Merge(l'), E__)
--------------------------------------------------------------------------------------------------------
           activ(Merge(l), E) -> STOP(Merge(cons(STOP(p_), l')), E__)

 l≠nill ; head(l)=SUSP(p) ; activ(p,E) -> SUSP(p_,E_) activ(Merge(tail(l)), E_) -> STOP(Merge(l'), E__)
--------------------------------------------------------------------------------------------------------
           activ(Merge(l), E) -> SUSP(Merge(cons(SUSP(p_), l')), E__)

*/

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
    this.code = arguments[0];
  }

  action(m) {
    m.addAction(this.code);
  }
}
/*
activ(atom(a), E) -> TERM(nothing, E)
*/

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
/*

 activ(seq(cons(p,[stop])), E) -> SUSP(seq(cons(p_, [stop])), E_)
------------------------------------------------------------------
  activ(Loop(p), E) -> SUSP(seq(cons(p_, [stop, Loop(p)])), E_)

    activ(seq(cons(p,[stop])), E) -> STOP(u, E_)
--------------------------------------------------------
 activ(Loop(p), E) -> SUSP(seq(cons(u, [Loop(p)])), E_)

*/

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
/*
activ(generate(nom), E) -> TERM(nothing, E U {nom})
*/


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
/*

                nom ∈ E 
------------------------------------------
 activ(await(nom), E) -> TERM(nothing, E)

                   nom ∉ E 
--------------------------------------------
 activ(await(nom), E) -> SUSP(await(nom), E)

 eoi(await(nom), E) -> await(nom)

*/

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
  Loop: Loop,
  Generate: Generate
}

