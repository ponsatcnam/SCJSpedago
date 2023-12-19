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
function syn_extract(str){
  const m=str.match(/\w+\s*\((.*)\)/);
  return m[1];
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
      const hyp=lignes[i-1].replace(/(^\s*)|(\s*$)/, '');
      const conc=lignes[i+1].replace(/(^\s*)|(\s*$)/, '');
      const rule={ hyp: hyp.split(/\s*;\s*/g), conc: conc.split(/\s*->\s*/g) };
      const term=termTL(rule.conc[0]);
      const zeTerm=operators[term.nm];
      if(zeTerm){
        if(undefined==zeTerm.syntax){
          zeTerm.syntax=term.synx;
          }
        else if(zeTerm.syntax!=term.synx){
          throw new Error("incosistent syntax: "+term.synx);
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
  if(!this instanceof _SUSP){
    return new SUSP(t);
    }
  this.nm='_SUSP';
  this.t=t;
  }
function _STOP(t){
  if(!this instanceof _STOP){
    return new _STOP(t);
    }
  this.nm='_STOP';
  this.t=t;
  }
function SUSP(t, E){
  if(!this instanceof SUSP){
    return new SUSP(t, E);
    }
  this.nm='SUSP';
  this.t=t;
  this.E=E;
  }
function STOP(t, E){
  if(!this instanceof STOP){
    return new STOP(t, E);
    }
  this.nm='STOP';
  this.t=t;
  this.E=E;
  }
function TERM(t, E){
  if(!this instanceof TERM){
    return new TERM(t, E);
    }
  this.nm='TERM';
  this.t=t;
  this.E=E;
  }
function react(p){
  return instant(p, {});
  }
function instant(t, E){
  return ativ(new Close(p), E).term;
  }
function Set_eq(E, E_){
  if(E.length!=E_.length){
    return false;
    }
  for(var elt of E){
    if(!E_.includes(elt)){
      return false;
      }
    }
  return true;
  }
function Set_neq(E, E_){
  if(E.length!=E_.length){
    return true;
    }
  for(var elt of E){
    if(!E_.includes(elt)){
      return true;
      }
    }
  return false;
  }
function match(res, s){
  const r=s.match(/\w+\((.*)\)/);
  console.log("match",r);
  return true;
  }
function activ(term, E){
  switch(term.nm){`);
  for(var nm of Object.keys(operators)){
    const op=operators[nm];
    const rules=op.activ;
    console.log(`    case '${nm}':{`);
    if(op.syntax!=""){
      console.log(`      const {${op.syntax}}=term;`);
      }
    var nb=0;
    for(var r of rules){
      const hyps=r.hyp;
      const conc=r.conc;
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
      console.log(`        return ${conc[1]};`);
      for(var h of hyps){
        console.log(`        }`);
        }
      }
    console.log(`      break;
      }`);
    }
  //console.log('eoi:', eoi_cases);
  console.log(`    default: throw new Error("unknown rule");
    }
  }`);
  });
