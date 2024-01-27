#

.PHONY: clean all

all: rewrite.js semantics.html
	open semantics.html
	node test_semantics.js

rewrite.js: semantics.js transfo.js base_rewrite.js
	node transfo.js>$@

html: semantics.html proof.js
	open -a Safari semantics.html

semantics.html: semantics.js transfo.js base_rewrite.html
	node transfo.js html>$@
	node test_proof.js proof >>$@

proof.js: semantics.js transfo.js base_rewrite.js
	node transfo.js proof > $@

clean:
	rm rewrite.js semantics.html proof.js test.html

