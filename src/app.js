import mapValues from 'lodash.mapvalues';
import bezirke from './bezirke.json';

const words = ['', 'zweit', 'dritt', 'viert', 'fünft'];

const messageEl = document.querySelector('.output span');
const linkEL = document.querySelector('.output a');
const tableEl = document.querySelector('.output table');

async function queryCity(cityName = document.querySelector('#city').value) {
  const query = `SELECT ?item ?itemLabel ?population ?area 
  WHERE 
  {
    ?item ?label "${cityName.replace(/"/gm, '')}"@de.
    ?item wdt:P1082 ?population.
    ?item wdt:P2046 ?area.
    OPTIONAL { ?item p:P1082/pq:P585 ?date }
    
    SERVICE wikibase:label { bd:serviceParam wikibase:language "de". }
  }
  ORDER BY DESC(?date)
  LIMIT 1`;

  const url = new URL('https://query.wikidata.org/sparql');
  const params = new URLSearchParams({ query });
  url.search = params.toString();

  const data = await fetch(url, {
    headers: { 'Accept': 'application/sparql-results+json' }
  }).then(r => r.json());

  if (data.results.bindings.length === 0) {
    throw new Error('No city found.');
  }
  
  let { population, area, item, itemLabel: name } = mapValues(data.results.bindings[0], 'value');
  population = parseInt(population)
  area = parseFloat(area)

  const city = { population, area, item, name };
  console.log(city, bezirke);

  const comparison = [...bezirke, city];
  
  const byPopulation = [...comparison].sort((a, b) => b.population - a.population);
  const byArea = [...comparison].sort((a, b) => b.area - a.area);

  const placePopulation = determinePlace(byPopulation, city);
  const placeArea = determinePlace(byArea, city);

  linkEL.href = item;
  linkEL.innerText = name;
  

  if (placeArea === placePopulation) {
    return `wäre einwohnermäßig und flächenmäßig Berlins ${placePopulation} Bezirk.`;
  } else {
    return `wäre einwohnermäßig Berlins ${placePopulation} und flächenmäßig ${placeArea} Bezirk.`;
  }
}

function determinePlace(comparison, city, type = 'flächenmäßig') {
  const place = comparison.findIndex(c => c.item === city.item);
  if (place > bezirke.length / 2) {
    const fromBack = bezirke.length - place;
    return `${words[fromBack]}kleinster`;
  } else {
    return `${words[place]}größter`;
  }
}

function toggle() {
  document.querySelector('.output').classList.toggle('hidden');
  document.querySelector('.form').classList.toggle('hidden');
}


document.querySelector('button#query').addEventListener('click', async () => {
  try {
    const message = await queryCity();
    messageEl.innerText = message;
  } catch (e) {
    messageEl.innerText = e.toString();
  }

  toggle();
});
document.querySelector('button#back').addEventListener('click', () => toggle());