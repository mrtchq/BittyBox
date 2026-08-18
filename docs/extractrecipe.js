javascript:((bitty_box_recipes) => {
  function createDoc(url) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "document";
    xhr.onload = () => {
      let ld = xhr.response.querySelectorAll('script[type="application/ld+json"]');
      let data = Array.from(ld).map(l => l.innerText);
      let parsed = data.map(d => JSON.parse(d)).filter(p => (p['@type'] == "Recipe" || p['@type']?.includes('Recipe')));
      if (parsed.length) {
        let recipe = parsed[0];
        let string = JSON.stringify(recipe);
        let blob = new Blob([string], {type: "application/ld+json"});
        let reader = new FileReader();
        reader.onload = (e) => {
          let url = bitty_box_recipes + '/#/' + e.target.result;
          let link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            link.parentElement.removeChild(link);
          }, 1000);
        };
        reader.readAsDataURL(blob);
      }
    };
    xhr.send();
  }
  let id="bittybox";
  createDoc(location.href);
})(window.bittyboxRecipeDomain || 'https://bittybox.org');