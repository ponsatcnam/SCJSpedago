# makefile

NAVIGATOR= Safari
LAUNCH_NAV= open -a $(NAVIGATOR)
NODEJS= node

### Règles 

.PHONY: clean all alone exe

all: exe html alone
	$(NODEJS) test_semantics.js

html: semantics.html
	$(LAUNCH_NAV) semantics.html

alone: proof.html
	$(LAUNCH_NAV) proof.html

exe: rewrite.js test_semantics.js
	$(NODEJS) test_semantics.js

proof.html: proof.js test_proof.js
	$(NODEJS) test_proof.js alone>proof.html

semantics.html: semantics.js transfo.js base_rewrite.html proof.js test_proof.js
	$(NODEJS) transfo.js html>$@
	$(NODEJS) test_proof.js proof >>$@

proof.js: semantics.js transfo.js base_rewrite.js
	$(NODEJS) transfo.js proof > $@

# Pour produire le code issu directement des règles de réécriture (rewrite.js),
# on dépend :
# - du fichier contenant les règles dans les commentaires (semantics.js),
# - du fichier constenant le code transformations des règles (transfo.js),
# - du fichier regroupant des fonctions utilistaires à ajouter au code produit
#   par transfo.js
rewrite.js: semantics.js transfo.js base_rewrite.js
	$(NODEJS) transfo.js>$@
 
clean:
	@- rm rewrite.js semantics.html proof.js test.html proof.html 2>/dev/null |true

#EOF
