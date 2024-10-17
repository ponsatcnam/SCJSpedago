const fs=require('fs');

let zeArgs= process.argv.slice(2);
var mode= 'imp';

if(zeArgs[0]=='html'){
  console.warn("html mode");
  mode= zeArgs[0];
  }
else if(zeArgs[0]=='proof'){
  console.warn("proof mode");
  mode= zeArgs[0];
  }

function getInstName(str){
  const m= str.match(/\w+/);
  return m[0];
  };

/*
Liste des instructions de la syntaxe concrète
*/
const SynConcrete=[
  "Seq"
, "Par"
, "Nothing"
, "Stop"
, "Loop"
, "Generate"
, "Await"
, "Atom"
, "PrintAtom"
  ];

/*
Liste des instructions de la syntaxe abstraite
*/
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

/*
Un terme, traduit dans la syntaxe abstraite à toujour la forme d'un nom suivit
d'une liste de paramètres entre parenthèses.
ex:
  1. Pause()
  2. Seq(Pause(), Pause())
  ...
*/

/*
-----------
On commence par définir 2 fonction utilitaires
*/
/*
Fonction termTL():
Permet d'extraire un terme wrappé dans un statut:
 Statut(term) -> term

Sachant qu'un term est un nom suivit d'une liste de paramètres entre
parenthèses, on peut récupérer le nom du terme (getInstName) puis le contenu
des paramètres entre parenthèse pour retourner finalement un objet constitué :
- du nom de l'instruction (nm)
- du code de l'instruction (opc)
- et de ses paramètres (synx)
*/
function termTL(str){
  const inst= str.substring(str.indexOf("(")+1, str.length-1);
  const inm= getInstName(inst);
  const syn=inst.match(/\(.*\)/g);
  const syntax=syn?syn[0].substr(1, syn[0].length-2):"";
  return { nm: inm, opc: SynAbs.indexOf(inm), synx: syntax };
  };
/*
Fonction qui produit un format intermédiaire d'un terme-status abstrait.
Il extrait les variables des sous termes et la variable d'environnement.
On lui passe un terme-status dans la syntaxe abstraite en paramètre.
par exemple :
  TERM(Nothing(), E__) => { t: { a0: _Nope }, E: E__ }
ou encore
  STOP(Par(l_), E__) => { t: { a0: l_ }, E: E__ }

Cette fonction permet d'exploiter la destructuration de terme de javascipt.
*/
function syn_extract(str){
  const m= str.match(/\w+\s*\((.*)\)/);
  const couple= m[1];
  // La dernière virgule sépare le terme et son environement
  const ts=couple.lastIndexOf(',');
  // On nétoie les espaces si besoin.
  const term=couple.substr(0, ts).trim();
  const names=term.match(/(Nothing|[tpl][0-9]*[_]+|u[0-9]*[_]*)/g);
  const E= couple.substr(ts+1).trim();
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
  };
// On definit une fonction utilitaire qui transforme un prédicat de type
// union en un appelle de fonction Set_add()
function rule_transform(conc){
  conc= conc.replace(/(E[0-9]*[_]*) ∪ {(.*)}/g, function(match, e0, toAdd){
    return `Set_add(${e0}, [ ${toAdd} ])`;
    });
  return conc;
  };

function rule_right(str){
  return "";
  }

/*
L'objet de protype Term va permettre de produire le code correspondant à une
instruction à partir des règles.
Chaque Term aura :
- un nom (nm) issus de la syntaxe abstraite
- un code (opc) ordre dans le tableau des instructions de la syntaxe abstraite.
- des règles d'activation dans l'instant (activ)
- des règles à appliquer à la fin de l'instant (eoi)
*/
function Term(nm){
  this.nm= nm;
  this.opc= SynAbs.indexOf(nm);
  this.activ= [];
  this.eoi= [];
  this.instant= [];
  this.syntax= undefined;
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

/*
On crée un objet Term pour chaque Mots de la syntaxe abstraite (Chacun de ces
mots apparaissent dans les règles...)
*/
for(var op of SynAbs){
  operators[op]= new Term(op);
  }

/*
On ne produit pas la même chose sur la sortie standard (stdout) selon que l'on
souhaite produire le code exécutable ou la version latex des règles...
Le paramètre mode sert à ça...
*/
if('imp'==mode||'proof'==mode){
  // Si on cherche à produire l'immlantation ou le constructeur d'arbre de
  // peuve on écrit le bout de programme suivant...
  console.log(
`let zeArgs=process.argv.slice(2);
var mode= 'imp';

if(zeArgs[0]=='proof'){
  mode=zeArgs[0];
  }  
`);
  // Puis on ajoute le contenu de base_rewrite.js à la sortie standard...
  const data= fs.readFileSync('base_rewrite.js', 'utf8');
  console.log(data);
  }
else if('html'==mode){
  // Si on produit le fichier html 
  const data= fs.readFileSync('base_rewrite.html', 'utf8');
  console.log(data);
  }
// On ouvre le fichier semantics.js en lecture
fs.readFile('semantics.js', 'utf8', function(err, data){
  // On récupère grace à une expression régulière le contenu des commentaires
  // dont les commentaires contenant les règles.
  const comments= data.match(/\/\*(?:.|\n)*?\*\//gm);
  // On fait une seule chaîne de caractère à partir de tous les commentaires et
  // on explose en ligne le résultat de la concaténation.
  const lignes= comments.join("").split("\n");
  //On va maintenant parcourir le tableau résultant en recherchant les lignes
  //qui commence par '----' qui symbolise le trait de fraction des règles
  //conditionnelles.
  for(var i=0; i<lignes.length; i++){
    if(/----/.test(lignes[i])){
      // Si on trouve une telle ligne, la ligne d'avant contient les hypothèses
      // la ligne d'après la règle de réécriture.
      // On nettoie les espaces autour..
      const hyp=lignes[i-1].trim();
      const conc=lignes[i+1].trim();
      // on split les hypothèses sur les ';'
      // et la règle de réécriture sur la flèche '->'
      const rule={ hyp: hyp.split(/\s*;\s*/g), conc: conc.split(/\s*->\s*/g) };
      // On transforme dès maintenant ceraines hypothèses pour la génération de
      // code et des arbres de preuve.
      switch(mode){
        case 'proof':
        case 'imp':{
          for(var idx in rule.hyp){
            // Ainsi si une hypothèse est de la forme ∈ ou ∉ on remplace ça par
            // l'appelle d'une fonction qui s'évaluera dans un boolean.
            rule.hyp[idx]=rule.hyp[idx].replace(/(\w+)\s*([∈∉])\s*E[0-9]*[_]*/, function(match, name, e){
              return `Set_is${'∉'==e?'Not':''}In(E, ${name})`;
              });
            // Transformation des hypothèses sur le status de la tête d'une
            // liste (pour la séquence ou le par essentiellement)
            rule.hyp[idx]=rule.hyp[idx].replace(/\s*head\s*\((.+)\)\s*=\s*_(SUSP|STOP)\((.+)\)/, function(match, list, s, p){
              return `const ${p}=List_isHead${s}(${list});`;
              });
            // Transformation de l'hypthèse sur la liste vide.
            rule.hyp[idx]=rule.hyp[idx].replace(/\s*(\w+)\s*([=≠])\s*nil\s*/, function(match, list, op){
              return `List_is${op=="="?"":"Not"}Empty(${list})`;
              });
                }
          break;
          }
        }
      // On applique termTL sur le membre gauche de la règle pour extraire le
      // nom du terme et pouvoir comme ça regrouper les règles en fonction de
      // l'instruction à lauquelle une règle se rapporte.
      const term= termTL(rule.conc[0]);
      // À partir du nom du extrait on retrouve l'objet Term correspondant.
      const zeTerm= operators[term.nm];
      if(zeTerm){
        if(undefined==zeTerm.syntax){
          zeTerm.syntax=term.synx;
          }
        else if(zeTerm.syntax!=term.synx){
          throw new Error("inconsistent syntax: "+term.synx);
          }
        zeTerm.addRule(rule);
        }
      else{
        // Pour le moment le statut des règle de react() et instant() sont
        // traitées de façon statique à la main... Faudra probablement faire
        // mieux...
        console.warn("no term for that rule", rule);
        }
      }
    }
  if(mode=='imp'||mode=='proof'){
    // **** Générateur de code.
    // on commence par écrire ce que fait react.
    console.log(`function react(p){`);
    console.log(`  let {t, E, end }= instant(p, {});`);
    if(mode=='proof'){
      console.log(`  const predicates=[proof_last];
  const rule=new RuleJax({ str: \`\${p.toMath()} \\\\require{mathtools}\\\\Rrightarrow \${t.toMath()}, \${Set_toMath(E)}\` });
  console.log(new NodeJax(predicates, rule).toMath());`);
      }
    if(mode=='imp'){
      console.log(
`  console.error(' ==> ', end?'fini':'pas fini', ':', t, 'in', E);`);
      }
    console.log(
`  return t;
  }
function instant(p, E){`);
    console.log(`  let { nm, t: res, E: out }=activ(new Close(p), E);`);
    if(mode=='proof'){
      console.log(`  const predicates=[proof_last];
  const rule=new RuleJax({ str: \`\${p.toMath()}, \${Set_toMath(E)} \\\\require{mathtools}\\\\Rightarrow \${res.toMath()}, \${Set_toMath(out)}\` });
  proof_last= NodeJax(predicates, rule);`);
      }
    console.log(
`  return {t: res, E: out, end: nm=="TERM"};
  }
var proof_last= null;
`);
  // On parcours chaque objet Term pour créés pour chaque instruction de la
  // syntaxe abstraite et qui est maintenant rempli avec les différentes règles
  // le concernant.
  for(var op of Object.keys(operators)){
    // On crée un constructeur pour l'instruction
    console.log(`
/* *** ${op} ***
*/
function ${op}(...args){
  if(!(this instanceof ${op})){
    return new ${op}(...args);
    }
  this.nm= '${op}';
  const al= args.length;
  this.a= [];
  for(var i= 0; i<al; i++){
    const a= args[i]
    // Dans l'objet on ajoute un champs pour chaque entrée passée en argument
    this["a"+i]= a;
    this.a.push(a);
    }
  };

${op}.prototype.toString= function(){
    return this.toMath();
    };
// Pour chaque operateur on rajoute sa production en format latex...
${op}.prototype.toMath= function(){
    let res= this.nm+'(';
    for(var i in this.a){
      const a= this.a[i];
      if("${op}"=="Par"){
        console.warn("a", Array.isArray(a));
	}
      res+= (0!=i?', ':'')+(Array.isArray(a)?List_toMath(a):a.toString());
      }
    return res+')';
    };`);
    }
  console.log(`function activ(term, E){
  //console.warn("activ: term=", term, " E=", E);`);
    if('proof'==mode){
      console.log(`  var proof_hyps= []; proof_last= null;`);
      }
  console.log(
`  switch(term.nm){`);
    // dans activ on va poarcourir tous les opérateurs pour créer les case du
    // switch : l'idée c'est que active devient un gros switch qui commence par
    // déterminer quel opérateur est concerné par activ()...
    for(var nm of Object.keys(operators)){
      const op= operators[nm];
      // On sélectionne des règles d'activation (on fera pareille pour eoi mais
      // avec les règles eoi).
      const rules= op.activ;
      // On crée le case correspondant au nom de l'opérateur...
      // Par exemple
      //   case 'Close':{ ... }
      console.log(`    case '${nm}':{`);
      // On regarde si l'opérateur a des paramètre dans sa syntaxe.
      // Par exemple Nothing() n'est a pas tandisq que Repeat(20, p) en a 2.
      if(""!=op.syntax){
        // On destructure l'objet js pour initialiser les varaibles dans le
        // code produit...
        console.log(`      const {a0: ${op.syntax}}=term;`);
        }
      var nb= 0;
      // On va parcourir chaque règle de activ pour cet opérateur et les
      // évaluer pour sélectionner la règle de réécriture qui fonctionne pour
      // le terme d'entrée forni en paramètre de la fonction activ().
      for(var r of rules){
        const hyps= r.hyp;
        const conc= r.conc;
        // Dans le code produit on met en commentaire la règle telle que
        // décrite dans le fichier semantics.js
        console.log(`/*
  ${hyps}
  -------------------
  ${conc}
  */`);
        // Ensuite on commence à écrire le code produit par la transformation
        // des règles en code exécutable ou en arbre de preuve.
        if('proof'==mode){
          // Dans le mode de création de l'arbre de preuve on force la
          // réinitialisationd de proof_hyps et proof_last car chque règle
          // doi-être évaluée dans un environnement propre.
          // Comme on est dans la boucle itérant sur les règles...
          console.log(`      proof_hyps=[];/* proof_last=null;*/`);
          }
        // pour chaque règle, on doit évaluer les hypothèses. On va donc
        // considérer chaque hypothèse dans l'ordre. Et, on doit le faire dans
        // l'ordre car certaines hypothèses fausse vont invalider les
        // évaluations des suivantes le ';' est un «et» logique. Mais chaque
        // hypothèse peut introduire des noms de variables nouveaux qui seront
        // utilisés par les suivantes => rend la production de code plus simple
        // en les évaluant dans l'ordre.
        for(var h of hyps){
          // On commence par le cas le plus délicat : si l'hypothèse est une
          // réécriture... On détecte ça en regardant si l'hypothèse contient
          // une flèche. A priori, on ne peut pas écrire une hypothèse avec
          // plusieurs flèches.
          if(/\s*->\s*/.test(h)){
            // On split l'hypthèse autour de la flèche
            const rwr= h.split(/\s*->\s*/g);
            // On va créer une variable locale qui contiendra la réécriture
            // issue de l'évaluation de l'hypthèse.
            const act_nm=`act_${nb++}`;
            console.log(`      const ${act_nm}= ${rwr[0]};
            // On regarde si le résultat match avec le résultat de l'hypothèse
        if(match(${act_nm}, '${rwr[1]}')){/*console.warn("subrule:", ${act_nm});*/`);
            // Si oui on extrait du résultat les noms des nouvelles variables
            // éventuellement produites par la réécriture.
            console.log(`        const {${syn_extract(rwr[1])}}=${act_nm};`);
            if('proof'==mode){
              // Si on construit l'arbre de preuve, on rajoute à la liste des
              // hypthèses de la preuve.
              console.log(`        proof_hyps.push(proof_last);`);
              }
            }
          // Ooops je sais plus quel est ce type d'hypothèse. Visiblement elle
          // a été prétraduite en JS donc ça doit concerner les hypothèses sur
          // les test de status d'un terme de liste (pour le Par par exemple)...
          else if(h.startsWith('const') && /(=)/.test(h)){
            const p= h.substring(6, h.indexOf("="));
            console.log(`      ${h}; /*console.warn('h=', '${h}');*/
        if(${p}){`);
            if('proof'==mode){
              // Si on construit l'arbre de preuve, on rajoute à la liste des
              // hypthèses de la preuve.
              //console.log(`        console.warn("create new predicate test", '${h}');`);
              console.log(`        proof_hyps.push(new PredicateJax('${h}'));`);
              }
            }
          // hypthèse simple d'équivalence des ensembles
          else if(/(=)/.test(h)){
            const rwr=h.split(/\s*=\s*/g);
            console.log(`      if(Set_eq(${rwr[0]}, ${rwr[1]})){`);
            if('proof'==mode){
              // Si on construit l'arbre de preuve, on rajoute à la liste des
              // hypthèses de la preuve.
              //console.log(`        console.warn("create new predicate equ ensemble", '${h}');`);
              console.log(`        proof_hyps.push(new PredicateJax('${h}'));`);
              }
            }
          // hypthèse simple de non équivalence des ensembles
          else if(/(≠)/.test(h)){
            const rwr=h.split(/\s*≠\s*/g);
            console.log(`      if(Set_neq(${rwr[0]}, ${rwr[1]})){`);
            if('proof'==mode){
              // Si on construit l'arbre de preuve, on rajoute à la liste des
              // hypthèses de la preuve.
              //console.log(`        console.warn("create new predicate non equ ensemble", '${h}');`);
              console.log(`        proof_hyps.push(new PredicateJax('${h}'));`);
              }
            }
          else{
            console.log(`      if(${h}){`);
            if('proof'==mode){
              // Si on construit l'arbre de preuve, on rajoute à la liste des
              // hypthèses de la preuve.
              //console.log(`        console.warn("create new predicate autre", ${h});`);
              console.log(`        proof_hyps.push(new PredicateJax(_${h}));`);
              }
            }
	  }
        // Si on arrive jusque là on a le résultat de la réécritture dans
        // rule_res.
        console.log(`        var rule_res=${rule_transform(conc[1])};`);
        if('proof'==mode){
          console.log(`        const zeRuleJax= new RuleJax({ str: \`\${term.toMath()}, \${Set_toMath(E)} \\\\require{mathtools}\\\\xrightarrow{~${conc[1].substr(0,4)}~} \${rule_res.t.toMath()}, \${Set_toMath(rule_res.E)}\` });`);
          console.log(`        proof_last= new NodeJax(proof_hyps, zeRuleJax)`);
          //console.log(`        console.warn("-->", proof_last.toMath(), "=> ", zeRuleJax.toMath());`);
          }
        console.log(`/*console.warn('${hyps}\\n-----------\\n${conc}');*/
          return rule_res;`);
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
        console.log(`      const { a0: ${op.syntax}}= term;`);
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
  
  const SC= {
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
  module.exports= {
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
      console.log(`<h3>Operator ${nm}</h3>`);
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
              if(activ=='eoi'){
                return te.substr(te.lastIndexOf(',')+1)+' \\vdash ~ '+te.substr(0, te.lastIndexOf(','))+'\\longmapsto '+te_.substr(0, te_.lastIndexOf(','));
                }
              else{
                return te+'\\require{mathtools}\\xrightarrow{~'+st+'~} '+te_;
                }
              }
              );
            }
          ruleText+=predicats;
          ruleText+='}{';
          }
        var act=false;
        ruleText+=conc[0].replace(/(activ|eoi)\s*\((.*)\)/, function(match, rr, te){
        act=rr=="activ";
        return (act?te:te.substr(te.lastIndexOf(',')+1)+' \\vdash ~ '+te.substr(0, te.lastIndexOf(',')));
        });
        ruleText+=(act?'\\require{mathtools}\\xrightarrow{':'\\longmapsto ')+'';
        ruleText+=conc[1].replace(/({|})/g, function(match, ac){
            return '\\'+ac;
            }).replace(/_(SUSP|STOP)\s*\(([ptu][0-9]*[_]*)\)/g, function(match, st, t){
            return '\\overset{'+(st=='STOP'?'●':'○')+'}{'+t+'}';
          }).replace(/(TERM|STOP|SUSP)\((.*)\)/,function(match, st, te_){
          te_=te_.replace('∪', '~\\cup~');          
          return (act?('~'+st+'~}'+te_):te_.substr(0, te_.lastIndexOf(',')));
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
    console.log(`
    <hr>
    <h2>Test</h2>
    <iframe src="test.html" style="border:0" width="100%"></iframe>`);
    console.log(` </body>
</html>`);
    }
  });

