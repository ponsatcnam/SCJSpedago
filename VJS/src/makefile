#

.PHONY: clean all

all: rewrite.js
	node rewrite.js

rewrite.js: semantics.js transfo.js
	node transfo.js>$@

clean:
	rm rewrite.js

