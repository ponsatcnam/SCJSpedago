<!--- O. Pons juillet 2017 --->
<!---http://www-sop.inria.fr/meije/rp/SugarCubes/v1/SC-HTML/text.html --->
#Reactive Synchronous Objects  in Javascript,  Implementing SugarCubes in Javascript 

This document describes  step by step  a minimal (but fully
functional)  implementation of Sugar
Cube (V1) in Javascript.
Most of the code is a direct translation from java and most
explanations  come from the book "Objets Réactifs en java" by
F. Boussinot and from the thesis of J.F. Susini.


Our goal is to use it, to highlight all the pitfalls that are usually sweep under the carpet in the literature on synchronous reactive programming.
 

First we introduce reactives instruction, next we presente the reactive machine and the last part introduces the events. 


## Instructions
At each activation,  an  instruction returns a status code.
among *TERM*, *STOP*, *SUSP* 

- *TERM* : means that the instruction is terminated; there is nothing
more to execute neither at the current instant neither at the next instants.

All subsequent activations have no effect and immediately return *TERM*.

- *STOP* : means that the execution is terminated only for the current instant but there is still code to be activated at the next instants.

- *SUSP* :means that the execution is not in a stable state and should
be continued during the current instant. This is for example the cas of an instruction waiting for a not yet generated event.
Such event may be generated during the instant  by a parallel  instruction. 


We first define status code by the following constantes:

```javascript
const TERM = Symbol("TERM");
const STOP = Symbol("STOP");
const SUSP = Symbol("SUSP");
```


### (Abstract) Genrerics Instructions
To define instructions we  write an   abstracts class *Instruction*.
It contains a boolean flag to record the termination of the instruction.
The main method is the active *activ* method  that check the flag and
*if not terminated* run the activation method
and return the resulting code.

The activation method is abstract and should be defined in the specific child class.

Both have a parameter *m* which  is the reactive machine running the instruction. 

```javascript

class Instruction {
    constructor(){
        this.terminated =false;
    }
    reset(){this.terminated =false}
	
    terminate(){this.terminated =true }
    isTerminated(){return this.terminated;}
    activation(m){ throw new TypeError("Do not call abstract method activation from child. it should be defined in child");}
    activ(m){
        if(this.terminated){return TERM;}
        var res=this.activation(m);
        if(res===TERM){this.terminated=true}
        return res;
    }
     
}
```

We extend this method in two (still abstract) classes for Unary and Binary instructions.
UnaryInstruction  will have a body instruction and
BinaryInstruction, left and right instructions.

```javascript
class UnaryInstruction extends Instruction{
   
    reset(){super.reset();this.body.reset();}
    toString(){
        return this.construtor.name+"("+body.toString()+")";
    }
}
```

```javascript
class BinaryInstruction extends Instruction{
    reset(){
        super.reset();
        this.left.reset();
        this.right.reset();
    }
    toString(){
        return this.construtor.name+"("+left.toString()+","+right.toString()+")";
    }
}
```

### Basics instructions
*Noting*, *Stop*, *Seq*, *Merge*


```javascript
class Nothing extends Instruction{
    activation(m){return TERM;}
}


class Stop extends Instruction{
    activation(m){this.terminate();return STOP;}
}

class Seq extends BinaryInstruction{
    constructor(left,right){
	super();
	if(left && right){
	this.left =left;this.right=right;
	}else{console.log("bpb");throw new Error("eee");}
    }
    activation(m){
	if(this.left.isTerminated()){return this.right.activ(m);}
	var res=this.left.activ(m);
	if(res !=TERM) {return res;}
	return this.right.activ(m);
				     
    }
}


class Merge extends BinaryInstruction{
    constructor(left,right){
	super();
	this.ls=SUSP;
	this.rs=SUSP;
	this.left=left;
	this.right=right;
	
    }
    reset(){super.reset();this.ls=SUSP;this.rs=SUSP;}
    activation(m){
	if( this.ls==SUSP){ this.ls=this.left.activ(m);}
	if( this.rs==SUSP){ this.rs=this.right.activ(m);}
	if( this.ls==TERM && this.rs==TERM){return TERM}
	if( this.ls==SUSP  || this.rs==SUSP){return SUSP}
	this.ls=SUSP;this.rs=SUSP;
    return  STOP;
    }
}
```

### Atomics Instructions
We define a abstract class Atomic Instruction.
Its *activation* method just call an action method, run it with its argument and return *TERM*
The action method should be defined in all child to define specifics atomic actions.

```javascript
class Atom extends Instruction{
    action(m){throw new TypeError("Do not call abstract method activation from child. it should be defined in child");}}
    activation(m){
	this.action(m);
	return TERM;
    }
}

```


We now define a simple *Print* Instruction.
Its argument is just a message to be printed.

```javascript

class PrintAtom extends Atom{
    
    constructor(msg){
	super();
	this.msg=msg;
    }

    action(m){
	console.log(this.msg);
    }
}
```

And now a Generic Atomic instruction.
In this (unsure) version  the argument is an arbitrary javascript code.


```javascript
class ActionAtom extends Atom{
    
    constructor(){
	super();
	this.code=arguments;
    }

    action(m){
	var f=this.code[0];
	f.apply(null,( Array.prototype.slice.call(this.code,1)));
    }
}
```

###Looping instructions
We now define tow kinds  of Looping Instruction.
*Loop* for infinite loop and *Repeat* for finite loop.
Both classes will extend *UnaryInstruction*.

####Infinite loop
When the body of an infinite loop is terminated, it is automatically restarted.
We can left an infinite loop by using a *preemption* Instruction (like *Until* ) that are describer later. 

A loop is said to be "*instantaneous*" when its body terminates completely in the same instant it is started. Instantaneous loops should be rejected because such a loop would never converge to a stable state closing the instant. The *Loop*  class bellow detects instantaneous loops at run time, when the end of the loop body is reached twice during the same instant. In this case, the loop stops its execution for the current instant instead of looping for ever during the instant.


```javascript

class Loop extends UnaryInstruction{
    constructor(body){
	super();
	this.body=body;
	this.endReached=false
	this.first=true;
    }
    reset(){
	super.reset();
	this.endReached=false
	this.first=true;
    }
    activation(m){
	while(true){
	    var res=this.body.activ(m);
	    if(res != TERM){
		this.endReached=false;
		this.first=false;
		return res;
	    }
	    if(this.first || this.endReached){
		console.log("warning: instantaneous loop !");
		this.endReached=false;
		this.first=false;
		return STOP;
	    }
	    this.endReached=true;
	    this.body.reset();
	}
    }
}


```

```javascript
class Repeat extends UnaryInstruction{
    constructor(n,body){
	super();
	this.body=body;
	this.num=n;
	this.counter=n;
    }
    reset(){
	super.reset();
	this.counter=this.num;
	
    }
    activation(m){
	while(this.counter>0){
	    var res=this.body.activ(m);
	    if(res == TERM){
		this.counter--;
		this.body.reset();
	    }
	    else{return res;}
	}
	return TERM;
    }
}


```



### The reactive machine


A reactive machine of the Machine class runs a program which is an
instruction. Initially programs are the *Nothing* instruction
(which does nothing and terminates instantaneously).


Basically, Machine detects the end of the current instant, that is
when all parallel instructions of the program are terminated
or stopped. There is another case where the end of the current instant
is detected: when there is no new move in the program
after two activations of it; in this case, there is no hope that new
activations will change anything to the situation and the end
of the instant can be safely set. In this case the machine activates
the program once more, after having set the end of instant
flag, to let suspended instructions stop. Code for this is (see the activation method of Machine below):

```javascript

while ((res = program.activ(this)) == SUSP){
   if (move) move = false; else endOfInstant = true;
   }
   
```

Two methods are used to manage the two flags *move* and
*endOfInstant*:
- *newMove which* sets the move flag to indicate that something new
happens in the program (thus, end of instant has to be postponed), and
- *isEndOfInstant* which tests the endOfInstant flag.

The *add* method adds a new instruction to the program;
this new instruction is run in parallel with the previous program, using the *Merge* parallel instruction defined in section:

```javascript
public void add(Instruction inst){ 
  program = new Merge(program,inst); 
  newMove();
  }
```
Note that *newMove* is called to let the new instruction execute during the current instant.

Machine contains an environment named *eventEnv* to deal with events (events are described in section 5).

 
```javascript

class Machine{
    constructor(){
		this.program =new Nothing();
	    this.eventEnv = new EventEnv();
        this.instant=1;
        this.endOfInstant =false;
        this.move= false;
	}

	currentInstant(){return this.instant;}

    newMove(){this.move= true;}

    isEndOfInstant(){return this.endOfInstant;}

    add(inst){
        this.program = new Merge(this.program,inst);
        this.terminated=false;
        this.newMove();
    }

    //Events

    getEvent(name){
        return this.eventEnv.getEvent(name);
    }

    isGenerated(name){
        return this.eventEnv.getEvent(name).isPresent(this);

    }


    generate(name){
        this.eventEnv.getEvent(name).generate(this);
    }

    putEvent(name,event){
        this.eventEnv.put(name,event);
    }

   //Reaction
	react(){
        this.endOfInstant=false;
        this.move=false;
        while(this.program.activ(this)==SUSP){
         
            if(this.move) {this.move=false} else {this.endOfInstant=true}

        }
        this.instant++;
        
        
        //debug(this.instant);
    }
}

```
