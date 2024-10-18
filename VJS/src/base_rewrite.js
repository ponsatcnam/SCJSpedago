/*
Basic functions for the implementation of rewritting rules.
*/

/* ** RuleJax **
Protoype d'objet pour gérer les règles de réécritures (les dénominateurs).
*/
function RuleJax(params){
  // Permet d'éviter les new
  if(!(this instanceof RuleJax)){
    return new RuleJax(params);
    }
  if(params.str){
    this.rule= params.str;
    }
  else{
    switch(params.nm){
      case 'react':{
        this.type= 0;
        break;
        }
      case 'instant':{
        this.type=1;
        break;
        }
      case 'activ':{
        this.type=2;
        break;
        }
      case 'eoi':{
        this.type=3;
        break;
        }
      }
    }
  };
RuleJax.prototype.toMath=function(){
  // retourne le latex directement.
  let res= '';
  if(undefined===this.type){
    res= this.rule;
    }
  else{
    switch(this.type){
        case 0:{
          res+= '~\\require{mathtools}\\Rrightarrow~';
          break;
          }
        case 1:{
          res+= '~\\Rightarrow~';
          break;
          }
        case 2:{
          res+= `~\\require{mathtools}\\xrightarrow{~${this.state}~}~`;
          break;
          }
        case 3:{
          res+= '~\\longmapsto~';
          break;
          }
      }
    }
  return res;
  };
RuleJax.prototype.toString=function(){
  return this.toMath();
  };

/* ** PredicateJax **
Protoype d'objet pour gérer les prédicats.
*/
function PredicateJax(s){
  if(!(this instanceof PredicateJax)){
    return new PredicateJax(s);
    }
  this.predicate= s;
  };
PredicateJax.prototype.toMath=function(){
  let res= this.predicate;
  return res;
  };
PredicateJax.prototype.toString=function(){
  return this.toMath();
  };

/* ** NodeJax **
Un nœud complet avec des prédicas et une règle.
*/
function NodeJax(predicates, rule){
  if(!(this instanceof NodeJax)){
    return new NodeJax(predicates,  rule);
    }
  this.predicates= predicates;
  this.rule= rule;
  };
NodeJax.prototype.toMath= function(){
    let res= '';
    if(1==this.predicates.length
        && "true"==this.predicates[0].toMath()
        ){
      res= this.rule.toMath();
      }
    else{
      res= '\\frac{';
      for(var i in this.predicates){
        const p= this.predicates[i];
        res+= (0!=i)?'\\hspace{1cm}':'';
        if("string"==typeof(p) && 'true'==p){
            continue;
          }
        if(p.toMath){
          res+= p.toMath();
          }
        else{
          res+= p;
          }
        }
      res+= '}{';
      res+= this.rule.toMath();
      res+= '}';
      }
    return res;
    };
NodeJax.prototype.toString= function(){
    return this.toMath();
    };


/* Gestion des listes */
const nil=[];

Object.defineProperty(nil, "toMath"
, { value: function(){
        return "[]";
        }
  , enumerable: false
    }
  );
function head(l){
  return l[0];
  };
function tail(l){
  let res= [];
  for(var i in l){
    if(0==i){
      continue;
      }
    res.push(l[i]);
    }
  return res;
  };
function cons(head, tail){
  let res= [head];
  for(var elt of tail){
    res.push(elt);
    }
  return res;
  };
function List_toMath(l){
  var res= '[';
  for(var idx in l){
    const e= l[idx];
    res+= (0!=idx?', ':'');
    if(e.nm=="_SUSP"){
      res+= `\\overset{○}{${e.t.toMath()}}`;
      }
    else if(e.nm=="_STOP"){
      res+= `\\overset{●}{${e.t.toMath()}}`;
      }
    else{
      res+= e.toMath();
      }
    }
  return res+']';
  }
function List_isHeadSUSP(l){
  if(l[0] instanceof _SUSP){
    return l[0].t;
    }
  return false;
  }
function List_isHeadSTOP(l){
  if(l[0] instanceof _STOP){
    return l[0].t;
    }
  return false;
  }
function _List_isNotEmpty(l){
  return `${List_toMath(l)}≠[]`;
  };
function List_isNotEmpty(l){
  return (l?l:[]).length>0;
  };
function List_isEmpty(l){
  return 0===(l?l:[]).length;
  };
function _List_isEmpty(l){
  return `${List_toMath(l)}=[]`;
  };

const _true= "true";
const _false= "false";
/*
Gestion des ensembles (événements/signaux).
*/
function Set_eq(E, E_){
  let keyE_= Object.keys(E_);
  for(var elt of Object.keys(E)){
    if(!keyE_.includes(elt)){
      return false;
      }
    }
  return true;
  };
function Set_neq(E, E_){
  let keyE_=Object.keys(E_);
  for(var elt of Object.keys(E)){
    if(!keyE_.includes(elt)){
      return true;
      }
    }
  return false;
  };
function _Set_isIn(E, elt){
  return `${elt}~∈~${Set_toMath(E)}`;
  };
function _Set_isNotIn(E, elt){
  return `elt~∉~${Set_toMath(E)}`;
  };
function Set_isIn(E, elt){
  return Object.keys(E).includes(elt);
  };
function Set_isNotIn(E, elt){
  return !Set_isIn(E, elt);
  };
function Set_add(E, set){
  var res= {};
  for(var elt of Object.keys(E)){
    res[elt]= true;
    }
  for(var elt of set){
    res[elt]=true;
    }
  return res;
  }
function Set_toMath(E){
  let res= "\\{";
  let ks= Object.keys(E);
  let n= true;
  for(var i of ks){
    const e= E[i];
    res+= (n?'':', ')+i;
    n= false;
    }
  return res+'\\}';
  };
/*
Gestion des marqueurs d'exécution des branches du parallèle.
*/
function _SUSP(t){
  if(!(this instanceof _SUSP)){
    return new _SUSP(t);
    }
  this.nm= '_SUSP';
  this.t= t;
  }
function _STOP(t){
  if(!(this instanceof _STOP)){
    return new _STOP(t);
    }
  this.nm= '_STOP';
  this.t= t;
  }

/*
Marqueurs de statut d'exécution des programmes.
*/
function SUSP(t, E){
  if(!(this instanceof SUSP)){
    return new SUSP(t, E);
    }
  this.nm= 'SUSP';
  this.t= t;
  this.E= E;
  }
function STOP(t, E){
  if(!(this instanceof STOP)){
    return new STOP(t, E);
    }
  this.nm= 'STOP';
  this.t= t;
  this.E= E;
  }
function TERM(t, E){
  if(!(this instanceof TERM)){
    return new TERM(t, E);
    }
  this.nm= 'TERM';
  this.t= t;
  this.E= E;
  }

/*
Utilitaire d'extraction de l'opérateur en tête.
*/
function match(res, s){
  return res.nm==s.substr(0,s.indexOf("("));
  }

