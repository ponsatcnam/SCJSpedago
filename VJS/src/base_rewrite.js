/*
Basic functions for the implementation of rewritting rules.
*/

function RuleJax(params){
  if(!(this instanceof RuleJax)){
    return new PredicateJax(params);
    }
  if(params.str){
    this.rule=param.str;
    }
  else{
    switch(params.nm){
      case 'react':{
	this.arrow='~\\Rrightarrow~';
	this.type=0;
	break;
	}
      case 'instant':{
	this.arrow='~\\Rightarrow~';
	this.type=1;
	break;
	}
      case 'activ':{
	this.arrow='~\\xrightarrow{~~}';
	this.type=2;
	break;
	}
      case 'eoi':{
	this.arrow='~\\longmapsto~';
	this.type=3;
	break;
	}
      }
    }
  };
RuleJax.prototype.toMath=function(){
  let res=this.rule;
  return res;
  };
RuleJax.prototype.toString=function(){
  return this.toMath();
  };

function PredicateJax(s){
  if(!(this instanceof PredicateJax)){
    return new PredicateJax(s);
    }
  this.predicate=s;
  };
PredicateJax.prototype.toMath=function(){
  let res=this.predicate;
  return res;
  };
PredicateJax.prototype.toString=function(){
  return this.toMath();
  };

function NodeJax(predicates, rule){
  if(!(this instanceof NodeJax)){
    return new NodeJax(predicates,  rule);
    }
  this.predicates=predicates;
  this.rule=rule;
  };
NodeJax.prototype.toMath=function(){
  let res='';
  if(1==this.predicates.length && this.predicates[0]=='true'){
    res+=this.rule.toMath();
    }
  else{
    res='\\frac{';
    for(var i in this.predicates){
      const p=this.predicates[i];
      res+=(0!=i)?'\\hspace{1cm}':'';
      if(p.toMath){
        res+=p.toMath();
        }
      else{
        res+=p;
        }
      }
    res+='}{';
    res+=this.rule.toMath();
    res+='}';
    }
  return res;
  };
NodeJax.prototype.toString=function(){
  return this.toMath();
  };


/* Gestion des listes */
const nil=[];

nil.toMath=function(){
  return "[]";
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
function List_toMath(l){
  var res='[';
  for(var idx in l){
    const e=l[idx];
    res+=(0!=idx?', ':'');
    if(e.nm=="_SUSP"){
      res+=`\\overset{○}{${e.a0.toMath()}}`;
      }
    else if(e.nm=="_STOP"){
      res+=`\\overset{●}{${e.a0.toMath()}}`;
      }
    else{
      res+=e.a0.toMath();
      }
    }
  return res+']';
  }
function List_isHeadSUSP(l){
  //console.log('** is SUSP', l[0]);
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
  return `${l}≠[]`;
  };
function List_isNotEmpty(l){
  return (l?l:[]).length>0;
  };
function List_isEmpty(l){
  return (l?l:[]).length===0;
  };

/*
Gestion des ensembles (événements/signaux).
*/
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
  //console.log(`${elt} is in ${E} : ${Object.keys(E).includes(elt)}`);
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
function Set_toMath(E){
  let res="\\{";
  let ks=Object.keys(E);
  let n=true;
  for(var i of ks){
    const e=E[i];
    res+=(n?', ':'')+e;
    n=false;
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

/*
Marqueurs de statut d'exécution des programmes.
*/
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

/*
Utilitaire d'extraction de l'opérateur en tête.
*/
function match(res, s){
  return res.nm==s.substr(0,s.indexOf("("));
  }

