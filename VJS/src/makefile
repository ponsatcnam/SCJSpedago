#

.PHONY: clean all

all: rewrite.js
	node test_semantics.js

rewrite.js: semantics.js transfo.js
	node transfo.js>$@

clean:
	rm rewrite.js

