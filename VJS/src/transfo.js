const fs=require('fs');

fs.readFile('semantics.js', 'utf8', function(err, data){
  const comments=data.match(/\/\*(?:.|\n)*?\*\//gm);
  const lignes=comments.join("").split("\n");
  const rules=[];
  const activ_cases=[];
  const eoi_cases=[];
  const instant_cases=[];
  for(var i=0; i <lignes.length; i++){
    if(/----/.test(lignes[i])){
      const hyp=lignes[i-1].replace(/(^\s*)|(\s*$)/, '');
      const conc=lignes[i+1].replace(/(^\s*)|(\s*$)/, '');
      const rule={ hyp: hyp.split(/\s*;\s*/g), conc: conc.split(/\s*->\s*/g) };
      rules.push(rule);
      if(rule.conc[0].startsWith("activ")){
	const init=rule.conc[0];
	const inst=init.substring(init.indexOf("(")+1, init.length-1);
	console.log(inst);
	activ_cases.push(rule);
	}
      if(rule.conc[0].startsWith("eoi")){
	eoi_cases.push(rule);
	}
      if(rule.conc[0].startsWith("instant")){
	instant_cases.push(rule);
	}
      }
    }
  console.log(`
/* return a term */
function Result(term, E){
  this.term=term;
  this.E=E;
  }
function react(p){
  return instant(p, {});
  }
function instant(term, E){
  return ativ(new Close(p), E).term;
  }
function activ(term, E){
  const head=term.substr(0, term.idexOf("("));
  switch(head){
    `);
  for(var rl of activ_cases){
    //console.log(rl.hyp);
    }
  //console.log('eoi:', eoi_cases);
  console.log(`
    default: throw new Error("unknown rule");
    }
  }`);
  });
