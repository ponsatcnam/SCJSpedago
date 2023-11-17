const fs=require('fs');

fs.readFile('semantics.js', 'utf8', function(err, data){
  const comments=data.match(/\/\*(?:.|\n)*?\*\//gm);
  const lignes=comments.join("").split("\n");
  const rules=[];
  for(var i=0; i <lignes.length; i++){
    if(/----/.test(lignes[i])){
      rules.push({ hyp: lignes[i-1], conc: lignes[i+1] });
      }
    }
    console.log(rules);
  });
