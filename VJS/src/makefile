#

.PHONY: clean all

all: rewrite.js semantics.html
	open semantics.html
	node test_semantics.js

rewrite.js: semantics.js transfo.js
	node transfo.js>$@

html: semantics.html
	open -a Safari semantics.html

semantics.html: semantics.js transfo.js base_rewrite.html
	node transfo.js html>$@

clean:
	rm rewrite.js semantics.html

