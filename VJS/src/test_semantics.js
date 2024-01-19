const {SC}=require("./rewrite.js");


console.log('*** Test SC.Nothing()');
/*
Le terme est écrit désormais dans la syntaxe concrète qui est utilisée pour
écrire les programmes.
SC.react() est l'opération de réécriture du terme.
*/
var term=SC.react(SC.Nothing());
for(var n=0; n<1; n++){
  term=SC.react(term);
  }
console.log('');

console.log('*** Test PrintAtom("Hello")');
var term=SC.react(SC.PrintAtom("Hello"));
for(var n=0; n<1; n++){
  term=SC.react(term);
  }
console.log('');

console.log('*** Test Stop()');
term=SC.react(SC.Stop());
for(var n=0; n<1; n++){
  term=SC.react(term);
  }
console.log('');

console.log('*** Test Generate("e")');
term=SC.react(SC.Generate("e"));
for(var n=0; n<1; n++){
  term=SC.react(term);
  }
console.log('');

console.log('*** Test Seq(Generate("e"), Stop())');
term=SC.react(SC.Seq(SC.Generate("e"), SC.Stop()));
for(var n=0; n<1; n++){
  term=SC.react(term);
  }
console.log('');

console.log('*** Test Seq(Generate("e"), Await("e"))');
term=SC.react(SC.Seq(SC.Generate("e"), SC.Await("e")));
for(var n=0; n<1; n++){
  term=SC.react(term);
  }
console.log('');

console.log('*** Test Seq(Generate("e"), Stop(), Stop())');
term=SC.react(SC.Seq(SC.Generate("e"), SC.Stop(), SC.Stop()));
for(var n=0; n<1; n++){
  term=SC.react(term);
  }
console.log('');

console.log('*** Test Seq(Generate("e"), Stop(), Stop(), Generate("e"), Generate("f"), Stop())');
term=SC.react(SC.Seq(SC.Generate("e"), SC.Stop(), SC.Stop(), SC.Generate('e'), SC.Generate('f'), SC.Stop()));
for(var n=0; n<3; n++){
  term=SC.react(term);
  }
console.log('');

console.log('*** Test Par(Seq(Generate("e"), Stop(), Stop(), Generate("e"), Generate("f"), Stop()))');
term=SC.react(SC.Par(
                SC.Seq(SC.Generate("e"), SC.Stop(), SC.Stop(), SC.Generate('e'), SC.Generate('f'), SC.Stop())
		)
             );
for(var n=0; n<4; n++){
  term=SC.react(term);
  }
console.log('');

console.log(`*** Test Par(Seq(Generate("e"), Stop(), Stop(), Generate("e"), Generate("f"), Stop())
, Seq(Stop(), Await("e"), Generate("h"), Stop(), Generate("i")))`);
term=SC.react(SC.Par(SC.Seq(SC.Generate("e"), SC.Stop(), SC.Stop(), SC.Generate('e'), SC.Generate('f'), SC.Stop())
   , SC.Seq(SC.Stop(), SC.Await("e"), SC.Generate("h"), SC.Stop(), SC.Generate("i"))
     ));
for(var n=0; n<4; n++){
  term=SC.react(term);
  }
console.log('');

console.log(`*** Test Par(Seq(Generate("e"), Stop(), Stop(), Generate("e"), Generate("f"), Stop())
, Seq(Stop(), Await("e"), Generate("h"), Stop(), Generate("i"), Stop(), Generate("j"), Stop()))`);
term=SC.react(SC.Par(SC.Seq(SC.Generate("e"), SC.Stop(), SC.Stop(), SC.Generate('e'), SC.Generate('f'), SC.Stop())
   , SC.Seq(SC.Stop(), SC.Await("e"), SC.Generate("h"), SC.Stop(), SC.Generate("i"), SC.Stop(), SC.Generate("j"), SC.Stop())
     ));
for(var n=0; n<5; n++){
  term=SC.react(term);
  }
console.log('');

console.log('*** Test Loop(Generate("e"))');
term=SC.react(SC.Loop(SC.Generate("e")));
for(var n=0; n<5; n++){
  term=SC.react(term);
  }
console.log('');

console.log('*** Test Loop(Seq(Generate("e"), Stop(), Generate("f")))');
term=SC.react(SC.Loop(SC.Generate("e"), SC.Stop(), SC.Generate("f")));
for(var n=0; n<5; n++){
  term=SC.react(term);
  }
console.log('');

console.log(`*** Test Par(Seq(Generate("e"), Stop(), Stop(), Generate("e"), Generate("f"), Stop())
, Seq(Stop(), Await("e"), Generate("h"), Stop(), Generate("i"), Stop(), Generate("j"), Stop()))`);
term=SC.react(SC.Loop(SC.Par(SC.Seq(SC.Generate("e"), SC.Stop(), SC.Stop(), SC.Generate('e'), SC.Generate('f'), SC.Stop())
   , SC.Seq(SC.Stop(), SC.Await("e"), SC.Generate("h"), SC.Stop(), SC.Generate("i"), SC.Stop(), SC.Generate("j"), SC.Stop())
     )));
for(var n=0; n<10; n++){
  term=SC.react(term);
  }
console.log('');

