javascript:((itty_bitty_recipes) => {
  try {

    let els=document.querySelectorAll('script[type="application/ld+json"]');

    for (let l of els) {
      if (!l) console.log ("No metadata found in HTML.");
      let ldjson = l.innerText.trim();
      let json = JSON.parse(ldjson);

      console.log("Found metadata:", json)
      if (json["@graph"]) json = json["@graph"];
      if (!Array.isArray(json)) json = [json];
      json = json.find((o)=>o['@type']=="Recipe")

      if (!json?.recipeInstructions?.length) {
        console.log ("Incomplete recipe information.");
        continue;
      }

      var blob = new Blob([JSON.stringify(json)],{type : 'application/ld+json;charset=utf-8'});
      var a = new FileReader();
      a.onload = function(e) {
        let url = itty_bitty_recipes + '/#/' + e.target.result;
        console.log("URL", url.length, url)
        open(url);
      };
      a.readAsDataURL(blob);
    }
  } catch (e) {
    alert("itty.bitty.recipes: Failed\n" + e)
  }
})('http://localhost')
