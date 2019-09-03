class Counter
{
    constructor(){
	this.val = 0;
	this.sum = 0;
	this.count = 0;
    }
    incVal(i) { this.val += i; }
    value(){
        var res = this.val;
        this.sum += this.val;
        this.val = 0;
        this.count += 1;
        return res;
    }
    average(){
        this.sum += this.val;
        var res = this.sum / this.count;
        this.sum = 0;
	this.val = 0;
	this.count = 0;
        return res;
    }
}

class PrintCounterAverage // JavaInstruction
{
    execute(link){
        try{
            console.log("Average: "+(link.javaObject()).average());
        }catch(e){}
    }
}

class IncrementCounter //JavaInstruction
{
   execute(link){
        try{
            (link.javaObject()).incVal(1);
        }catch(e){}
    }
}

class PrintCounterValue // JavaInstruction
{
    execute(link){
        try{
            console.log("Counter: "+ link.javaObject().value());
        }catch(e){}
    }
}

class AwaitColors //JavaInstruction 
{
   
    constructor(b1,b2){
	this.b1 = b1;
	this.b2 = b2;// FIXME
    }
    execute(link){
	console.log("setting background colors");
        setBackground(this.b1,"green");
        setBackground(this.b2,"red");
    }
}
class ExitGame //JavaInstruction
{
   execute( link){
       // System.exit(0);
       console.log("End");
    }
}

class RandomRepeat extends Repeat
{
    constructor (body){
        super(Math.random()*10000,body);
    }

    rand(){ counter = Math.random()*10000; }
    clone(){
        var r = super.clone();
        r.rand();
        return r;
    }
}
