import { ColorSpecification, ExpressionSpecification } from 'maplibre-gl'
import { text_paint, font } from './common.js'
import { LayerSpecificationWithZIndex } from './types.ts'

const colour_gas: ColorSpecification = '#BFBC6B'
const colour_oil: ColorSpecification = '#6B6B6B'
const colour_fuel: ColorSpecification = '#CC9F83'
const colour_intermediate: ColorSpecification = '#78CC9E'
const colour_hydrogen: ColorSpecification = '#CC78AB'
const colour_co2: ColorSpecification = '#7885CC'
const colour_unknown: ColorSpecification = '#BABABA'
const colour_neutral: ColorSpecification = '#ABABAB'

const substance: ExpressionSpecification = ['coalesce', ['get', 'substance'], ['get', 'type'], '']
const utility: ExpressionSpecification = ["coalesce", ["get", "utility"], ""];
const substation: ExpressionSpecification = ["coalesce", ["get", "substation"], ""];

const pipeline_colour: ExpressionSpecification = [
  'match',
  substance,
  ['gas', 'natural_gas', 'cng', 'lpg', 'lng'],
  colour_gas,
  'oil',
  colour_oil,
  'fuel',
  colour_fuel,
  ['ngl', 'y-grade', 'hydrocarbons', 'condensate', 'naphtha'],
  colour_intermediate,
  'hydrogen',
  colour_hydrogen,
  'carbon_dioxide',
  colour_co2,
  colour_unknown
]

const marker_colour: ExpressionSpecification = ["match",
  utility,
  ['gas'], colour_gas,
  ['oil'], colour_oil,
  ['chemical'], colour_hydrogen,
  colour_neutral
]

const pipeline_label: ExpressionSpecification = [
  'concat',
  ['case', ['has', 'name'], ['get', 'name'], ['get', 'operator']],
  [
    'case',
    ['all', ['!=', substance, ''], ['any', ['has', 'operator'], ['has', 'name']]],
    ['concat', ' (', substance, ')'],
    substance
  ]
]

const construction_p: ExpressionSpecification = ['get', 'construction'];
const pipeline_opacity: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'],
  4, ['case', construction_p, 0.3, 0.6],
  8, ['case', construction_p, 0.3, 1]
];

// Determine substation visibility
const substation_visible_p: ExpressionSpecification = [
  'any',
  [
    'all',
    ['==', substation, "transmission"],
    ['>', ['zoom'], 4]
  ],
  ['>', ['zoom'], 9],
];

// Determine the minimum zoom a point is visible at (before it can be seen as an
// area), based on the area of the substation.
const substation_point_visible_p: ExpressionSpecification = [
  'any',
  ['==', ['coalesce', ['get', 'area'], 0], 0], // Area = 0 - mapped as node
  ['all', ['<', ['coalesce', ['get', 'area'], 0], 100], ['<', ['zoom'], 16]],
  ['all', ['<', ['coalesce', ['get', 'area'], 0], 250], ['<', ['zoom'], 15]],
  ['<', ['zoom'], 13],
];

const layers: LayerSpecificationWithZIndex[] = [
  {
    zorder: 0,
    id: 'petroleum_pipeline_case',
    type: 'line',
    source: 'openinframap',
    minzoom: 7,
    'source-layer': 'petroleum_pipeline',
    paint: {
      'line-color': '#666666',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        1.5,
        16,
        ['match', ['get', 'usage'], 'transmission', 4, 1.5]
      ]
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    }
  },
  {
    zorder: 1,
    id: 'petroleum_pipeline',
    type: 'line',
    source: 'openinframap',
    minzoom: 2,
    'source-layer': 'petroleum_pipeline',
    paint: {
      'line-color': pipeline_colour,
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        3,
        1,
        16,
        ['match', ['get', 'usage'], 'transmission', 2, 1]
      ]
    }
  },
  {
    zorder: 2,
    id: 'petroleum_marker',
    type: 'circle',
    source: 'openinframap',
    minzoom: 15.5,
    'source-layer': 'petroleum_marker',
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'],
        15.5, 2,
        18.5, 5
      ],
      'circle-color': marker_colour
    },
  },
  {
    zorder: 100,
    id: 'petroleum_site',
    type: 'fill',
    source: 'openinframap',
    minzoom: 8,
    'source-layer': 'petroleum_site',
    paint: {
      'fill-opacity': 0.3,
      'fill-color': colour_oil,
      'fill-outline-color': 'rgba(0, 0, 0, 1)'
    }
  },
  {
    zorder: 101,
    id: 'petroleum_well',
    type: 'circle',
    source: 'openinframap',
    minzoom: 10,
    'source-layer': 'petroleum_well',
    paint: {
      'circle-color': colour_oil,
      'circle-stroke-color': '#666666',
      'circle-stroke-width': 1,
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 1, 12, 2, 14, 5]
    }
  },{
    zorder: 288,
    id: 'petroleum_substation_point',
    type: 'circle',
    filter: ['all', substation_visible_p, substation_point_visible_p],
    source: 'openinframap',
    'source-layer': 'petroleum_site_point',
    minzoom: 5,
    layout: {},
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'],
        5, ["match",
          substation,
          ['transmission'], 2.5,
          1
        ],
        15, ["match",
          substation,
          ['transmission'], 7,
          5
        ]
      ],
      'circle-color': pipeline_colour,
      'circle-stroke-opacity': 1,
      'circle-stroke-color': '#636363',
      'circle-stroke-width': 0.5,
      'circle-opacity': pipeline_opacity
    },
  },
  {
    zorder: 500,
    id: 'petroleum_pipeline_label',
    type: 'symbol',
    source: 'openinframap',
    'source-layer': 'petroleum_pipeline',
    minzoom: 12,
    paint: text_paint,
    layout: {
      'text-field': pipeline_label,
      'text-font': font,
      'symbol-placement': 'line',
      'symbol-spacing': 400,
      'text-size': 10,
      'text-offset': [0, 1],
      'text-max-angle': 10
    }
  },
  {
    zorder: 501,
    id: 'petroleum_site_label',
    type: 'symbol',
    source: 'openinframap',
    'source-layer': 'petroleum_site',
    minzoom: 12,
    layout: {
      'text-field': '{name}',
      'text-font': font,
      'text-anchor': 'top',
      'text-offset': [0, 1],
      'text-size': 11
    },
    paint: text_paint
  },
  {
    zorder: 502,
    id: 'petroleum_well_label',
    type: 'symbol',
    source: 'openinframap',
    'source-layer': 'petroleum_well',
    minzoom: 13,
    layout: {
      'text-field': 'Well {name}',
      'text-font': font,
      'text-anchor': 'top',
      'text-offset': [0, 0.5],
      'text-size': 10
    },
    paint: text_paint
  },
  {
    zorder: 503,
    id: 'petroleum_marker_label',
    type: 'symbol',
    source: 'openinframap',
    'source-layer': 'petroleum_marker',
    minzoom: 16.5,
    layout: {
      'text-field': '{ref}',
      'text-anchor': 'top',
      'text-offset': [0, 0.5],
      'text-size': 10,
    },
    paint: text_paint,
  }
]

export {
  layers as default,
  colour_gas,
  colour_oil,
  colour_fuel,
  colour_intermediate,
  colour_hydrogen,
  colour_co2,
  colour_unknown
}
