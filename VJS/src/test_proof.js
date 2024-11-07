const {SC}=require("./proof.js");

let zeArgs=process.argv.slice(2);
var mode='inline';

if(zeArgs[0]=='alone'){
  console.error("html mode");
  mode=zeArgs[0];
  }
if('alone'==mode){
  console.log(`
<!DOCTYPE html>
<html>
 <head>
  <meta charset="utf-8"/>
  <title lang="en">The Semantics of SugarCubes JS</title>
  <script type="text/javascript" async="true" src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML"></script>
  <script type="text/x-mathjax-config">
MathJax.Hub.Config({
    tex2jax: {
      inlineMath: [["\$","\$"],["\\\\(","\\\\)"]]
      }
  }); 
//MathJax= {
//  loader: {load: ['[tex]/color']},
//  tex: {packages: {'[+]': ['color']}}
//};
  </script>
 </head>
 <body>
`);
  }
console.log(`<h3>Exécution du programme Nothing()</h3>
Instant 1 :\$\$`);
var term= SC.react(SC.Clock(SC.Nothing()));
console.log("$$");
for(var n=2; n<3; n++){
  console.log(`Instant ${n}:\$\$`);
  term=SC.react(term);
  console.log("$$");
  }

console.log(`<h3>Exécution du programme Stop()</h3>
Instant 1 :\$\$`);
var term=SC.react(SC.Clock(SC.Stop()));
console.log("$$");
for(var n=2; n<3; n++){
  console.log(`Instant ${n}:\$\$`);
  term=SC.react(term);
  console.log("$$");
  }

console.log(`<h3>Exécution du programme Seq(Stop(),Stop())</h3>
Instant 1 :\$\$`);
var term=SC.react(SC.Clock(SC.Seq(SC.Stop(), SC.Stop())));
console.log("$$");
for(var n=2; n<4; n++){
  console.log(`Instant ${n}:\$\$`);
  term=SC.react(term);
  console.log("$$");
  }

console.log(`<h3>Exécution du programme Seq(Generate("e"),Await("e"))</h3>
Instant 1 :\$\$`);
var term=SC.react(SC.Clock(SC.Seq(SC.Generate("e"), SC.Await("e"))));
console.log("$$");
for(var n=2; n<2; n++){
  console.log(`Instant ${n}:\$\$`);
  term=SC.react(term);
  console.log("$$");
  }

console.log(`<h3>Exécution du programme Par(Await("e"),Generate("e"))</h3>
Instant 1 :\$\$`);
var term=SC.react(SC.Clock(SC.Par(SC.Await("e"), SC.Generate("e"))));
console.log("$$");
for(var n=2; n<2; n++){
  console.log(`Instant ${n}:\$\$`);
  term=SC.react(term);
  console.log("$$");
  }

console.log(`<h3>Exécution du programme Par(Await("e"),Generate("e"))</h3>
Instant 1 :\$\$`);
var term=SC.react(SC.Clock(SC.Par(SC.Await("e"), SC.Seq(SC.Stop(), SC.Generate("e")))));
console.log("$$");
for(var n=1; n<2; n++){
  console.log(`Instant ${n}:\$\$`);
  term=SC.react(term);
  console.log("$$");
  }

console.log(`<h3>Exécution du programme Par(Generate("e"), Await("e"))</h3>
Instant 1 :\$\$`);
var term=SC.react(SC.Clock(SC.Par(SC.Generate("e"), SC.Await("e"))));
console.log("$$");
for(var n=2; n<2; n++){
  console.log(`Instant ${n}:\$\$`);
  term=SC.react(term);
  console.log("$$");
  }

console.log(`<h3>Exécution du programme Par(Await("e")) avec addProgram(Generate("e"))</h3>
Instant 1 :\$\$`);
var term=SC.react(SC.Clock(SC.Par(SC.Await("e"))));
console.log("$$");
for(var n=2; n<2; n++){
  console.log(`Instant ${n}:\$\$`);
  term=SC.react(term);
  console.log("$$");
  }
console.log(`addProgram Generate("e"):\$\$`);
term= SC.addProgram(term, SC.Generate("e"));
console.log("$$");

for(var n=2; n<3; n++){
  console.log(`Instant ${n}:\$\$`);
  term=SC.react(term);
  console.log("$$");
  }

if('alone'==mode){
  console.log(` </body>
</html>`);
  }
