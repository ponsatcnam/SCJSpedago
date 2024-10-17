#

.PHONY: clean all alone

all: rewrite.js html
	node test_semantics.js

# Pour produire le code issu directement des règles de réécriture (rewrite.js),
# on dépend :
# - du fichier contenant les règles dans les commentaires (semantics.js),
# - du fichier constenant le code transformations des règles (transfo.js),
# - du fichier regroupant des fonctions utilistaires à ajouter au code produit
#   par transfo.js
rewrite.js: semantics.js transfo.js base_rewrite.js
	node transfo.js>$@
 
html: semantics.html proof.js
	open -a Safari semantics.html

alone: proof.html
	open -a Safari proof.html

proof.html: proof.js
	node test_proof.js alone>proof.html

semantics.html: semantics.js transfo.js base_rewrite.html proof.js
	node transfo.js html>$@
	node test_proof.js proof >>$@

proof.js: semantics.js transfo.js base_rewrite.js
	node transfo.js proof > $@

clean:
	rm rewrite.js semantics.html proof.js test.html

