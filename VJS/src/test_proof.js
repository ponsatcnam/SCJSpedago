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
  </script>
 </head>
 <body>
`);
  }
console.log(`<h3>Exécution du programme Nothing()</h3>
Instant 1 :\$\$`);
var term=SC.react(SC.Nothing());
console.log("$$");
for(var n=2; n<3; n++){
  console.log(`Instant ${n}:\$\$`);
  term=SC.react(term);
  console.log("$$");
  }

console.log(`<h3>Exécution du programme Stop()</h3>
Instant 1 :\$\$`);
var term=SC.react(SC.Stop());
console.log("$$");
for(var n=2; n<3; n++){
  console.log(`Instant ${n}:\$\$`);
  term=SC.react(term);
  console.log("$$");
  }

console.log(`<h3>Exécution du programme Seq(Stop(),Stop())</h3>
Instant 1 :\$\$`);
var term=SC.react(SC.Seq(SC.Stop(), SC.Stop()));
console.log("$$");
for(var n=2; n<4; n++){
  console.log(`Instant ${n}:\$\$`);
  term=SC.react(term);
  console.log("$$");
  }
if('alone'==mode){
  console.log(` </body>
</html>`);
  }
