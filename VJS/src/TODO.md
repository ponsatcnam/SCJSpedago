# TODO:

- addEvent et addProgram 
  à priori on change rien.  On a envsagé de se trimbaler une liste des programmes à rajouter en //. Pas retenu car a priori pas de add depuis le programme lui-même.
  Bon finalement on rajoute un constructeur de machine et une règle addProgram(). Le addEvent() sera simulé par un addProgram(Generete(nom)).
  Ça permettra de dire des choses sur la sémantique de la machine d'exécution.

- ajouter les configs. And, Or, PosConfig
- Exemple : `[ loop [ generate &a , stop ] || loop [ stop , generate &b ]]` Kill et Control => `[ loop [ generate &a ; stop ] || kill loop [ stop ; generate &b ]] by &e`
- passage aux événements valués


