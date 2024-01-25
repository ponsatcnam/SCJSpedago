const fs=require('fs');

let zeArgs=process.argv.slice(2);
var mode='imp';

if(zeArgs[0]=='html'){
  console.error("html mode");
  mode=zeArgs[0];
  }

function getInstName(str){
  const m=str.match(/\w+/);
  return m[0];
  }

const SynAbs=[
  "Close"
, "Seq"
, "Par"
, "ClosePar"
, "Nothing"
, "Stop"
, "Loop"
, "Generate"
, "Await"
, "Atom"
, "PrintAtom"
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
  const couple=m[1];
  const ts=couple.lastIndexOf(',');
  const term=couple.substr(0,ts).trim();
  const names=term.match(/(Nothing|[tpl][0-9]*[_]+|u[0-9]*[_]*)/g);

  const E=couple.substr(ts+1).trim();
  //console.error(str, "->", m, m[1], "term=", term, 'E=', E, "names=", names);
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

if('imp'==mode){
  fs.readFile('base_rewrite.js', 'utf8', function(err, data){
    console.log(data);
    });
  }
else if('html'==mode){
  fs.readFile('base_rewrite.html', 'utf8', function(err, data){
    console.log(data);
    });
  }
fs.readFile('semantics.js', 'utf8', function(err, data){
  const comments=data.match(/\/\*(?:.|\n)*?\*\//gm);
  const lignes=comments.join("").split("\n");
  for(var i=0; i<lignes.length; i++){
    if(/----/.test(lignes[i])){
      const hyp=lignes[i-1].trim();
      const conc=lignes[i+1].trim();
      const rule={ hyp: hyp.split(/\s*;\s*/g), conc: conc.split(/\s*->\s*/g) };
      switch(mode){
        case 'imp':{
          for(var idx in rule.hyp){
            rule.hyp[idx]=rule.hyp[idx].replace(/(\w+)\s*([∈∉])\s*E[0-9]*[_]*/, function(match, name, e){
              return `Set_is${'∉'==e?'Not':''}In(E, ${name})`;
              });
            rule.hyp[idx]=rule.hyp[idx].replace(/\s*head\s*\((.+)\)\s*=\s*_(SUSP|STOP)\((.+)\)/, function(match, list, s, p){
              return `const ${p}=List_isHead${s}(${list});`;
              });
            rule.hyp[idx]=rule.hyp[idx].replace(/\s*(\w+)\s*([=≠])\s*nil\s*/, function(match, list, op){
              return `List_is${op=="="?"":"Not"}Empty(${list})`;
              });
                }
          break;
          }
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
  if(mode=='imp'){
    console.log(
`function react(p){
  let {t, E, end }=instant(p, {});
  console.error(' ==> ', end?'fini':'pas fini', ':', t, 'in', E);
  return t;
  }
function instant(p, E){
  let { nm, t: res, E: out }=activ(new Close(p), E);
  return {t: res, E: out, end: nm=="TERM"};
  }
`);
  function rule_transform(conc){
    conc=conc.replace(/(E[0-9]*[_]*) ∪ {(.*)}/g, function(match, e0, toAdd){
      return `Set_add(${e0}, [ ${toAdd} ])`;
      });
    return conc;
    }
  for(var op of Object.keys(operators)){
    console.log(`function ${op}(...args){
      if(!(this instanceof ${op})){
        return new ${op}(...args);
        }
      this.nm='${op}';
      var i=0;
      for(var a of args){
        this["a"+(i++)]=a;
        }
      }`);
    }
  console.log(`function activ(term, E){
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
          else if(h.startsWith('const') && /(=)/.test(h)){
            const p=h.substring(6, h.indexOf("="));
            console.log(`      ${h};/*console.log('h=', '${h}');*/
        if(${p}){`);
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
    //console.log(">>eoi", term,E);
    switch(term.nm){`);
    for(var nm of Object.keys(operators)){
      const op=operators[nm];
      const rules=op.eoi;
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
        if(match(${act_nm}, '${rwr[1]}')){`);
            console.log(`        const {${syn_extract(rwr[1])}}=${act_nm};`);
            }
          else if(h.startsWith('const') && /(=)/.test(h)){
            const p=h.substring(6, h.indexOf("="));
            console.log(`      ${h}
        if(${p}){`);
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
  /*
  On distingue 2 syntaxes :
  
   - la syntaxe concrète qui permet d'écrire des programmes dont les instructions
     sont instanciées par appels de méthodes idoines sur la classe SC.
   - la syntaxe abstraite des règles qui ajoute de façon structurelle
     éventuellement des structures supplémentaires pour satisfaire à la forme
     particulière des règles et produire un terme conforme aux règles de
     réécritures. Certains nœuds existe dans la syntaxe abstraites mais pas dans
     la syntaxe concrète. Ils ont rajoutés au cour de la transcription du
     programme exprimé dans sa syntaxe concrète en un terme exprimé dans la
     syntaxe abstraite.
  Exemple :
  le programme :
  
  SC.Par(SC.Stop(), SC.Stop())
  
  est transformé en un terme
  
  Par([_SUSP(Stop()), _SUSP(Stop())])
  
  avant que l'on puisse y appliquer les règles de réécritures.
  */
  
  const SC={
    Seq: function(...args){
      let list=[];
      for(var elt of args){
        list.push(elt);
        }
      return new Seq(list)
      },
    Par: function(...args){
      let list=[];
      for(var elt of args){
        list.push(_SUSP(elt));
        }
      return ClosePar(Par(list))
      },
    Nothing: function(){
      return new Nothing();
      },
    Stop: function(){
      return new Stop();
      },
    Generate : function(nom){
      return new Generate(nom);
      },
    PrintAtom: function(msg){
      return new PrintAtom(msg);
      },
    Await: function(nom){
      return new Await(nom);
      },
    Loop: function(...args){
      let list=[];
      for(var elt of args){
        list.push(elt);
        }
      console.log("building loop with", list);
      return new Loop(list.length>1?new Seq(list):list[0]);
      },
    react: react
    };
  module.exports = {
    SC: SC
  }
  `);
    }
  else if(mode="html"){
    function cleanTerm(t){
      return t.replace(/([tpulE])([0-9]*)([_]*)/g, function(match, v, num, prim){
        return `${v}${num}${prim.replaceAll("_","'")}`;
        });
      }
    for(var nm of Object.keys(operators)){
      const op=operators[nm];
      console.log(`<h1>Operator ${nm}</h1>`);
      const rules=op.activ.concat(op.eoi);
      console.log('<ol>');
      for(var r of rules){
        const hyps=r.hyp;
        const conc=r.conc;
        var ruleText='<li>$$ ';
        if(1==hyps.length && hyps[0].trim()=='true'){
        }
        else{
          ruleText+='\\frac{';
          var predicats='';
          for(var idx in hyps){
            let h=hyps[idx];
            h=h.replace(/_(SUSP|STOP)\s*\(([ptu][0-9]*[_]*)\)/g, function(match, st, t){
              return '\\overset{'+(st=='STOP'?'●':'○')+'}{'+t+'}';
            });
            predicats+=(0!=idx?'\\hspace{1cm}':'');
            predicats+=h.replace(/(activ|eoi)\((.*)\)\s*->\s*(TERM|STOP|SUSP)\((.*)\)/, function(match, activ, te, st, te_){
                return te+(activ=='eoi'?'\\require{mathtools}\\longmapsto ':'\\require{mathtools}\\xrightarrow{~'+st+'~} ')+te_;
              }
              );
            }
          ruleText+=predicats;
          ruleText+='}{';
          }
        var act=false;
        ruleText+=conc[0].replace(/(activ|eoi)\s*\((.*)\)/, function(match, rr, te){
        act=rr=="activ";
        return te;
        });
        ruleText+=(act?'\\require{mathtools}\\xrightarrow{':'\\longmapsto ')+'';
        ruleText+=conc[1].replace(/({|})/g, function(match, ac){
            return '\\'+ac;
            }).replace(/_(SUSP|STOP)\s*\(([ptu][0-9]*[_]*)\)/g, function(match, st, t){
            return '\\overset{'+(st=='STOP'?'●':'○')+'}{'+t+'}';
          }).replace(/(TERM|STOP|SUSP)\((.*)\)/,function(match, st, te_){
          te_=te_.replace('∪', '~\\cup~');          
          return (act?('~'+st+'~}'):' ')+te_;
        });
        if(1==hyps.length && hyps[0].trim()=='true'){
          }
        else{
          ruleText+='}';
          }
        console.log(cleanTerm(ruleText)+' $$');
        }
        console.log("</ol>");
      }
    console.log(` </body>
</html>`);
    }
  });

