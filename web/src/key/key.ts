import { IControl } from 'maplibre-gl'
import { el, mount, list, setStyle, RedomElement } from 'redom'
import {
  default as power_layers,
  voltage_scale,
  special_voltages,
  plant_types
} from '../style/style_oim_power.ts'
import comms_layers from '../style/style_oim_telecoms.js'
import {
  default as petroleum_layers,
  colour_oil,
  colour_gas,
  colour_fuel,
  colour_intermediate,
  colour_hydrogen,
  colour_co2,
  colour_unknown
} from '../style/style_oim_petroleum.js'
import {
  default as water_layers,
  usage_scale
} from '../style/style_oim_water.js';
import { svgLine, svgLineFromLayer, svgRectFromLayer, svgCircleFromLayer } from './svg.js'
import './key.css'
// @ts-expect-error Vite virtual module
import { manifest } from 'virtual:render-svg'

const line_thickness = 6

class Td {
  el: HTMLTableCellElement
  constructor() {
    this.el = el('td')
  }
  update(data: string | RedomElement) {
    if (typeof data == 'string') {
      this.el.innerHTML = data
    } else if (!data) {
      return
    } else {
      mount(this.el, data)
    }
  }
}

const Tr = list.extend('tr', Td)

class KeyControl implements IControl {
  _map: maplibregl.Map | undefined
  _control!: HTMLButtonElement
  _container!: HTMLDivElement
  _pane: RedomElement | undefined
  onAdd(map: maplibregl.Map) {
    this._map = map

    this._control = el('button', {
      class: 'maplibregl-ctrl-icon oim-key-control'
    })

    this._container = el('div', { class: 'maplibregl-ctrl oim-key-panel' })

    this.populate()

    this._control.onclick = () => {
      this._container.style.display = 'block'
      this._control.style.display = 'none'
    }

    setTimeout(() => this.resize(), 100)
    this._map.on('resize', () => this.resize())
    return el('div', this._control, this._container, {
      class: 'maplibregl-ctrl maplibregl-ctrl-group'
    })
  }

  onRemove(): void {
    this._map = undefined
    this._container.remove()
    this._control.remove()
    this._pane = undefined
  }

  resize() {
    if (!this._pane) {
      return
    }
    // Set max-height of key depending on window style
    const map_style = window.getComputedStyle(this._map!.getContainer())
    let cont_style
    if (this._control.style.display != 'none') {
      cont_style = this._control.getBoundingClientRect()
    } else {
      cont_style = this._container.getBoundingClientRect()
    }
    const height = parseInt(map_style.height) - cont_style.top - 100 + 'px'
    setStyle(this._pane, { 'max-height': height })
  }

  header() {
    const close_button = el('.oim-key-close', '×')

    close_button.onclick = () => {
      this._container.style.display = 'none'
      this._control.style.display = 'block'
    }
    return el('.oim-key-header', el('h2', 'Key'), close_button)
  }

  async populate() {
    mount(this._container, this.header())

    const pane = el('.oim-key-pane')
    pane.appendChild(el('h3', 'Réseau électrique'))
    mount(pane, await this.voltageTable())
    pane.appendChild(el('h3', 'Centrales électriques'))
    mount(pane, await this.plantTable())
    pane.appendChild(el('h3', 'Générateurs électriques'))
    mount(pane, await this.generatorTable())
    pane.appendChild(el('h3', 'Autres énergies'))
    mount(pane, await this.towerTable())
    pane.appendChild(el('h3', 'Télécoms'))
    mount(pane, await this.telecomTable())
    pane.appendChild(el('h3', 'Oil & gaz'))
    mount(pane, this.petroleumTable())
    pane.appendChild(el('h3', 'Eau canalisée'))
    mount(pane, this.waterUsageTable());
    pane.appendChild(el('h3', 'Fontainerie'));
    mount(pane, this.waterGearTable());
    this._pane = pane

    mount(this._container, pane)
  }

  async voltageTable() {
    let rows = []
    for (const row of voltage_scale) {
      let label = row[0]?.toString()
      if (label === null) {
        label = '< 10 kV'
      } else {
        label = `≥ ${label} kV`
      }

      rows.push([label, row[1]])
    }

    for (const [key, value] of Object.entries(special_voltages)) {
      rows.push([key, value])
    }

    rows = rows.map((row) => [row[0], svgLine(row[1], line_thickness)])

    rows.push(['Souterrain', svgLine('#7A7A85', line_thickness, '3 2')])
    rows.push(['Line Reference', await this.sprite('power_line_ref')])

    const table = list('table', Tr)
    table.update(rows)
    return table
  }

  async sprite(name: string, size = 25) {
    const spriteDiv = el('img.oim-plant-sprite', {
      src: manifest['svg'][name],
      height: size
    })
    setStyle(spriteDiv, {
      'max-width': size + 'px'
    })
    return spriteDiv as unknown as SVGElement
  }

  async plantTable() {
    const rows = []
    for (const [key, value] of Object.entries(plant_types)) {
      rows.push([key.charAt(0).toUpperCase() + key.slice(1), await this.sprite(value)])
    }
    const table = list('table', Tr)
    table.update(rows)
    return table
  }

  async generatorTable() {
    const rows = [
      ['Eolienne', await this.sprite('power_wind', 14)],
      ['Panneau PV', svgRectFromLayer(power_layers, 'power_solar_panel')]
    ]
    const table = list('table', Tr)
    table.update(rows)
    return table
  }

  async towerTable() {
    const rows = [
      ['Pylônes', await this.sprite('power_tower', 10)],
      ['Pylône émergence', await this.sprite('power_tower_transition', 10)],
      ['Poteaux', await this.sprite('power_pole', 8)],
      ['Poteau émergence', await this.sprite('power_pole_transition', 8)],
      ['Transformateur', await this.sprite('power_transformer')],
      ['Organe', await this.sprite('power_switch')],
      ['Compensateur', await this.sprite('power_compensator')],
      ['Convertisseur', await this.sprite('converter')]
    ]
    const table = list('table', Tr)
    table.update(rows)
    return table
  }

  async telecomTable() {
    const rows = [
      ['Câble', svgLineFromLayer(comms_layers, 'telecoms_line')],
      ['Pylône', await this.sprite('comms_tower')],
      ['Datacenter/Exchange', svgRectFromLayer(comms_layers, 'telecoms_data_center')]
    ]
    const table = list('table', Tr)
    table.update(rows)
    return table
  }

  petroleumTable() {
    const rows = [
      ['Oil', svgLine(colour_oil, line_thickness)],
      ['Gas', svgLine(colour_gas, line_thickness)],
      ['Petroleum Intermediate', svgLine(colour_intermediate, line_thickness)],
      ['Fuel', svgLine(colour_fuel, line_thickness)],
      ['Hydrogen', svgLine(colour_hydrogen, line_thickness)],
      ['CO<sub>2</sub>', svgLine(colour_co2, line_thickness)],
      ['Other', svgLine(colour_unknown, line_thickness)],
      ['Petroleum Facility', svgRectFromLayer(petroleum_layers, 'petroleum_site')]
    ]
    const table = list('table', Tr)
    table.update(rows)
    return table
  }

  waterUsageTable() {
    let rows = [];
    for (let row of usage_scale) {
      let label = row[0];
      if (label == null){
        label = "Unknown";
      }
      if (row[1] == null) {
        continue;
      }

      rows.push([label.charAt(0).toUpperCase() + label.slice(1), svgLine(row[1], 4)]);
    }

    let table = list('table', Tr);
    table.update(rows);
    return table;
  }

  waterGearTable() {
    let rows = [];

    rows.push(['Reservoir', svgRectFromLayer(water_layers, 'water_bodies')]);
    rows.push(['Obstacle', svgRectFromLayer(water_layers, 'water_obstacles_poly')]);
    rows.push(['Valve', svgCircleFromLayer(water_layers, 'water_structure_gear')]);
    rows.push(['Inlet', svgCircleFromLayer(water_layers, 'water_flow_inlet')]);
    rows.push(['Outlet', svgCircleFromLayer(water_layers, 'water_flow_outlet')]);

    let table = list('table', Tr);
    table.update(rows);
    return table;
  }
}

export { KeyControl as default }
