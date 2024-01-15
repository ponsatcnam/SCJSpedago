const fs=require('fs');

function getInstName(str){
  const m=str.match(/\w+/);
  return m[0];
  }

const SynAbs=[
  "Close"
, "Seq"
, "Par"
, "Nothing"
, "Stop"
, "Loop"
, "Generate"
, "Await"
, "Atom"
  ];

function termTL(str){
  const inst=str.substring(str.indexOf("(")+1, str.length-1);
  const inm=getInstName(inst);
  const syn=inst.match(/\(.*\)/g);
  const syntax=syn?syn[0].substr(1, syn[0].length-2):"";
  return { nm: inm, opc: SynAbs.indexOf(inm), synx: syntax };
  }
function rule_transform(conc){
  conc=conc.replace(/(E[0-9]*[_]*) U {(.*)}/g, function(match, e0, toAdd){
    return `Set_add(${e0}, [ ${toAdd} ])`;
    });
  return conc;
  }
function syn_extract(str){
  const m=str.match(/\w+\s*\((.*)\)/);
  const couple=m[1];
  const ts=couple.lastIndexOf(',');
  const term=couple.substr(0,ts).trim();
  const names=term.match(/(Nothing|[tpl][0-9]*[_]+|u[0-9]*[_]*)/g);

  const E=couple.substr(ts+1).trim();
  console.error(str, "->", m, m[1], "term=", term, 'E=', E, "names=", names);
  var t=`${term}`;
  if(term.startsWith("Nothing")){
    t=`{ a0: _Nope }`;
    }
  if(term.startsWith("Par")){
    t=`{ a0: ${names[0]} }`;
    }
  if(term.startsWith("Seq")){
    t=`{ a0: [${names[0]}] }`;
    }
  return `t: ${t}, E: ${E}`;
  }

function Term(nm){
  this.nm=nm
  this.opc=SynAbs.indexOf(nm);
  this.activ=[];
  this.eoi=[];
  this.instant=[];
  this.syntax=undefined;
  };
Term.prototype.addRule=function(r){
  if(r.conc[0].startsWith("activ")){
    this.activ.push(r);
    }
  else if(r.conc[0].startsWith("eoi")){
    this.eoi.push(r);
    }
  }; 

const operators={};

for(var op of SynAbs){
  operators[op]=new Term(op);
  }

fs.readFile('semantics.js', 'utf8', function(err, data){
  const comments=data.match(/\/\*(?:.|\n)*?\*\//gm);
  const lignes=comments.join("").split("\n");
  for(var i=0; i<lignes.length; i++){
    if(/----/.test(lignes[i])){
      const hyp=lignes[i-1].trim();
      const conc=lignes[i+1].trim();
      const rule={ hyp: hyp.split(/\s*;\s*/g), conc: conc.split(/\s*->\s*/g) };
      for(var idx in rule.hyp){
        rule.hyp[idx]=rule.hyp[idx].replace(/(\w+)\s*([∈∉])\s*E[0-9]*[_]*/, function(match, name, e, E){
	  return `Set_is${'∉'==e?'Not':''}In(${E}, term.a0)`;
	  });
	}
      const term=termTL(rule.conc[0]);
      const zeTerm=operators[term.nm];
      if(zeTerm){
        if(undefined==zeTerm.syntax){
          zeTerm.syntax=term.synx;
          }
        else if(zeTerm.syntax!=term.synx){
          throw new Error("inconsistent syntax: "+term.synx);
          }
        zeTerm.addRule(rule);
        }
      }
    }
  console.log(`
/* return a term */
function getInstName(str){
  const m=str.match(/\w+/);
  return m[0];
  };
function isNotEmpty(l){
  return (l?l:[]).length>0;
  };
function isEmpty(l){
  return (l?l:[]).length===0;
  };
function Result(term, E){
  this.term=term;
  this.E=E;
  }
function _SUSP(t){
  if(!(this instanceof _SUSP)){
    return new SUSP(t);
    }
  this.nm='_SUSP';
  this.t=t;
  }
function _STOP(t){
  if(!(this instanceof _STOP)){
    return new _STOP(t);
    }
  this.nm='_STOP';
  this.t=t;
  }
function SUSP(t, E){
  if(!(this instanceof SUSP)){
    return new SUSP(t, E);
    }
  this.nm='SUSP';
  this.t=t;
  this.E=E;
  }
function STOP(t, E){
  if(!(this instanceof STOP)){
    return new STOP(t, E);
    }
  this.nm='STOP';
  this.t=t;
  this.E=E;
  }
function TERM(t, E){
  if(!(this instanceof TERM)){
    return new TERM(t, E);
    }
  this.nm='TERM';
  this.t=t;
  this.E=E;
  }
function react(p){
  return instant(p, {});
  }
function instant(p, E){
  let { nm, t: res, E: out }=activ(new Close(p), E);
  console.error(' ==> ', nm, ':', res, 'in', out);
  return res;
  }
function Set_eq(E, E_){
  let keyE_=Object.keys(E_);
  for(var elt of Object.keys(E)){
    if(!keyE_.includes(elt)){
      return false;
      }
    }
  return true;
  }
function Set_neq(E, E_){
  let keyE_=Object.keys(E_);
  for(var elt of Object.keys(E)){
    if(!keyE_.includes(elt)){
      return true;
      }
    }
  return false;
  }
function Set_isIn(E, elt){
  return Object.keys(E).includes(elt);
  }
function Set_isNotIn(E, elt){
  return !Set_isIn(E, elt);
  }
function Set_add(E, set){
  var res={};
  for(var elt of Object.keys(E)){
    res[elt]=true;
    }
  for(var elt of set){
    res[elt]=true;
    }
  return res;
  }
function head(l){
  return l[0];
  }
function tail(l){
  let res=[];
  for(var i in l){
    if(0==i){
      continue;
      }
    res.push(l[i]);
    }
  return res;
  }
function cons(head, tail){
  let res=[head];
  for(var elt of tail){
    res.push(elt);
    }
  return res;
  }
`);
for(var op of Object.keys(operators)){
  console.log(`function ${op}(...args){
    if(!(this instanceof ${op})){
      //console.log("need a new");
      return new ${op}(...args);
      }
    this.nm='${op}';
    var i=0;
    for(var a of args){
      this["a"+(i++)]=a;
      }
    }`);
  }
console.log(`function match(res, s){
  return res.nm==s.substr(0,s.indexOf("("));
  }
function activ(term, E){
  //console.log("activ: term=", term, " E=", E);
  switch(term.nm){`);
  for(var nm of Object.keys(operators)){
    const op=operators[nm];
    const rules=op.activ;
    console.log(`    case '${nm}':{`);
    if(op.syntax!=""){
      console.log(`      const {a0: ${op.syntax}}=term;`);
      }
    var nb=0;
    for(var r of rules){
      const hyps=r.hyp;
      const conc=r.conc;
      console.log(`/*
${hyps}
-------------------
${conc}
*/`);
      for(var h of hyps){
        if(/\s*->\s*/.test(h)){
          const rwr=h.split(/\s*->\s*/g);
          const act_nm=`act_${nb++}`;
          console.log(`      const ${act_nm}=${rwr[0]};
      if(match(${act_nm}, '${rwr[1]}')){/*console.log("subrule:", ${act_nm});*/`);
          console.log(`        const {${syn_extract(rwr[1])}}=${act_nm};`);
          }
        else if(/(=)/.test(h)){
          const rwr=h.split(/\s*=\s*/g);
          console.log(`      if(Set_eq(${rwr[0]}, ${rwr[1]})){`);
          }
        else if(/(≠)/.test(h)){
          const rwr=h.split(/\s*≠\s*/g);
          console.log(`      if(Set_neq(${rwr[0]}, ${rwr[1]})){`);
          }
        else{
          console.log(`      if(${h}){`);
          }
        }
      console.log(`/*console.log('${hyps}\\n-----------\\n${conc}');*/
        return ${rule_transform(conc[1])};`);
      for(var h of hyps){
        console.log(`        }`);
        }
      }
    console.log(`      throw new Error("No rule for that term");
      }`);
    }
  //console.log('eoi:', eoi_cases);
  console.log(`    default: throw new Error("unknown rule");
    }
  }`);

console.log(`
function eoi(term, E){
  switch(term.nm){`);
  for(var nm of Object.keys(operators)){
    const op=operators[nm];
    const rules=op.eoi;
    console.log(`    case '${nm}':{`);
    if(op.syntax!=""){
      console.log(`      const {${op.syntax}}=term;`);
      }
    var nb=0;
    for(var r of rules){
      const hyps=r.hyp;
      const conc=r.conc;
      console.log(`/*
${hyps}
-------------------
${conc}
*/`);
      for(var h of hyps){
        if(/\s*->\s*/.test(h)){
          const rwr=h.split(/\s*->\s*/g);
          const act_nm=`act_${nb++}`;
          console.log(`      const ${act_nm}=${rwr[0]};
      if(match(${act_nm}, '${rwr[1]}')){`);
          console.log(`        const {${syn_extract(rwr[1])}}=${act_nm};`);
          }
        else if(/(=)/.test(h)){
          const rwr=h.split(/\s*=\s*/g);
          console.log(`      if(Set_eq(${rwr[0]}, ${rwr[1]})){`);
          }
        else if(/(≠)/.test(h)){
          const rwr=h.split(/\s*≠\s*/g);
          console.log(`      if(Set_neq(${rwr[0]}, ${rwr[1]})){`);
          }
        else{
          console.log(`      if(${h}){`);
          }
        }
      console.log(`/*console.log('${hyps}\\n-----------\\n${conc}');*/
        return ${rule_transform(conc[1])};`);
      for(var h of hyps){
        console.log(`        }`);
        }
      }
    console.log(`      throw new Error("No rule for that term");
      }`);
    }
  //console.log('eoi:', eoi_cases);
  console.log(`    default: throw new Error("unknown rule");
    }
  }`);
  console.log(`
react(Nothing());
console.log('');
var term=react(Stop());
console.log('');
term=react(Generate("e"));
console.log('');
term=react(Seq([Generate("e"), Stop()]));
console.log('');
term=react(term);
console.log('');
term=react(Seq([Generate("e"), Stop(), Stop()]));
console.log('');
term=react(term);
console.log('');
term=react(term);
console.log('');
  `);
  });

