import { t } from 'i18next'
import { LayerSpecificationWithZIndex } from './types.ts'
import { get, match } from './stylehelpers.ts'
import { text_paint, font, oimSymbol, get_local_name } from './common.js'
import { ExpressionSpecification } from 'maplibre-gl'
import { text_paint, font } from './common.js'
import { DataDrivenPropertyValueSpecification, ExpressionSpecification } from 'maplibre-gl'

const colour_freshwater = '#7B7CBA'
const colour_wastewater = '#BAA87B'
const colour_hotwater = '#AD4C4C'
const colour_steam = '#7BBAAC'
const colour_natural = '#6990ac'

function substance_label(): ExpressionSpecification {
  return match(
    get('substance'),
    [
      ['water', t('names.substance.fresh-water')],
      ['rainwater', t('names.substance.rainwater')],
      ['hot_water', t('names.substance.hot-water')],
      [['wastewater', 'sewage', 'waterwaste'], t('names.substance.wastewater')],
      ['steam', t('names.substance.steam')]
    ],
    get('substance')
  )
}

const substance_colour: ExpressionSpecification = match(
  get('substance'),
  [
    ['water', colour_freshwater],
    ['rainwater', colour_freshwater],
    ['hot_water', colour_hotwater],
    ['wastewater', colour_wastewater],
    ['sewage', colour_wastewater],
    ['waterwaste', colour_wastewater],
    ['steam', colour_steam]
  ],
  '#7B7CBA'
)

const reservoir_colour: ExpressionSpecification = [
  'match',
  ['get', 'type'],
  'reservoir_covered',
  '#8e8e9a',
  '#3a85d9'
]
*/

// Colors
const usage_scale = [
  ['transmission', '#284893'],
  ['headrace', '#347bcf'],
  ['penstock', '#82bcfc'],
  ['tailrace', '#5a7d9d'],
  ['spillway', '#954cfc'],
  ['irrigation', '#6c9f87'],
  [null,'#7A7A85']
];

const structure_color: ExpressionSpecification = ["case",
  ["==", ["get","tunnel"],"flooded"], "#363636",
  ["==", ["get","man_made"],"pipeline"], "#ABABAB",
  "#AAAAAA"
]

// Predicates

// Visibilité
const channel_visible_p: ExpressionSpecification = ["any",
  ["all",
    ["==", ['get', 'usage'], "transmission"],
    [">", ['zoom'], 5]
  ],
  [">", ['zoom'], 7]
];

const structure_visible_p: ExpressionSpecification = ["all",
  ["any",
    ["==", ["get","tunnel"],"flooded"],
    ["==", ["get","man_made"],"pipeline"]
  ],
  channel_visible_p
];

const naturallabel_visible_p: ExpressionSpecification = ["any",
  [">", ['zoom'], 8]
];

const obstacle_visible_p: ExpressionSpecification = ["any",
  ["all",
    ["==", ['get', 'type'], "dam"],
    [">", ['zoom'], 9]
  ],
  [">", ['zoom'], 12]
];

// Rayons, largeurs
const pipeline_gear_radius: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  14,
  1,
  18, 4.5
];

const pipeline_inletoutlet_radius: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  13,
  1,
  16, 4
];

const structure_width_p: ExpressionSpecification = ['interpolate',
['linear'], ['zoom'],
8, 1.5,
13, ["case",
    ["==", ["get","man_made"],"pipeline"], 4.5,
    5.5
  ]
];
const channel_width_p: ExpressionSpecification = ['interpolate',
['linear'], ['zoom'],
3, 0.3,
16, ["case",
    ["has", "usage"], ["case",
      ["==", ["get","man_made"],"pipeline"], 3,
      4
    ],
    1.5
  ]
];
const natural_width_p: ExpressionSpecification = ['interpolate',
['linear'], ['zoom'],
3, 0.2,
16, ["case",
    ["==", ["get","type"],"river"], 3.5,
    ["==", ["get","type"],"stream"], 1,
    2
  ]
];

/*
Waiting for https://github.com/maplibre/maplibre-gl-js/issues/1235 to be solved
const intermittent_dashes: ExpressionSpecification = ['case',
  ["all",
    ["==", ["get","intermittent"],"yes"],
    [">", ['zoom'], 12]
  ], [5, 5],
  null
];
*/

// Functions
function usage_color(): DataDrivenPropertyValueSpecification<string> {
  let usage_fct: any = ['match', ["get", "usage"]];

  for (let row of usage_scale) {
    if (row[0] == null){
      usage_fct.push(row[1]);
      continue;
    }
    usage_fct.push(row[0]);
    usage_fct.push(row[1]);
  }

  return usage_fct;
}

export default function layers(): LayerSpecificationWithZIndex[] {
  return [
    {
      zorder: 19,
      id: 'water_treatment_plant',
      type: 'fill',
      source: 'water',
      minzoom: 10,
      'source-layer': 'water_treatment_plant_polygon',
      paint: {
        'fill-color': '#7BBAAC',
        'fill-opacity': 0.3,
        'fill-outline-color': 'rgba(0, 0, 0, 1)'
      }
    },
    {
      zorder: 20,
      id: 'water_treatment_plant_outline',
      type: 'line',
      source: 'water',
      minzoom: 11,
      'source-layer': 'water_treatment_plant_polygon',
      paint: {
        'line-color': 'rgba(0,0,30,1)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0, 18, 3]
      }
    },
    {
      zorder: 19,
      id: 'water_sewage_treatment_plant',
      type: 'fill',
      source: 'water',
      minzoom: 10,
      'source-layer': 'wastewater_plant_polygon',
      paint: {
        'fill-color': '#c19653',
        'fill-opacity': 0.3,
        'fill-outline-color': 'rgba(0, 0, 0, 1)'
      }
    },
    {
      zorder: 20,
      id: 'water_sewage_treatment_plant_outline',
      type: 'line',
      source: 'water',
      minzoom: 11,
      'source-layer': 'wastewater_plant_polygon',
      paint: {
        'line-color': 'rgba(0,0,30,1)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0, 18, 3]
      }
    },
    {
      zorder: 19,
      id: 'water_pumping_station',
      type: 'fill',
      source: 'water',
      minzoom: 10,
      'source-layer': 'pumping_station_polygon',
      paint: {
        'fill-color': '#7B7CBA',
        'fill-opacity': 0.3,
        'fill-outline-color': 'rgba(0, 0, 0, 1)'
      }
    },
    {
      zorder: 20,
      id: 'water_pumping_station_outline',
      type: 'line',
      source: 'water',
      minzoom: 10,
      'source-layer': 'pumping_station_polygon',
      paint: {
        'line-color': 'rgba(0,0,30,1)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0, 18, 3]
      }
    },
    {
      zorder: 20,
      id: 'water_reservoir',
      type: 'fill',
      source: 'water',
      minzoom: 4,
      'source-layer': 'water_reservoir',
      paint: {
        'fill-color': reservoir_colour
      }
    },
    {
      zorder: 21,
      id: 'water_reservoir_covered_outline',
      filter: ['==', ['get', 'type'], 'reservoir_covered'],
      type: 'line',
      source: 'water',
      minzoom: 11,
      'source-layer': 'water_reservoir',
      paint: {
        'line-color': 'rgba(200,200,200,1)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 2, 18, 20],
        'line-offset': ['interpolate', ['linear'], ['zoom'], 11, 1, 18, 10],
        'line-blur': 1
      }
    },
    {
      zorder: 21,
      id: 'water_reservoir_outline',
      filter: ['!=', ['get', 'type'], 'reservoir_covered'],
      type: 'line',
      source: 'water',
      minzoom: 10,
      'source-layer': 'water_reservoir',
      paint: {
        'line-color': 'rgba(80,80,100,1)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0, 18, 4]
      }
    },
    {
      zorder: 20,
      id: 'water_pipeline_case',
      type: 'line',
      source: 'water',
      minzoom: 7,
      'source-layer': 'water_pipeline',
      paint: {
        'line-color': '#777777',
        'line-width': [
          'interpolate',
          ['exponential', 1.2],
          ['zoom'],
          3,
          1,
          18,
          ['case', ['==', ['get', 'usage'], 'transmission'], 18, 6]
        ]
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    },
    {
      zorder: 21,
      id: 'water_pipeline',
      type: 'line',
      source: 'water',
      minzoom: 3,
      'source-layer': 'water_pipeline',
      paint: {
        'line-color': substance_colour,
        'line-width': [
          'interpolate',
          ['exponential', 1.2],
          ['zoom'],
          3,
          1,
          18,
          ['case', ['==', ['get', 'usage'], 'transmission'], 10, 3]
        ]
      }
    },
    {
      zorder: 21,
      id: 'water_pressurised',
      type: 'line',
      source: 'water',
      minzoom: 3,
      'source-layer': 'pressurised_waterway',
      paint: {
        'line-color': substance_colour,
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.3, 16, 4]
      }
    },
    {
      zorder: 30,
      id: 'water_well',
      type: 'circle',
      source: 'water',
      minzoom: 8,
      'source-layer': 'water_well',
      paint: {
        'circle-color': '#7B7CBA',
        'circle-radius': ['interpolate', ['exponential', 1.2], ['zoom'], 8, 1, 19, 14],
        'circle-stroke-color': 'rgba(0, 0, 0, 1)',
        'circle-stroke-width': 1
      }
    },
    {
      zorder: 518,
      id: 'water_reservoir_label',
      type: 'symbol',
      source: 'water',
      'source-layer': 'water_reservoir_point',
      minzoom: 11,
      paint: text_paint,
      layout: {
        'text-field': get_local_name(),
        'text-font': font,
        'text-size': ['interpolate', ['linear'], ['zoom'], 11, 9, 18, 17],
        'text-anchor': 'top',
        'text-offset': [0, 1]
      }
    },
    {
      zorder: 519,
      id: 'water_pipeline_label',
      type: 'symbol',
      source: 'water',
      'source-layer': 'water_pipeline',
      minzoom: 11,
      paint: text_paint,
      layout: {
        'text-field': [
          'case',
          ['has', 'name'],
          ['concat', get_local_name(), ' (', substance_label(), ')'],
          substance_label()
        ],
        'text-font': font,
        'symbol-placement': 'line',
        'symbol-spacing': 400,
        'text-size': 10,
        'text-offset': [0, 1],
        'text-max-angle': 10
      }
    },
    oimSymbol({
      zorder: 520,
      id: 'water_pumping_station_symbol',
      source: 'water',
      sourceLayer: 'pumping_station_point',
      minZoom: 9,
      textField: ['get', 'name'],
      textMinZoom: 10,
      iconImage: [
        'match',
        ['get', 'substance'],
        'water',
        'water_pumping_station',
        'sewage',
        'sewage_pumping_station',
        'pumping_station'
      ]
    },
  {
    zorder: 202,
    id: 'water_body',
    type: 'fill',
    source: 'openinframap',
    'source-layer': 'water_body',
    filter: ["any",
      ["!", ["has", "intermittent"]],
      ["!=", ["get", "intermittent"], "yes"]
    ],
    minzoom: 7,
    paint: {
      'fill-opacity': 0.7,
      'fill-color': "#284893",
      'fill-outline-color': "#232323"
    }
  },
  {
    zorder: 203,
    id: 'water_body_intermittent',
    type: 'fill',
    source: 'openinframap',
    'source-layer': 'water_body',
    filter: ["any",
      ["==", ['get', 'intermittent'], 'yes']
    ],
    minzoom: 7,
    paint: {
      'fill-opacity': 0.7,
      'fill-color': "#284893",
      'fill-outline-color': "#232323"
    }
  },
  {
    zorder: 205,
    id: 'waternatural_river',
    type: 'line',
    source: 'naturalmap',
    minzoom: 3,
    'source-layer': 'water_river',
    // Temporary, waiting https://github.com/maplibre/maplibre-gl-js/issues/1235 to be solved
    filter: ["any",
      ["<", ["zoom"], 13],
      ["!", ["has", "intermittent"]],
      ["!=", ["get", "intermittent"], "yes"]
    ],
    paint: {
      'line-color': colour_natural,
      'line-width': natural_width_p
    }
  },
  {
    // Temporary, waiting https://github.com/maplibre/maplibre-gl-js/issues/1235 to be solved
    zorder: 206,
    id: 'waternatural_river_intermittent',
    type: 'line',
    source: 'naturalmap',
    minzoom: 13,
    'source-layer': 'water_river',
    filter: ["any",
      ["==", ['get', 'intermittent'], 'yes']
    ],
    paint: {
      'line-color': colour_natural,
      'line-width': natural_width_p,
      'line-dasharray': [3, 3]
    }
  },
  {
    zorder: 300,
    id: 'water_obstacle_poly',
    type: 'fill',
    source: 'openinframap',
    'source-layer': 'water_obstacle_poly',
    filter: obstacle_visible_p,
    minzoom: 10,
    paint: {
      'fill-opacity': 0.7,
      'fill-color': "#696969",
      'fill-outline-color': "#232323"
    }
  },
  {
    zorder: 301,
    id: 'water_obstacle_line',
    type: 'line',
    source: 'openinframap',
    'source-layer': 'water_obstacle_line',
    filter: obstacle_visible_p,
    minzoom: 10,
    paint: {
      'line-color': '#232323',
      'line-opacity': 0.7,
      'line-width': 4
    },
    layout: {
      'line-join': 'round'
    }
  },
  {
    zorder: 305,
    id: 'waternatural_falls',
    type: 'symbol',
    source: 'openinframap',
    'source-layer': 'water_landmarks',
    filter: ["any",
      ["==", ['get', 'waterway'], "waterfall"]
    ],
    minzoom: 11,
    layout: {
      'icon-image': 'water_fall'
    }
  },
  {
    zorder: 305,
    id: 'waternatural_fords',
    type: 'symbol',
    source: 'openinframap',
    'source-layer': 'water_landmarks',
    filter: ["any",
      ["==", ['get', 'ford'], "yes"]
    ],
    minzoom: 15,
    layout: {
      'icon-image': 'water_ford'
    }
  },
  {
    zorder: 310,
    id: 'water_structure',
    type: 'line',
    source: 'openinframap',
    minzoom: 8,
    'source-layer': 'water_channel',
    filter: structure_visible_p,
    paint: {
      'line-color': structure_color,
      'line-width': structure_width_p
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
  },
  {
    zorder: 311,
    id: 'water_channel',
    type: 'line',
    source: 'openinframap',
    minzoom: 3,
    'source-layer': 'water_channel',
    // Temporary, waiting https://github.com/maplibre/maplibre-gl-js/issues/1235 to be solved
    filter: ["all",
      channel_visible_p,
      ["any",
        ["<", ["zoom"], 13],
        ["!", ["has", "intermittent"]],
        ["!=", ["get", "intermittent"], "yes"]
      ]
    ],
    paint: {
      'line-color': usage_color(),
      'line-width': channel_width_p
    }
  },
  {
    // Temporary, waiting https://github.com/maplibre/maplibre-gl-js/issues/1235 to be solved
    zorder: 312,
    id: 'water_channel_intermittent',
    type: 'line',
    source: 'openinframap',
    minzoom: 13,
    'source-layer': 'water_channel',
    filter: ["all",
      ["==", ['get', 'intermittent'], 'yes'],
      channel_visible_p
    ],
    paint: {
      'line-color': usage_color(),
      'line-width': channel_width_p,
      'line-dasharray': [3, 2]
    }
  },
  {
    zorder: 315,
    id: 'water_channel_arrow',
    type: 'symbol',
    source: 'openinframap',
    minzoom: 16,
    'source-layer': 'water_channel',
    filter: channel_visible_p,
    layout: {
      'symbol-placement': 'line',
      'symbol-spacing': 200,
      'icon-image': 'arrow',
      'icon-size': 0.0075,
      'icon-rotate': 180
    },
    paint: {
      'icon-color': usage_color()
    }
  },
  {
    zorder: 320,
    id: 'water_structure_gear',
    type: 'circle',
    source: 'openinframap',
    'source-layer': 'pipeline_gear',
    filter: obstacle_visible_p,
    minzoom: 15,
    paint: {
      'circle-radius': pipeline_gear_radius,
      'circle-color': '#787878',
      'circle-stroke-opacity': 1,
      'circle-stroke-color': '#424242',
      'circle-stroke-width': 1,
      'circle-opacity': 1
    }
  },
  {
    zorder: 330,
    id: 'water_flow_inlet',
    type: 'circle',
    source: 'openinframap',
    'source-layer': 'duct_inlet',
    filter: obstacle_visible_p,
    minzoom: 13,
    paint: {
      'circle-radius': pipeline_inletoutlet_radius,
      'circle-color': '#009900',
      'circle-stroke-opacity': 1,
      'circle-stroke-color': '#424242',
      'circle-stroke-width': 1,
      'circle-opacity': 1
    }
  },
  {
    zorder: 331,
    id: 'water_flow_outlet',
    type: 'circle',
    source: 'openinframap',
    'source-layer': 'duct_outlet',
    filter: obstacle_visible_p,
    minzoom: 13,
    paint: {
      'circle-radius': pipeline_inletoutlet_radius,
      'circle-color': '#DD0000',
      'circle-stroke-opacity': 1,
      'circle-stroke-color': '#424242',
      'circle-stroke-width': 1,
      'circle-opacity': 1
    }
  },
  {
    zorder: 520,
    id: 'water_channel_label',
    type: 'symbol',
    source: 'openinframap',
    'source-layer': 'water_channel',
    minzoom: 11,
    filter: channel_visible_p,
    paint: text_paint,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': font,
      'symbol-placement': 'line',
      'symbol-spacing': 400,
      'text-size': 10,
      'text-offset': [0, 1],
      'text-max-angle': 10
    }
  },
  {
    zorder: 521,
    id: 'water_natural_label',
    type: 'symbol',
    source: 'naturalmap',
    'source-layer': 'water_river',
    minzoom: 11,
    filter: naturallabel_visible_p,
    paint: text_paint,
    layout: {
      'text-field': ["case",
        ["has", "name"], ['get', 'name'],
        ''
      ],
      iconMinScale: 0.5,
      iconMaxZoom: 14.5
    }),
    oimSymbol({
      zorder: 521,
      id: 'water_treatment_plant_symbol',
      source: 'water',
      sourceLayer: 'water_treatment_plant_point',
      minZoom: 6,
      textField: get_local_name(),
      textMinZoom: 10,
      iconImage: 'water_treatment_plant',
      iconMinScale: 0.2,
      iconMaxZoom: 14.5,
      textOffset: 1.9
    }),
    oimSymbol({
      zorder: 522,
      id: 'water_sewage_treatment_plant_symbol',
      source: 'water',
      sourceLayer: 'wastewater_plant_point',
      minZoom: 6,
      textField: ['step', ['zoom'], '', 10, get_local_name()],
      textMinZoom: 10,
      iconImage: 'sewage_treatment_plant',
      iconMinScale: 0.2,
      iconMaxZoom: 14.5,
      textOffset: 1.9
    })
  ]
}

export { colour_freshwater, colour_wastewater, colour_hotwater, colour_steam }
