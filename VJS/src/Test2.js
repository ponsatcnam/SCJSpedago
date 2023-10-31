let { SC }=require("./VJS.js");

///TESTS
/////////
var machine = null;
//test sans boucle
var inst = [
   SC.Write("Hello World !"),
   SC.Seq(SC.Write("Hello"), SC.Stop(), SC.Write("World!")),
   SC.Seq(SC.Write("Hello"), SC.Stop(), SC.Stop(), SC.Write("World!")),
   SC.Seq(SC.Write("Hello"), SC.Stop(), SC.Stop(), SC.Stop(), SC.Write("World!")),
   SC.Par(SC.Write("Hello"), SC.Write("World!")),
   SC.Seq(SC.Par(
                 SC.Seq(SC.Stop(), SC.Write("left")),
                 SC.Write("right")),
          SC.Write("end of inst")),
   SC.Loop(SC.Write("Hello World!"), SC.Stop()),
   SC.Repeat(3, SC.Write("Hello World!"), SC.Stop()),
   SC.Par(SC.Loop(SC.Write("Hello World!"), SC.Stop()),
          SC.Repeat(5, SC.Write("second branche"))),
   SC.Par(SC.Seq(SC.Await("Hello2"), SC.Write("Hello internal World!")),
          SC.Seq(SC.Stop(), SC.Generate("Hello2")),
          SC.Seq(SC.Generate("Hello"), SC.Stop(), SC.Await("Hello"),
                 SC.Write("Hello exterior World !"))),
   SC.Par(SC.Control("Tick",
                     SC.Write("Hello "), SC.Stop(), SC.Write("World!"), SC.Stop()),
          SC.Repeat(4,
                    SC.Generate("Tick"), SC.Stop())),
   SC.Par(SC.Kill("kill_it",
                  SC.Loop(SC.Await("Hello"),
                          SC.Write("Hello World!"), SC.Stop()),
                  SC.Write("Goodbye!")),
          SC.Repeat(4, SC.Generate("kill_it"), SC.Stop())),
  SC.Par(SC.Loop(SC.Action(() => console.log(5 * 9)), SC.Stop()),
         SC.Repeat(5, SC.Write("second branche"))),
  SC.Par(SC.When("e",
                 SC.Seq(SC.Stop(), SC.Write("c'est le then")),
                 SC.Seq(SC.Stop(), SC.Write("c'est le else"))),
         SC.Generate("e")),
  SC.Par(SC.When("e",
                 SC.Seq(SC.Stop(), SC.Write("c'est le then")),
                 SC.Seq(SC.Stop(), SC.Write("c'est le else"))),
         SC.Seq(SC.Stop(), SC.Generate("e"))),
  SC.Par(SC.Reset("e", SC.Write("Ça reset"), SC.Stop(), SC.Write("Ça reset plus")),
         SC.Generate("e")),
  SC.Par(SC.Seq(SC.Await("n"), SC.Generate("n", 1)),
         SC.Generate("n", 2),
         SC.Seq(SC.Await("n"), SC.Generate("n", 3)),
         SC.Action((m)=>{ var vals=m.getEvent("n").getValues(m); console.log('vals', vals.join(', '));})),
  SC.Par(SC.Seq(SC.Await("n"), SC.Generate("n", 1)),
         SC.Generate("n", 2),
         SC.Seq(SC.Await("n"), SC.Generate("n", 3), SC.Generate('n', 4)),
         SC.Action((m)=>{ var vals=m.getEvent("n").getValues(m); console.log('vals', vals.join(', '));})),
  SC.Par(SC.Loop(SC.When("e",
                         SC.When(SC.And("f", "g"),
                                 SC.Write("f"),
                                 SC.Write("g")),
                         SC.Write("e"))),
         SC.Loop(SC.Repeat(5, SC.Generate('e')) , SC.Stop()),
         SC.Loop(SC.Stop(), SC.Generate("f"), SC.Stop(), SC.Generate("f"), SC.Generate("g"))),
   SC.Seq(SC.Write("Hello"), SC.Seq(SC.Stop(), SC.Write("World!"))),
   SC.Seq(SC.Seq(SC.Seq(SC.Write("Hello"), SC.Stop()), SC.Seq(SC.Stop(), SC.Write("World!")))),
   SC.Seq(SC.Seq(SC.Write("Hello"), SC.Seq(SC.Stop(), SC.Seq(SC.Stop(), SC.Seq(SC.Stop(), SC.Write("World!")))))),
   SC.Repeat(5, SC.Write("toto")),
   SC.Repeat(6, SC.Par(SC.Write("Hello "), SC.Write("World!"))),
   SC.FreezeOn('e', SC.Repeat(3, SC.Seq(SC.Write("Hello"), SC.Stop(), SC.Stop(), SC.Stop(), SC.Write("World!")))),
   SC.Par(SC.FreezeOn('e'
                    , SC.Repeat(3, SC.Seq(SC.Write("Hello"), SC.Stop(), SC.Stop(), SC.Stop(), SC.Write("World!")))),
          SC.Seq(SC.Generate('e'), SC.Action((m)=>{var val_e=m.getValuesOf('e'); console.log("e=>", val_e?val_e.toString():"nothing");}),
                 SC.Stop(), SC.Action((m)=>{var val_e=m.getValuesOf('e'); console.log("e=>", val_e?val_e.toString():"nothing");}))),
   SC.Par(SC.FreezeOn('e'
                    , SC.Repeat(3, SC.Seq(SC.Write("Hello"), SC.Stop(), SC.Stop(), SC.Stop(), SC.Write("World!")))),
          SC.Seq(SC.Stop(), SC.Generate('e'), SC.Action((m)=>{var val_e=m.getValuesOf('e'); console.log("e=>", val_e?val_e.toString():"nothing");}),
                 SC.Stop(), SC.Action((m)=>{var val_e=m.getValuesOf('e'); console.log("e=>", val_e?val_e.toString():"nothing");}))),
];



var i=0;
for(var i in inst){
  const p=inst[i];
  console.log("*** Test",i);
  machine = SC.Machine();
  machine.add(p);
  i=0;
  while(machine.react() && i<20){
    i++;
    console.log("---");
    }
  console.log("");
  }

