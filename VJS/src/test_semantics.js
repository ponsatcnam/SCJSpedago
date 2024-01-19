const {SC}=require("./rewrite.js");


console.log('*** Test SC.Nothing()');
/*
Le terme est écrit désormais dans la syntaxe concrète qui est utilisée pour
écrire les programmes.
SC.react() est l'opération de réécriture du terme.
*/
var term=SC.react(SC.Nothing());
term=SC.react(term);
console.log('');
console.log('*** Test PrintAtom("Hello")');
var term=SC.react(SC.PrintAtom("Hello"));
term=SC.react(term);
console.log('');
console.log('*** Test Stop()');
term=SC.react(SC.Stop());
term=SC.react(term);
console.log('');
console.log('*** Test Generate("e")');
term=SC.react(SC.Generate("e"));
term=SC.react(term);
console.log('');
console.log('*** Test Seq(Generate("e"), Stop())');
term=SC.react(SC.Seq(SC.Generate("e"), SC.Stop()));
term=SC.react(term);
console.log('');
console.log('*** Test Seq(Generate("e"), Await("e"))');
term=SC.react(SC.Seq(SC.Generate("e"), SC.Await("e")));
term=SC.react(term);
console.log('');
console.log('*** Test Seq(Generate("e"), Stop(), Stop())');
term=SC.react(SC.Seq(SC.Generate("e"), SC.Stop(), SC.Stop()));
term=SC.react(term);
term=SC.react(term);
console.log('');
console.log('*** Test Seq(Generate("e"), Stop(), Stop(), Generate("e"), Generate("f"), Stop())');
term=SC.react(SC.Seq(SC.Generate("e"), SC.Stop(), SC.Stop(), SC.Generate('e'), SC.Generate('f'), SC.Stop()));
term=SC.react(term);
term=SC.react(term);
term=SC.react(term);
console.log('');

console.log('*** Test Par(Seq(Generate("e"), Stop(), Stop(), Generate("e"), Generate("f"), Stop()))');
term=SC.react(SC.Par(
                SC.Seq(SC.Generate("e"), SC.Stop(), SC.Stop(), SC.Generate('e'), SC.Generate('f'), SC.Stop())
		)
             );
term=SC.react(term);
term=SC.react(term);
term=SC.react(term);
term=SC.react(term);
console.log('');

console.log(`*** Test Par(Seq(Generate("e"), Stop(), Stop(), Generate("e"), Generate("f"), Stop())
, Seq(Stop(), Await("e"), Generate("h"), Stop(), Generate("i")))`);
term=SC.react(SC.Par(SC.Seq(SC.Generate("e"), SC.Stop(), SC.Stop(), SC.Generate('e'), SC.Generate('f'), SC.Stop())
   , SC.Seq(SC.Stop(), SC.Await("e"), SC.Generate("h"), SC.Stop(), SC.Generate("i"))
     ));
console.log('');
term=SC.react(term);
console.log('');
term=SC.react(term);
console.log('');
term=SC.react(term);
console.log('');
term=SC.react(term);

console.log(`*** Test Par(Seq(Generate("e"), Stop(), Stop(), Generate("e"), Generate("f"), Stop())
, Seq(Stop(), Await("e"), Generate("h"), Stop(), Generate("i"), Stop(), Generate("j"), Stop()))`);
term=SC.react(SC.Par(SC.Seq(SC.Generate("e"), SC.Stop(), SC.Stop(), SC.Generate('e'), SC.Generate('f'), SC.Stop())
   , SC.Seq(SC.Stop(), SC.Await("e"), SC.Generate("h"), SC.Stop(), SC.Generate("i"), SC.Stop(), SC.Generate("j"), SC.Stop())
     ));
console.log('');
term=SC.react(term);
console.log('');
term=SC.react(term);
console.log('');
term=SC.react(term);
console.log('');
term=SC.react(term);
console.log('');
term=SC.react(term);

console.log('*** Test Loop(Generate("e"))');
term=SC.react(SC.Loop(SC.Generate("e")));
term=SC.react(term);
term=SC.react(term);
term=SC.react(term);
console.log('');

console.log('*** Test Loop(Seq(Generate("e"), Stop(), Generate("f")))');
term=SC.react(SC.Loop(SC.Generate("e"), SC.Stop(), SC.Generate("f")));
term=SC.react(term);
term=SC.react(term);
term=SC.react(term);
console.log('');


console.log(`*** Test Par(Seq(Generate("e"), Stop(), Stop(), Generate("e"), Generate("f"), Stop())
, Seq(Stop(), Await("e"), Generate("h"), Stop(), Generate("i"), Stop(), Generate("j"), Stop()))`);
term=SC.react(SC.Loop(SC.Par(SC.Seq(SC.Generate("e"), SC.Stop(), SC.Stop(), SC.Generate('e'), SC.Generate('f'), SC.Stop())
   , SC.Seq(SC.Stop(), SC.Await("e"), SC.Generate("h"), SC.Stop(), SC.Generate("i"), SC.Stop(), SC.Generate("j"), SC.Stop())
     )));
console.log('');
for(var n=0; n< 10; n++){
  term=SC.react(term);
  console.log('');
  }
