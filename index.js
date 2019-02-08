const _eval = require('eval')

const pluginName = 'EmitRender'
const fileEmitDefault = module => ({ '[name].html': module.default })

function isObjLiteral(_obj) {
  var _test = _obj;
  return (typeof _obj !== 'object' || _obj === null ?
    false :  
    (
      (function () {
        while (!false) {
          if (  Object.getPrototypeOf( _test = Object.getPrototypeOf(_test)  ) === null) {
            break;
          }      
        }
        return Object.getPrototypeOf(_obj) === _test;
      })()
    )
  );
}

module.exports = class EmitRenderPlugin {
  constructor(options = {}) {
    this.options = options
  }

  apply(compiler) {
    compiler.hooks.emit.tap(pluginName, compilation => {
      const { assets } = compilation

      Object.keys(assets)
        .filter(assetName => this.options.filter ? this.options.filter.test(assetName) : true)
        .forEach(assetName => {
          const source = assets[assetName].source()
          const mod = _eval(source)
          const name = assetName.replace('.js', '')
          const filesMap = (this.options.emit || fileEmitDefault)(mod)

          Object.keys(filesMap)
            .filter(Boolean)
            .forEach(file => {
              const filename = file.indexOf('[name]') > -1 ? file.replace('[name]', name) : file
              const content = filesMap[file]
              
              try {
                let exported = content
                if (typeof content !== 'string') {
                  if (typeof content === 'number') {
                    exported = content.toString()
                  } else if (isObjLiteral(content)) {
                    exported = JSON.stringify(content)
                  } else {
                    throw 'BAD_FORMAT'
                  }
                }

                compilation.assets[filename] = {
                  source: () => exported,
                  size: () => exported.length,
                }
              } catch (e) {
                if (e === 'BAD_FORMAT') {
                  console.error(`[EmitRenderPlugin] Bad format for file "${file}". Expected string, number or JSONable. Got: ${Object.prototype.toString.call(content)}`)
                }
              }
            })

          delete compilation.assets[assetName]
        })
    })
  }
}