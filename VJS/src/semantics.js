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
----------------- react
  react(t) -> u

 activ(Close(t), E) -> TERM(Nothing(), E_)
---------------------------------------  instant-TERM
       instant(t,E) -> Nothing()

 activ(Close(t), E) -> STOP(t_, E_)
--------------------------------------- instant-STOP
       instant(t,E) -> t_

     activ(t, E) -> TERM(t_, E_)
----------------------------------------- close-TERM
 activ(Close(t), E) -> TERM(Nothing(), E_)

 activ(t, E) -> SUSP(t_, E_) ; E=E_ ; eoi(t_, E) -> STOP(t__, E)
---------------------------------------------------------------- close-SUSP-EOI
        activ(Close(t), E) -> STOP(t__, E)

activ(t, E) -> SUSP(t_, E_) ; E≠E_ ; activ(Close(t_), E_) -> STOP(t__, E__)
--------------------------------------------------------------------------- close-SUSP-STOP
        activ(Close(t), E) -> STOP(t__, E__)

activ(t, E) -> SUSP(t_, E_) ; E≠E_ ; activ(Close(t_), E_) -> TERM(t__, E__)
--------------------------------------------------------------------------- close-SUSP-TERM
        activ(Close(t), E) -> TERM(Nothing(), E__)

    activ(t, E) -> STOP(t_, E_)
------------------------------------ close-STOP
 activ(Close(t), E) -> STOP(t_, E_)

*/

//INSTRUCTIONS DE BASE
class Nothing extends Instruction {
  activation(m) { return TERM; }
}
/*
               true
------------------------------------- nothing
activ(Nothing(), E) -> TERM(Nothing(), E)
*/

class Stop extends Instruction {
  activation(m) {
    this.terminate();
    return STOP;
    }
}

/*
            true
---------------------------------- stop
activ(Stop(), E) -> STOP(Nothing(), E)
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
------------------------------------------------------ seq-SUSP
 activ(Seq(l), E) -> SUSP(Seq(cons(t_, tail(l))), E_)

      l≠nil ; activ(head(l),E)->STOP(t_,E_)
------------------------------------------------------ seq-STOP
 activ(Seq(l), E) -> STOP(Seq(cons(t_, tail(l))), E_)

 l≠nil ; activ(head(l),E)->TERM(Nothing(), E_) ; activ(Seq(tail(l)), E_) -> SUSP(u, E__)
----------------------------------------------------------------------------------------- seq-TERM-SUSP
                      activ(Seq(l), E) -> SUSP(u, E__)

 l≠nil ; activ(head(l),E)->TERM(Nothing(), E_) ; activ(Seq(tail(l)), E_) -> STOP(u, E__)
----------------------------------------------------------------------------------------- seq-TERM-STOP
                      activ(Seq(l), E) -> STOP(u, E__)

 l≠nil ; activ(head(l),E)->TERM(Nothing(), E_) ; activ(Seq(tail(l)), E_) -> TERM(u, E__)
----------------------------------------------------------------------------------------- seq-TERM-TERM
                      activ(Seq(l), E) -> TERM(Nothing(), E__)

                  l=nil
---------------------------------------- seq_NIL
 activ(Seq(l), E) -> TERM(Nothing(), E)


On doit pouvoir déconditionnaliser tout de suite car forcément l DOIT être différent de nil...
C'est défensif...

       l≠nil ; eoi(head(l), E) -> STOP(l_, E)
---------------------------------------------------- seq-EOI
  eoi(Seq(l), E) -> STOP(Seq(cons(l_, tail(l))), E)
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

                 l=nil
---------------------------------------- par_NIL
 activ(Par(l), E) -> TERM(Nothing(), E)

 l≠nil ; head(l)=_SUSP(p) ; activ(p,E) -> SUSP(p_,E_) ; activ(Par(tail(l)), E_) -> TERM(Nothing(), E__)
---------------------------------------------------------------------------------------------------------------- par-HSUSP-SUSP-TERM
           activ(Par(l), E) -> SUSP(Par([_SUSP(p_)]), E__)

 l≠nil ; head(l)=_SUSP(p) ; activ(p,E) -> STOP(p_,E_) ; activ(Par(tail(l)), E_) -> TERM(Nothing(), E__)
---------------------------------------------------------------------------------------------------------------- par-HSUSP-STOP-TERM
           activ(Par(l), E) -> STOP(Par([_STOP(p_)]), E__)

 l≠nil ; head(l)=_SUSP(p) ; activ(p,E) -> TERM(Nothing(),E_) ; activ(Par(tail(l)), E_) -> TERM(Nothing(), E__)
----------------------------------------------------------------------------------------------------------------------- par-HSUSP-TERM-TERM
           activ(Par(l), E) -> TERM(Nothing(), E__)

 l≠nil ; head(l)=_SUSP(p) ; activ(p,E) -> TERM(Nothing(),E_) ; activ(Par(tail(l)), E_) -> STOP(Par(l_), E__)
--------------------------------------------------------------------------------------------------------------- par-HSUSP-TERM-STOP
           activ(Par(l), E) -> STOP(Par(l_), E__)

 l≠nil ; head(l)=_SUSP(p) ; activ(p,E) -> STOP(p_,E_) ; activ(Par(tail(l)), E_) -> STOP(Par(l_), E__)
---------------------------------------------------------------------------------------------------------- par-HSUSP-STOP-STOP
           activ(Par(l), E) -> STOP(Par(cons(_STOP(p_), l_)), E__)

 l≠nil ; head(l)=_SUSP(p) ; activ(p,E) -> SUSP(p_,E_) ; activ(Par(tail(l)), E_) -> STOP(Par(l_), E__)
---------------------------------------------------------------------------------------------------------- par-HSUSP-SUSP-STOP
           activ(Par(l), E) -> SUSP(Par(cons(_SUSP(p_), l_)), E__)

 l≠nil ; head(l)=_SUSP(p) ; activ(p,E) -> SUSP(p_,E_) ; activ(Par(tail(l)), E_) -> SUSP(Par(l_), E__)
---------------------------------------------------------------------------------------------------------- par-HSUSP-SUSP-SUSP
           activ(Par(l), E) -> SUSP(Par(cons(_SUSP(p_), l_)), E__)

 l≠nil ; head(l)=_SUSP(p) ; activ(p,E) -> STOP(p_,E_) ; activ(Par(tail(l)), E_) -> SUSP(Par(l_), E__)
---------------------------------------------------------------------------------------------------------- par-HSUSP-STOP-SUSP
           activ(Par(l), E) -> SUSP(Par(cons(_STOP(p_), l_)), E__)

 l≠nil ; head(l)=_SUSP(p) ; activ(p,E) -> TERM(Nothing(),E_) ; activ(Par(tail(l)), E_) -> SUSP(Par(l_), E__)
--------------------------------------------------------------------------------------------------------------- par-HSUSP-TERM-SUSP
           activ(Par(l), E) -> SUSP(Par(l_), E__)

 l≠nil ; head(l)=_STOP(p) ; activ(Par(tail(l)), E) -> SUSP(Par(l_), E_)
---------------------------------------------------------------------------- par-HSTOP-SUSP
           activ(Par(l), E) -> SUSP(Par(cons(_STOP(p),l_)), E_)

 l≠nil ; head(l)=_STOP(p) ; activ(Par(tail(l)), E) -> STOP(Par(l_), E_)
---------------------------------------------------------------------------- par-HSTOP-STOP
           activ(Par(l), E) -> STOP(Par(cons(_STOP(p),l_)), E_)

 l≠nil ; head(l)=_STOP(p) ; activ(Par(tail(l)), E) -> TERM(Par(l_), E_)
---------------------------------------------------------------------------- par-HSTOP-TERM
           activ(Par(l), E) -> STOP(Par(cons(_STOP(p), nil)), E_)

 l≠nil ; head(l)=_SUSP(p) ; eoi(p, E) -> STOP(p_, E) ; eoi(Par(tail(l)), E) -> STOP(Par(l_), E)
------------------------------------------------------------------------------------------------ par-EOI-HSUSP
           eoi(Par(l), E) -> STOP(Par(cons(_SUSP(p_), l_)), E)

 l≠nil ; head(l)=_STOP(p) ; eoi(Par(tail(l)), E) -> STOP(Par(l_), E)
--------------------------------------------------------------------- par-EOI-HSTOP
       eoi(Par(l), E) -> STOP(Par(cons(_SUSP(p), l_)), E)

              l=nil
------------------------------------- par-EOI-NIL
 eoi(Par(l), E) -> STOP(Par(nil), E)

         activ(t, E) -> SUSP(t_, E_)
-------------------------------------------------- closepar-SUSP
 activ(ClosePar(t), E) ->  SUSP(ClosePar(t_), E_)

        activ(t, E) -> TERM(t_, E_)
---------------------------------------------- closepar-TERM
 activ(ClosePar(t), E) ->  TERM(Nothing(), E_)

 activ(t, E) -> STOP(t_, E_) ; eoi(t_, E_) -> STOP(t__, E__)
------------------------------------------------------------- closepar-STOP
     activ(ClosePar(t), E) ->  STOP(ClosePar(t__), E__)

          eoi(t, E) -> STOP(t_, E)
----------------------------------------------- closepar-EOI
 eoi(ClosePar(t), E) ->  STOP(ClosePar(t_), E)

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
                true
--------------------------------------- atom
 activ(Atom(a), E) -> TERM(Nothing(), E)
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

 activ(Seq(cons(p,[Stop()])), E) -> SUSP(Seq(cons(p_, [Stop()])), E_)
------------------------------------------------------------------ loop-SUSP
  activ(Loop(p), E) -> SUSP(Seq(cons(p_, [Stop(), Loop(p)])), E_)

    activ(Seq(cons(p,[Stop()])), E) -> STOP(u, E_)
-------------------------------------------------------- loop-STOP
 activ(Loop(p), E) -> STOP(Seq(cons(u, [Loop(p)])), E_)

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
                       true
---------------------------------------------------- generate
 activ(Generate(nom), E) -> TERM(Nothing(), E ∪ {nom})
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
------------------------------------------ await-TERM
 activ(Await(nom), E) -> TERM(Nothing(), E)

                  nom ∉ E 
-------------------------------------------- await-SUSP
 activ(Await(nom), E) -> SUSP(Await(nom), E)

                   true
------------------------------------------- await-EOI
 eoi(Await(nom), E) -> STOP(Await(nom), E)

*/

class PrintAtom extends Generate {
  constructor(msg) {
    super('stdout', msg);
  }
}

/*

                true 
------------------------------------------ print
 activ(PrintAtom(nom), E) -> TERM(Nothing(), E ∪ {'stdout'})

*/

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

