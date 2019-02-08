const _eval = require('eval')

const pluginName = 'EmitRender'
const fileEmitDefault = module => ({ '[name].html': module.default })

module.exports = class EmitRender {
  constructor(options = {}) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.emit.tap(pluginName, compilation => {
      const { assets } = compilation

      Object.keys(assets)
        .filter(assetName => this.options.filter ? this.options.filter.test(assetName) : true)
        .forEach(assetName => {
          const mod = _eval(assets[assetName]._value)
          const name = assetName.replace('.js', '')
          const filesMap = (this.options.emit || fileEmitDefault)(mod)

          Object.keys(filesMap).forEach(file => {
            const filename = file.indexOf('[name]') > -1 ? file.replace('[name]', name) : file
            compilation.assets[filename] = {
              source: () => filesMap[file],
              size: () => filesMap[file].length,
            }
          })

          delete compilation.assets[assetName]
        })
    })
  }
}