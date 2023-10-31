let {
  Machine,
  Nothing,
  Stop,
  Seq,
  Merge,
  PrintAtom,
  ActionAtom,
  Loop,
  Repeat,
  PosConfig,
  AndConfig,
  OrConfig,
  Generate,
  Control,
  Await,
  Until,
  When,
  Reset
  }=require("./VJS.js");

///TESTS
/////////
var machine = new Machine();
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
       new Seq(new Await("Hello2"), new PrintAtom("Hello internal World!")),
       new Seq(new Stop(), new Generate("Hello2"))),
     new Seq(new Generate("Hello"), new Seq(new Stop(), new Seq(new Await("Hello"),
             new PrintAtom("Hello exterior World !"))))),
   new Merge(
     new Control("Tick",
       new Seq(new PrintAtom("Hello "),
               new Seq(new Stop(), new Seq(new PrintAtom("World!"), new Stop())))),
     new Repeat(4, new Seq(new Generate("Tick"), new Stop()))),
   new Merge(
     new Until(new PosConfig("kill_it"),
       new Loop(
         new Seq(new Seq(new Await("Hello"),
                 new PrintAtom("Hello World!")), new Stop())),
       new PrintAtom("Goodbye!")),
     new Repeat(4, new Seq(new Generate("kill_it"), new Stop()))),
  new Merge(new Loop(new Seq(new ActionAtom(() => console.log(5 * 9)), new Stop())),
            new Repeat(5, new PrintAtom("second branche"))),
  new Merge(
    new When(new PosConfig("e"),
             new Seq(new Stop(), new PrintAtom("c'est le then")),
             new Seq(new Stop(), new PrintAtom("c'est le else"))),
    new Generate("e")),
  new Merge(
    new When(new PosConfig("e"),
             new Seq(new Stop(), new PrintAtom("c'est le then")),
             new Seq(new Stop(), new PrintAtom("c'est le else"))),
    new Seq(new Stop(), new Generate("e"))),
  new Merge(
    new Reset(new PosConfig("e"),
              new Seq(new PrintAtom("Ça reset"), new Stop(), new PrintAtom("Ça reset plus"))),
    new Generate("e")),
  new Merge(
    new Seq(new Await("n"), new Generate("n", 1)),
    new Generate("n", 2),
    new Seq(new Await("n"), new Generate("n", 3)),
    new ActionAtom((m)=>{ var vals=m.getEvent("n").getValues(m); console.log('vals', vals.join(', '));})),
  new Merge(
    new Seq(new Await("n"), new Generate("n", 1)),
    new Generate("n", 2),
    new Seq(new Await("n"), new Generate("n", 3), new Generate('n', 4)),
    new ActionAtom((m)=>{ var vals=m.getEvent("n").getValues(m); console.log('vals', vals.join(', '));})),
  new Merge(
    new Loop(new When(new PosConfig("e"),
                      new When(new AndConfig(new PosConfig("f"), new PosConfig("g")),
                               new PrintAtom("f"),
                               new PrintAtom("g")),
                      new PrintAtom("e"))),
    new Loop(new Seq(new Repeat(5, new Generate('e')) , new Stop())),
    new Loop(new Seq(
                     new Stop(),
                     new Generate("f"),
                     new Stop(),
                     new Generate("f"),
                     new Generate("g")))),
   new Seq(new PrintAtom("Hello"), new Seq(new Stop(), new PrintAtom("World!"))),
   new Seq(new Seq(new Seq(new PrintAtom("Hello"), new Stop()), new Seq(new Stop(), new PrintAtom("World!")))),
   new Seq(new Seq(new PrintAtom("Hello"), new Seq(new Stop(), new Seq(new Stop(), new Seq(new Stop(), new PrintAtom("World!")))))),
   new Repeat(5, new PrintAtom("toto")),
   new Repeat(6, new Merge(new PrintAtom("Hello "), new PrintAtom("World!")))
];



var i=0;
for(var i in inst){
  const p=inst[i];
  console.log("*** Test",i);
  machine = new Machine();
  machine.add(p);
  i=0;
  while(machine.react() && i<20){
    i++;
    console.log("---");
    }
  console.log("");
  }

