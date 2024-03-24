import { StyleSpecification } from 'maplibre-gl'

const style: StyleSpecification = {
  version: 8,
  name: 'InfosReseaux',
  sources: {
    openmaptiles: {
      type: "vector",
      url: 'https://api.maptiler.com/tiles/v3/tiles.json?key=2raHq2ahXwNHsKorHH5t',
      maxzoom: 15,
      attribution: '<a href="https://openmaptiles.org/">© OpenMapTiles</a>'
    },
    openinframap: {
      type: 'vector',
      url: 'https://map.infos-reseaux.com/map.json'
    },
    naturalmap: {
      type: 'vector',
      url: 'https://map.infos-reseaux.com/natural.json'
    },
    solar_heatmap: {
      type: 'vector',
      url: 'https://map.infos-reseaux.com/heatmap.json'
    }
  },
  glyphs: '/fonts/{fontstack}/{range}.pbf',
  layers: []
}

export default style
