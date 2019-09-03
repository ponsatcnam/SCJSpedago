// A minimal  SugarCubes v2 directly translated from java
// O Pons summer 2019;

//var DEBUG=true;
var DEBUG=false;

var uu=33;
function debug(debug){
    if(DEBUG){
	[].unshift.call(arguments, "DEBUG:");
	console.log.apply(null,arguments)
    }
}

//A short minimal shallow clone
function clone(obj){
    var c=Object.assign(Object.create(Object.getPrototypeOf(obj)),obj)
    return c;
}
	    


const TERM = Symbol("TERM");
const STOP = Symbol("STOP");
const SUSP = Symbol("SUSP");


//INSTRUCTIONS

/*
public interface Instruction extends Cloneable,java.io.Serializable
{
    boolean isTerminated();
    byte activ(Context context);
   
}
*/

//abstact class
class Instruction {
    constructor(){
	this.terminated =false;
	this.firstActivationb = true;
    }
    isTerminated(){return this.terminated;}
    activation(context){ throw new TypeError("Do not call abstract method activation from child.");}
    firstActivation(context){ this.firstActivationb = false; }
    
  
    activ(context){
	if(this.terminated){return TERM;}
	if (this.firstActivationb) {this.firstActivation(context);}
	var res=this.activation(context);
	if (res == TERM) {this.lastActivation(context);}
	return res;
    }
    
    lastActivation(context){ this.terminated = true; }
    
    toString(){ return ""; }
    
    rest(){ return this.clone(); }
    
    residual(){
        if (terminated) {return new Nothing();} 
        return rest();
    }
    
    clone(){
        
        try{ return clone(this); }catch (e){
            throw (new Error("CLONE:"+e.toString())+"\n"+this);
	} 
        
    }
    
    freeze(context){};
    notifyWarmUpToJava(context){};
    notifyFreezeToJava(context){};
    notifyTerminationToJava(context){};
}

//still abstract
class UnaryInstruction extends Instruction{

    constructor (){
	super();
	this.body=new Nothing();
     }

    toString(){
	return this.construtor.name+"("+this.body.toString()+")";
    }
    clone(){
        var inst = super.clone();
        inst.body = this.body.clone();
        return inst;
    }
    activation(context){    
        return this.body.activ(context);
    }

    freeze(context){ this.body.freeze(context); }
    notifyFreezeToJava(context) {this.body.notifyFreezeToJava(context);}
    notifyWarmUpToJava(context) {this.body.notifyWarmUpToJava(context);}
    notifyTerminationToJava(context){this.body.notifyTerminationToJava(context);}
    

}


class BinaryInstruction extends Instruction{
    constructor(){
	super();
	this.left=new Nothing();
	this.right=new Nothing();
    }
    
    toString(){
	return this.construtor.name+"("+this.left.toString()+","+this.right.toString()+")";
    }

    clone(){
        var inst = super.clone();
        inst.left  = this.left.clone();
        inst.right = this.right.clone();
        return inst;
    }
}

//abstrast (was Interface)
/*
class Machine{
   program();
   react();
}
*/
//abstract (was interface)
/*
class Context{
    
    newMove();
    currentInstant();
    isEndOfInstant();

    setCurrentLink(link);
    currentLink();

    addToShell(name,inst);
    registerShell(name,shell);
    removeShell(name);

    freezeOrder(name);
    isToBeFrozen(name);
    storeFrozenInstruction(name,freezed);
    getFrozenInstruction(name);
}
*/
/*
    class JavaStringExpression extends java.io.Serializable,Cloneable
    {
    String evaluate(Link self);
    }
*/

class JavaBooleangValue {
    constructor(b){
	this.b=b;
    }
    evaluate(/*link*/ self) {  this.b; }
    toString(){return ""+this.b;}
}

    
class JavaInstructionValue {
    constructor(i){
	this.i=i;
    }
    evaluate(/*link*/ self) { return this.i; }
    toString(){return this.i.toString();}
}

class JavaIntegerValue {
    constructor(i){
	this.i=i;
    }
    evaluate(/*link*/ self) { return this.i; }
    toString(){return ""+this.i;}
}

    
class JavaObjectValue {
    constructor(o){
	this.obj=o;
    }
    evaluate(/*link*/ self) { return this.obj; }
    toString(){return this.obj.toString();}
}

class JavaStringValue {
    constructor(s){
	this.str=s;
    }
    evaluate(/*link*/ self) { return this.str; }
    toString(){return this.str;}
}

   
  class JavaEmptyInstruction 
{
  execute(/* Link*/ self) {}
  toString(){ return "{}"; }
}



class MyPrintInstruction {
    
    constructor(msg){
	
        this.message = msg;
    }
    execute(/*Link*/ self){
	console.log(this.message);
    }
}
//freezable
//////////
class Freezable extends UnaryInstruction{
    constructor(n,i){
	super();
	this.reanim = false;
	this.name = "noname";
	 this.nameExpression = null;
	if (typeof n === 'string'){
	    this.nameExpression = new JavaStringValue(n);
	}
	else{
	    this.nameExpression = n;
	}
	this.body=i;   //// FIXME
	debug("FREEZABLE constructor",n,i,this.body);
    }
    

    namef(){ return this.name; }
    
    doFreeze(context){
        if(this.firstActivationb||this.terminated) return true;
        if(context.isToBeFrozen(this.name)){
            var i = /* Freezable*/ this.residual();
            i.reanim = true;
            context.storeFrozenInstruction(this.name,i);
            this.notifyFreezeToJava(context);
            this.body = new Nothing();
	    this.terminated = true;
            return true;
        }
        return false;
    }
    
    freeze(context){
        if(this.doFreeze(context)) return;
        super.freeze(context);
    }
	
    toString(){
        return "freezable "+this.nameExpression+" "+this.body+" end";
    }
    rest(){
        return new Freezable(this.nameExpression,this.body.residual());
    }
    firstActivation(context){
	uu=context;
        this.name = this.nameExpression.evaluate(context.currentLinkf());
        this.nameExpression = new JavaStringValue(this.name);
        if(this.reanim){
            this.reanim = false;
            this.notifyWarmUpToJava(context);
        }
        super.firstActivation(context);
    }
}


    //Cube
class Cube extends Freezable
{
    
    constructor(s,o,i,fin,f,w){
	debug("CUBE constructor\n",s,o,i,fin,f,w);
	if(w){
        super(s,i);
        this.obj = o;
	this.onWarmUp = w;
	this.onFreeze = f;
	this.onTerminate = fin;
	}
	else{
	    if(i){
		var ss=new JavaStringValue(s);
		var oo=new JavaObjectValue(o);
		super(ss,i);
		this.obj = oo;
		this.onWarmUp =new JavaEmptyInstruction();
		this.onFreeze = new JavaEmptyInstruction();
		this.onTerminate =new JavaEmptyInstruction()
	    }else{
		 super(s,o);
		this.obj = null;
		this.onWarmUp =new JavaEmptyInstruction();
		this.onFreeze = new JavaEmptyInstruction();
		this.onTerminate =new JavaEmptyInstruction()
	    }
	}
	debug("CUBE constructor",this.body.toString());
    }
	/*
    public Cube(String s,Object o,Instruction i){
        this(new JavaStringValue(s),new JavaObjectValue(o),i
          ,new JavaEmptyInstruction(),new JavaEmptyInstruction(),new JavaEmptyInstruction());
    }
    public Cube(String s,Instruction i){ this(s,null,i); }
	*/

    
    add(inst){
	debug("CUBE ADD",this.toString(),inst);
        if(this.firstActivationb){ this.body = new Merge(this.body,inst); return; }
        this.shell.add(inst);
    }
     bodyf(){
        if(this.firstActivationb) return this.body;
        return this.shell.bodyf();
    }
    javaObject(){
        if(!this.firstActivationb) return this.link.javaObject();
        console.error("Warning: Link not yet activated"); 
        return null;
   }
    superLink(){ return this.link.superLink(); }
   toString(){
        return "cube "+this.namef()+
	    " "+this.bodyf()+" on freeze "+this.onFreeze+" onWarmUp "+this.onWarmUp+" finalize "+this.onTerminate+" end";
    }
    rest(){
        return new Cube(this.nameExpression,new JavaObjectValue(this.javaObject()),this.bodyf().residual(),this.onTerminate,this.onFreeze,this.onWarmUp);
    }
    
    buildBody(){
        this.body = new Until(new PosConfig(this.name+"-destroy"),
			      (this.link = new LinkImpl(this.obj,
						   this.shell = new ShellImpl(this.name,this.body),
						   this.onTerminate,
						   this.onFreeze,
						   this.onWarmUp
						  )
			      )
			     );
    }
     firstActivation(context){
        super.firstActivation(context);
        this.buildBody();
        this.link.setCube(this);
    }
    notifyWarmUpToJava( context){
        this.body.notifyWarmUpToJava(context);
        this.body = new Seq(new JavaAtom(this.onWarmUp),this.body);
    }
}

    
//implement Machine et Context (ou domain) et etends Cubes
    class EventMachine  extends Cube {    
	constructor(n="noname",obj,i,fin,f,w){
	    debug("EVENTMACHINE constructor :\n","OBJ \n",obj,"I\n",i);
	    if(!obj){super(n, new Nothing());debug("ICI"); }
	    if(obj && !i){super(n, obj);}
	    if(obj && i && fin && f && w){super(n,obj,i,fin,f,w);}
	    this.instant=1;
	    this.endOfInstant =false;
	    this.beginingOfInstant = true;
	    this.move= false;
	    
	    this.frozenStore = {}
	    this.addToShell = {}
            this.shellEnv = {}
	    
            this.toFreeze = []
	    this.presentEvents =[]
	    
            this.currentLink = this;
	
	    this.addToProgram = null; //instruction
	    
	   
	}

	setCurrentLink(link){ this.currentLink = link; }
	currentLinkf(){ return this.currentLink; }
	stopReached(){}
	add(inst){
	    debug("EventMachine add",inst,this.addToProgram);
            //synchronized(this){ //FIXME je dirais inutil
	    if(this.addToProgram!=null){
		debug("ADDTOPG",this.addToProgram);
                this.addToProgram = new Merge(this.addToProgram,inst);
	    }
	    else{
		debug("CASNUL",this.addToProgram);
                this.addToProgram = inst;
	    }
            //}
	}
	
	addToShell(name,inst){
	    
            this.old = this.addToShell[this.name];
            if (this.old==null){
		this.addToShell[this.name]=this.inst;
	    }
            else{
		this.addToShell[this.name]=new Merge(this.old,this.inst);
	    }
	}
	
	processAddToShell(){
	    var list = Object.keys(this.addToShell);
            if (list.length<1) {return;}
           
            for (var i=0;i<list.length;i++){
		name = list[i];
		shell = this.shellEnv[name];
		if (typeof shell == "undefined"){
                    console.error("unknown shell: "+name);
		}
		else{
                shell.add(this.addToShell[name]);
		}
	    }
		addToShell={}; //sans doute inutile
	}
	
	registerShell( name,shell){ this.shellEnv[name]=shell; }
	removeShell(name){ delete this.shellEnv[name]; }
	currentInstant(){return this.instant;}
	newMove(){this.move= true;}
	newInstant(){ this.instant++; this.presentEvents=[]; }
	notifyBeginOfInstantToJava(){}

	activation( context){
	    debug("Event Machine Activation");
	    this.move = false;
            if(this.beginingOfInstant){
            //synchronized(this){
                if(this.addToProgram !=null){ super.add(this.addToProgram); this.addToProgram = null; }
            //}
		this.notifyBeginOfInstantToJava();
		this.processAddToShell();
		this.beginingOfInstant = false;
            }
	    debug("EVENT MACHINE SUPER",super.toString());
            var res = super.activation(this);
            if (res == STOP){
		this.endOfInstant = false;
		this.newInstant();
		this.beginingOfInstant = true;
		this.processFreezeOrders();
		this.notifyEndOfInstantToJava();
            }
            else if(res == SUSP){
		if (!this.move) {this.endOfInstant = true;}
		context.newMove();
            }
            return res;
	}

	notifyEndOfInstantToJava(){}
	isEndOfInstant(){ return this.endOfInstant; }
	rest(){
            return new EventMachine(new JavaStringValue(this.namef()),
				    new JavaObjectValue(javaObject()),
				    this.bodyf().residual(),
				    this.onTerminate,
				    this.onFreeze,
				    this.onWarmUp);
    }
   toString(){
        return "machine "+this.namef()+" "+this.program()+" end";
    }

	freeze(context){ this.doFreeze(context); }
	
	freezeOrder(name){ this.toFreeze.push(name); }
	
	isToBeFrozen(name){ return this.toFreeze.includes(name); }
	processFreezeOrders(){
            if (this.toFreeze.legnth<1) return; //empty
            this.bodyf().freeze(this);
            this.toFreeze=[]; //removeAllElements();
	}
	storeFrozenInstruction(name,frozen){
            this.frozenStore[name]=rozen;
    }
	getFrozenInstruction(name){
            return delete this.frozenStore(name);
    }
	react(){
            var res = SUSP;
            while (res == SUSP) res = this.activ(this);
            return res == TERM ? true : false;
	}
	program(){
    	    return this.bodyf();
	}
	isGenerated(name){
            return this.presentEvents.includes(name);
	}
	generate(name){
            if(!this.presentEvents.includes(name)) {this.presentEvents.push(name);}
	}
	swapEventPresence(name,presence){
            var present = this.presentEvents.includes(name);
    	    if(presence){
		if(!present) {this.presentEvents.push(name);}
    	    }
            else{
		if(present) this.presentEvents.splice(this.presentEvents.indexOf(name),1); //remove name
	    }
            return present;
	}
	clone(){
            var inst =super.clone();
            inst.frozenStore ={};
            inst.addToShell ={};
            inst.shellEnv = {};
            inst.toFreeze = [];
            inst.presentEvents = [];
            inst.currentLink = inst;
            inst.addToProgram = this.addToProgram.clone();
            return inst;
    }






}

//INSTRUCTIONS DE BASE
class Nothing extends Instruction{
    activation(context){return TERM;}
    toString(){ return "nothing"; }
}

class Stop extends Instruction{
    constructor(){
	super();
	this.ended=false;
    }
     toString(){ return "stop"; } 
    activation(context){
	if (this.ended) return TERM; this.ended = true;
	return STOP;
    }
}


class Halt extends Instruction {
    toString(){ return "halt"; }
    activation(context){ return STOP; }
}



class Seq extends BinaryInstruction{
    constructor(left,right){
	super();
	if(left && right){
	this.left =left;this.right=right;
	}else{throw new Error("arity probleme in Seq constructor");}
    }
    toString(){ return this.left+"; "+this.right; }
    rest(){
        if (this.left.isTerminated()) return this.right.residual();
        return new Seq(this.left.residual(),this.right);
    }
    activation(context){
	if(this.left.isTerminated()){return this.right.activ(context);}
	var res=this.left.activ(context);
	if(res !=TERM) {return res;}
	return this.right.activ(context);
				     
    }
    freeze(context){ 
        if(this.left.isTerminated())
        {this.right.freeze(context);}
        else
        { this.left.freeze(context);}
    }

    notifyTerminationToJava(context){
        if(this.left.isTerminated())
        {this.right.notifyTerminationToJava(context);}
        else
        {this.left.notifyTerminationToJava(context);}
	}
    notifyWarmUpToJava(context){
        if(this.left.isTerminated())
        {this.right.notifyWarmUpToJava(context);}
        else
        {this.left.notifyWarmUpToJava(context);}
    }
    
    notifyFreezeToJava(context){
        if(this.left.isTerminated())
        {this.right.notifyFreezeToJava(context);}
        else
        {this.left.notifyFreezeToJava(context);}
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
    toString(){ return "("+this.left+" || "+this.right+")"; }
    
    //reset(){super.reset();this.ls=SUSP;this.rs=SUSP;}
     rest(){ 
        if (this.left.isTerminated()) return this.right.residual();
        if (this.right.isTerminated()) return this.left.residual();
        return new Merge(this.left.residual(),this.right.residual());
    }
    activation(context){
	debug("MERGE ACTIVATION",this.toString());
	if( this.ls==SUSP){ this.ls=this.left.activ(context);}
	if( this.rs==SUSP){ this.rs=this.right.activ(context);}
	if( this.ls==TERM && this.rs==TERM){return TERM}
	if( this.ls==SUSP  || this.rs==SUSP){return SUSP}
	this.ls=SUSP;this.rs=SUSP;
    return  STOP;
    }

    freeze(context){ 
        this.left.freeze(context);
	this.right.freeze(context); 
    }
    notifyTerminationToJava(context){
        this.left.notifyTerminationToJava(context);
        this.right.notifyTerminationToJava(context);
    }
    notifyWarmUpToJava(context){
        this.left.notifyWarmUpToJava(context);
        this.right.notifyWarmUpToJava(context);
    }
    notifyFreezeToJava(context){
        this.left.notifyFreezeToJava(context);
        this.right.notifyFreezeToJava(context);
    }
}

class Atom extends Instruction{
    action(context){}//abstact
    activation(context){
	this.action(context);
	return TERM;
    }
}




class PrintAtom extends Atom{
    
    constructor(msg){
	super();
	this.msg=msg;
    }
    
    action(context){
	console.log(this.msg);
    }
    
    equals(inst){
        return inst.constructor.name =='PrintAtom' && this.message == inst.message;
    }

    toString(){return "{console.log(\""+this.msg+"\")}";}
}


class PrintTime extends Atom{
    
    constructor(msg){
	super();
	this.cpt=0;
	this.msg=msg ||"";
    }

    action(context){
	var last = this.cpt;
        this.cpt = Date.now();
	console.log(this.msg+" (d: "+(this.cpt-last)+")");
    }

    equals(inst){
        return inst.constructor.name =='PrintTime' && this.message == inst.message;
    }
}



   
 class JavaAtom extends Atom
{
   
    constructor(inst){
	super()
	this.javaInst = inst;
    }
    

    action(context){

        this.javaInst.execute(context.currentLinkf());
    }
    toString(){
        return this.javaInst.toString();
    }

}    
//je laisse mommentanement
class ActionAtom extends Atom{
    
    constructor(){
	super();
	this.code=arguments;
    }

    action(context){
	var f=this.code[0];
	f.apply(null,( Array.prototype.slice.call(this.code,1)));
    }
}

//boucles
class Cyclic extends UnaryInstruction
{
    constructor(inst){
	super();
	if(inst){
	    this.model = inst; this.body = this.freshBody();
	}
	else{
	    this.model = null;
	}
    }
    
    freshBody(){ return this.model.clone(); }
}



class Loop extends Cyclic{
    constructor(inst){
	super(inst);
	this.endReached=false
	this.first=true;
    }
    toString(){ return "loop "+this.body+" end"; }

/*
    reset(){
	super.reset();
	this.endReached=false
	this.first=true;
    }
*/
    rest(){ 
        return new Seq(this.body.residual(),new Loop(this.freshBody()));
    }
    
    activation(context){
	while(true){
	    var res=this.body.activ(context);
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
	    this.body=this.freshBody();
	}
    }
}




class Repeat extends Cyclic{
    constructor(nOrExp,inst){
	super(inst);
	this.counter=undefined;
	if (typeof nOrExp == 'number'){
	    this.intExp=new JavaIntegerValue(nOrExp);
	}else{
	    this.intExp=nOrExp;
	   
	}
    }
/*	
    reset(){
	super.reset();
	this.counter=this.num;
	
    }
*/
	rest(){ 
            if (this.counter <= 1) return this.body.residual();
            return new Seq(this.body.residual(),new Repeat(this.counter-1,this.freshBody()));
	}
	
	toString(){ return "loop "+this.intExp+" times "+this.body+" end"; }

	firstActivation(context){
    	    this.counter = this.intExp.evaluate(context.currentLinkf());
    	    super.firstActivation(context);
	}
	
	activation(context){
	while(this.counter>0){
	    var res=this.body.activ(context);
	    if(res == TERM){
		this.counter--;
		this.body=this.freshBody();
	    }
	    else{return res;}
	}
	return TERM;
    }
}
    class If extends BinaryInstruction{
	constructor(cond,t,e){
	    super();
	    this.value=undefined;
	    this.condition = cond;
	    this.left = t;
	    this.right = e ||new Nothing();
	}
	toString(){ 
        if (this.right instanceof Nothing) return  "if "+this.condition+" then "+this.left+" end";
        if (this.left instanceof Nothing) return  "if "+this.condition+" else "+this.right+" end";
        return "if "+this.condition+" then "+this.left+" else "+this.right+" end"; 
    }

	rest(){ 
        if (!firstActivationb) return value ? left.residual() : right.residual();
        return super.rest();
	}
	firstActivation(context){
            value = this.condition.evaluate(context.currentLinkf());
            super.firstActivation(context);
	}
	
	activation(context){
            return this.value ? this.left.activ(context) : this.right.activ(context);
    }
	freeze(context){ 
            if(this.value)
	    {this.left.freeze(context);}
            else{
		this.right.freeze(context);
	    }
	}
	
	notifyTerminationToJava(context){
            if(this.value)
	    {this.left.notifyTerminationToJava(context);}
            else{
		right.notifyTerminationToJava(context);
	    }
	}
	
	notifyWarmUpToJava(context){
        if(this.value)
            {this.left.notifyWarmUpToJava(context);}
            else{
		this.right.notifyWarmUpToJava(context);
	    }
	}
	
	notifyFreezeToJava(context){
            if(this.value)
	    {this.left.notifyFreezeToJava(context);}
            else{
		this.right.notifyFreezeToJava(context);
	    }
	}
    }

// EVENTS
////////
const PRESENT = Symbol("PRESENT");
const ABSENT = Symbol("ABSENT");
const UNKNOWN = Symbol("UNKNOWN");

//configuration
// abstract class just to remember that configuration should have 2 methode
class Config {
    fixed(context){throw new TypeError("Do not call abstract method fixed from child.");} 
    evaluate(context){throw new TypeError("Do not call abstract method evaluate from child.");}
    clone(){
        try{ return clone(this); } catch (e){
            throw new InternalError(e.toString());
        } 
    }
}

//configuration Unuaires
class UnaryConfig extends Config{
    
    namef(){
	return this.eventName
    }
    event(context){
	return context.getEvent(this.eventName);
    }
    fixed(context){
	return this.event(context).presence(context) != UNKNOWN;
    }
}

class PosConfig extends UnaryConfig{
    constructor(eventNameOrexpr){
	super();
	this.eventName=null;
	if(typeof eventNameOrexpr == 'string'){
	    this.eventNameToEvaluate = new JavaStringValue(eventNameOrexpr);
	}else{
	    eventNameToEvaluate = eventNameOrexpr;
	}
    }
    toString(){ return this.eventNameToEvaluate.toString(); }
    evaluate(domain){
	return domain.isGenerated(this.eventName);
    }
    computeName(domain){
    	this.eventName = this.eventNameToEvaluate.evaluate(domain.currentLinkf());
    	this.eventNameToEvaluate = new JavaStringValue(this.eventName);
    }
     fixed(domain){
        if(this.eventName == null) this.computeName(domain);
        return domain.isGenerated(this.eventName)?true:domain.isEndOfInstant();
    }
}



class NotConfig extends Config{
    constructor(enventNameOrC){
	super();
	if(enventNameOrC instanceof Config){this.c=enventNameOrC;}
	if(typeof enventNameOrC =='string'){this.c=new PosConfig(enventNameOrC);}
	if(enventNameOrC instanceof JavaStringExpression){this.c=new PosConfig(enventNameOrC);}
    }
    clone(){
	var config= super.clone();
	config.c=this.c.clone();
	return config;
    }
    toString(){
        return "not "+this.c;
    }
    evaluate(context){
	return !this.c.evaluate(domain);
    }
    fixed(domain){ 
        return this.c.fixed(domain); 
    }
}

//configuration binaires

class BinaryConfig  extends Config{
    constructor(c1,c2){
	this.c1=c1;
	this.c2=c2;
    }
    clone(){
	var config = super.clone();
        config.c1 = this.c1.clone();
        config.c2 = this.c2.clone();
        return config;

    };
}


class AndConfig extends BinaryConfig{
    constructor(c1,c2){
	super(c1,c2);
    }
    toString(){ return "("+this.c1+" and "+this.c2+")"; }
    
    fixed(context){
	var b1=this.c1.fixed(context);
	var b2=this.c2.fixed(context);
	if(b1 && !this.c1.evaluate(context)){return true}
	if(b2 && !this.c2.evaluate(context)){return true}
	return b1 && b2;
    }  
    
    evaluate(context){
	return this.c1.evaluate(context) && this.c2.evaluate(context);
    }
}


class OrConfig extends BinaryConfig{
    constructor(c1,c2){
	super(c1,c2);
    }
    /** La disjunction est fixée  des qu'un element est fixé et evalué a true,
     l'autre n'a pas besoin d'etre evalué */
    fixed(context){
	var b1=this.c1.fixed(context);
	var b2=this.c2.fixed(context);
	if(b1 && this.c1.evaluate(context)){return true}
	if(b2 && this.c2.evaluate(context)){return true}
	return b1 && b2;
    }
    
    evaluate(context){
	return this.c1.evaluate(context) || this.c2.evaluate(context);
    }
}


//Instruction Evénementielles
class  Generate extends Atom{
    constructor(nameOrStingExp){
	super();
	if(typeof nameOrStingExp =='string'){
	this.eventName=new JavaStringValue(nameOrStingExp);
	}else{this.eventName=nameOrStingExp;}
	
    }
    toString(){
        return "generate "+this.eventName;
    }
    action(context){
	context.generate(this.eventName.evaluate(context.currentLinkf()));
        context.newMove();
    }
}

//control par un evenement 
class Control extends UnaryInstruction{
    constructor(name,body){
	super();
	this.eventName=name;
	this.body=body;
    }
    toString(){ return "control "+this.body+" by "+this.eventName; }
     rest(){ 
        return new Control(this.eventName,this.body.residual()); 
    }
    activation(context){
	if (context.isGenerated(this.eventName)){
	    return this.body.activ(context);
	}
        else{
            if(context.isEndOfInstant()){
		return STOP;
	    }
            else{
		return SUSP;
	    }
	}
    }
}
    


class Await extends Instruction{
    constructor(configOrName){ //name ou config
	super();
	this.config=(configOrName instanceof Config)?
	    configOrName:
	    new PosConfig(configOrName);
    }
    toString(){ return "await "+this.config; }
    clone(){
        var inst = super.clone();
        inst.config = this.config.clone();
        return inst;
    }
    
    
    activation(context){
	if (this.ended) return {TERM};
	if(!this.config.fixed(context)){return SUSP};
	if(!this.config.evaluate(context)){return STOP};
	this.ended = true;
	return context.isEndOfInstant()?STOP:TERM;
	
    }
}



class Until extends BinaryInstruction{
    constructor(config,body,handler){
	super();
	//config may be a name
	if (typeof config =='string') config=new PosConfig(config);
	this.config=config;
	this.left=body;
	this.right=(handler|| new Nothing());
	this.activHandle=false,
	this.resumeBody=true;
    }

    toString(){ 
        if (this.right instanceof Nothing) return "do "+this.left+" until "+this.config;
        return "do "+this.left+" until "+this.config+" actual "+this.right+" end"; 
    }
    clone(){
	 var inst = super.clone();
        inst.config =this.config.clone();
        return inst;
    }
    

    rest(){ 
        if (this.activeHandle) {return this.right.residual();}
        {return new Until(this.config,this.left.residual(),this.right);}
    }
    
    activation(context){
//	debug("LOG",this.config,"  ",this.config.constructor.name)
	if(this.activHandle){return this.right.activ(context);}
	if(this.resumeBody){
	    var res=this.left.activ(context);
	    if(res !=STOP){return res;}
	    this.resumeBody=false;
	}
	if(!this.config.fixed(context)){return SUSP}
	if(this.config.evaluate(context)){
	    this.activeHandle =true;
	    if(context.isEndOfInstant()){return STOP;}
	    return this.right.activ(context);
	}

	this.resumeBody=true;
	return STOP;
    }


    freeze(context){
        if(this.activeHandle){
            this.right.freeze(context);
	}
        else{
            this.left.freeze(context);
	}
    }
    notifyTerminationToJava(context){
        if(activeHandle){
            right.notifyTerminationToJava(context);
	}
        else{
            left.notifyTerminationToJava(context);
	}
    }
    notifyWarmUpToJava(context){
        if(activeHandle){
            right.notifyWarmUpToJava(context);
	}
        else{
            left.notifyWarmUpToJava(context);
	}
    }
    notifyFreezeToJava(Ccontext){
        if(activeHandle){
            right.notifyFreezeToJava(context);
	}
	else{
            left.notifyFreezeToJava(context);
	}
    }

}

//Test de configuration
class When extends BinaryInstruction{
    constructor(config,cthen,celse){
	super();
	if(typeof config == 'string'){
	    this.config=config;
	}else{	this.config=PosConfig(config);}
	this.left=cthen;
	this.right=celse;
	this.confEvaluated=false;
	this.value=false;
    }
    toString(){ 
        return "when "+this.config+" then "+this.left+" else "+this.right+" end"; 
    }
     rest(){ 
        if (this.confEvaluated) return this.value ? this.left.residual() : this.right.residual();
        return super.residual();
     }
    clone(){
	var inst = super.clone();
        inst.config = this.config.clone();
        return inst;
    }
    
    activation(context){
	if(!this.confEvaluated){
	    if(this.config.fixed(context)){return SUSP;}
	    this.value=this.config.evaluate(context);
	    this.confEvaluated=true;
	    if(context.isEndOfInstant()) return STOP;
	}
	return this.value? this.left.activ(context):this.right.activ(context);
    }
    notifyTerminationToJava(context){
        if(this.confEvaluated){
            if(this.value){
                this.right.notifyTerminationToJava(context);
	    }
            else{
                this.left.notifyTerminationToJava(context);
            }
	}
    }
    notifyWarmUpToJava(context){
        if(this.confEvaluated){
            if(this.value){
                this.right.notifyWarmUpToJava(context);
	    }
            else{
                this.left.notifyWarmUpToJava(context);
            }
	}
    }
    notifyFreezeToJava(context){
        if(this.confEvaluated){
            if(this.value){
                this.right.notifyFreezeToJava(context);
	    }
            else{
                this.left.notifyFreezeToJava(context);
	    }
        }
    }
}



//Evenement Local
class EventDecl extends UnaryInstruction{
    constructor(localName,body){
	super();
	this.internalName=localName;
	this.body=body;
	this.local=false;
	this.external=undefined;
    }
    toString(){ 
        return "event "+this.eventName+" in "+this.body+" end";
    }
     rest(){ 
        return new EventDecl(this.eventName,this.body.residual()); 
    }
    activation(context){
	this.external = context.swapEventPresence(this.eventName,this.local);
        var res = this.body.activ(context);
        this.local = context.swapEventPresence(this.eventName,this.external);
        if(res == STOP) {this.local = false;}
        return res;
    }
}

class IODecl extends EventDecl
{
    constructor(localName,actualName,body){
	if(typeof actualName == 'string'){actualName=new JavaStringValue(actualName)}
	super(localName,body);
        this.actualNameExp = actualName;
	this.start=false;
	this.actualName=undefined;
    }
    

    toString(){ 
        return "inputoutput "+this.eventName+" is "+this.actualNameExp+" in "+this.body+" end";
    }
    rest(){ 
        return new IODecl(this.eventName,this.actualNameExp,this.body.residual()); 
    }
    firstActivation(context){ 
        this.actualName = this.actualNameExp.evaluate(context.currentLinkf());
	this.actualNameExp = new JavaStringValue(this.actualName);
        super.firstActivation(context);
    }
    setInput(domain){
        this.local = this.local ||(this.start = domain.isGenerated(this.actualName));
    }
   activation(context){ 
        this.setInput(context);
        var res = super.activation(context);
        this.setOutput(context);
        return res;
   }
    
    setOutput(domain){
        if(!this.start && this.local) domain.generate(this.actualName);
    }
}




//Instruction Evénementielles
//////////////////////////////


///TESTS
/////////
/*
var machine=new Machine(10);
//test sans boucle
var inst=new Seq(
    new Merge(
	new Seq(new Stop(),new PrintAtom("left")),
	new PrintAtom("right")),
    new PrintAtom("end of inst")
);

//test boucle
var inst= new Loop(new Seq(new PrintAtom("Hello World!"),new Stop()));
var inst= new Merge(new Loop(new Seq(new PrintAtom("Hello World!"),new Stop())),
		    new Repeat( 5,new PrintAtom("second branche"))
		   );


var inst = new Merge(
          new EventDecl("Hello",
              new Merge(
                  new Seq(new Await("Hello"),new PrintAtom("Hello internal World!"))
                  ,new Seq(new Stop(),new Generate("Hello"))
) )
    ,new Seq(new Generate("Hello"),new Seq(new Stop(),new Seq (new Await("Hello"),
							       new PrintAtom("Hello exterior World !"))
					  )));


var inst=
    new Merge(
	new Control("Tick",
		    new Seq(new PrintAtom("Hello ")
			    ,new Seq(new Stop(),new Seq(new PrintAtom("World!"),new Stop())))
		   ),
	new Repeat(4,new Seq(new Generate("Tick"),new Stop()))
    );

var inst=
    new Merge(
	new Until(new PosConfig("kill_it"),
                  new Loop(
                      new Seq(new Seq(new Await("Hello")
                                      ,new PrintAtom("Hello World!")),new Stop())
		  )
                  ,new PrintAtom("Goodbye!")
			       )
	,new Repeat(4,new Seq(new Generate("kill_it"),new Stop()))
    );



var inst= new Merge(new Loop(new Seq(new ActionAtom(()=>console.log(5*9)),new Stop())),
		    new Repeat( 5,new PrintAtom("second branche"))
		   );

*/
/*
machine.add(inst);
machine.react();
  */  
/* moudule */
/*
module.exports = {
    Instruction:Instruction,
    UnaryInstruction:UnaryInstruction,
    BinaryInstruction:BinaryInstruction,
    Machine:Machine,
    Nothing:Nothing,
    Stop:Stop,
    Seq:Seq,
    Merge:Merge,
    Atom:Atom,
    PrintAtom:PrintAtom,
    ActionAtom:ActionAtom,
    Loop:Loop,
    Repeat:Repeat,
    Event:Event,
    EventEnv:EventEnv,
    Config:Config,
    UnaryConfig: UnaryConfig,
    PosConfig:PosConfig,
    NegConfig:NegConfig,
    BinaryConfig:BinaryConfig,
    AndConfig:AndConfig,
    OrConfig:OrConfig,
    Generate:Generate,
    Control:Control,
    Await:Await,
    Until: Until,
    When:When,
    EventDecl:EventDecl

 }
*/

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
class LinkImpl  extends UnaryInstruction{
    constructor( obj, i , fin, f, w){
	super();
	if(obj instanceof JavaObjectValue){}else{obj=new JavaObjectValue(obj)}
	this.joe = obj;
	this.body = i;
	this.onTerminate = fin;
	this.onFreeze = f;
	this.onWarmUp = w;
	this.javaObject = null;
	this.superLink=this,
	this.trueLink = this;
    }

    javaObjectf(){
        return this.javaObject;
    }
    superLink(){ return this.superLink; }

    setCube(cube){ this.trueLink = cube; }
    toString(){
        return "link "+this.body+" on freeze "+this.onFreeze+ " on warm up "+this.onWarmUp+" on terminate "+this.onTerminate+" end";
    }
    rest(){
        return new LinkImpl(this.joe,this.body.residual(),this.onTerminate,this.onFreeze,this.onWarmUp);
    }
    firstActivation(context){
        this.javaObject = this.joe.evaluate(context.currentLinkf());
        this.joe = new JavaObjectValue(this.javaObject);
        super.firstActivation(context);
    }
    activation(context){
        this.superLink = context.currentLinkf();
        context.setCurrentLink(this.trueLink);
        var res = this.body.activ(context);
        context.setCurrentLink(this.superLink);
        return res;
    }
    
    lastActivation(context){
        this.onTerminate.execute(this.trueLink);
        super.lastActivation(context);
    }

    notifyTerminationToJava( context){
        this.superLink = context.currentLinkf();
        context.setCurrentLink(this.trueLink);
        this.body.notifyTerminationToJava(context);
        this.onTerminate.execute(this.trueLink);
        context.setCurrentLink(this.superLink);
    }

    notifyFreezeToJava( context){
        this.superLink = context.currentLinkf();
        context.setCurrentLink(this.trueLink);
        this.body.notifyFreezeToJava(context);
        this.onFreeze.execute(this.trueLink);
        context.setCurrentLink(this.superLink);
    }
    notifyWarmUpToJava( context){
        this.body.notifyWarmUpToJava(context);
        this.body = new Seq(new JavaAtom(this.onWarmUp),this.body);
    }
}
 class ShellImpl extends UnaryInstruction
{
    constructor(n,i){
	super();
	if(typeof n == 'string'){n=new JavaStringValue(n)}
	this.name = "noname";
	this.nameExp = n
	this.body=i;
    }
    namef(){ return this.name; }
    add(inst){
        
	this.body = new Merge(this.body,inst);
	debug("add in SHELLIMP", "\n THIS :",this.toString(),"INST \n",inst);
    }
    toString(){
        return "shell "+this.nameExp+" "+this.body+" end";
    }
     bodyf(){ return this.body; }
    rest(){ 
        return new ShellImpl(this.nameExp,this.body.residual());
    }
   firstActivation( context){
        this.name = this.nameExp.evaluate(context.currentLinkf());
        this.nameExp = new JavaStringValue(this.name);
        context.registerShell(this.name,this);
        super.firstActivation(context);
    }
    lastActivation(context){
        context.removeShell(this.name);
        super.lastActivation(context);
    }
   notifyFreezeToJava(context){
        super.notifyFreezeToJava(context);
        context.removeShell(this.name);
    }
   notifyTerminationToJava(context){
        super.notifyTerminationToJava(context);
        context.removeShell(this.name);
   }
}
//first test
var machine = new EventMachine();

//exemple 1
/*
var inst = new Seq(
    new Merge(
	new Seq(new Stop(),new PrintAtom("left ")), new PrintAtom("right ")),
    new PrintAtom("end "));

//var inst=new PrintAtom("left ");
console.log(inst.toString());

machine.add(inst);
//console.log(machine);
for (var i = 1; i<4; i++){
    console.log("instant "+i+": ");
    machine.react();
    console.log("\n");
} 
//FIN EXEMPLE 1
*/
//exemple 2
/*
 function run(){
     console.log("instant "+machine.currentInstant()+":");
     machine.react();

    }
    function inst(){
        return new Seq(new Await(new PosConfig("e")),new PrintAtom("e! ")); 
    }
    function main () {
        machine.add(inst());
        run();
        machine.add(inst());
        run();
        machine.add(new Generate("e")); 
        run();
    }
main();
//FIN Exemple 2
*/
//exemple 3
 function run(){
     console.log("instant "+machine.currentInstant()+":");
     machine.react();

    }
    function inst(){
        return new Seq(new Await(new PosConfig("e")),new JavaAtom(new MyPrintInstruction("e !")));
    }
    function main () {
        machine.add(inst());
        run();
        machine.add(inst());
        run();
        machine.add(new Generate("e")); 
        run();
    }
main();
