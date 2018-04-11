import assert from 'assert';
import Plugin from './Plugin';

export default function ({ types }) {
  let plugins = null;

  // Only for test
  global.__clearBabelAntdPlugin = () => {
    plugins = null;
  };

  function applyInstance(method, args, context) {
    for (const plugin of plugins) {
      if (plugin[method]) {
        plugin[method].apply(plugin, [...args, context]);
      }
    }
  }

  function newPlugin({
    libraryName,
    libraryDirectory,
    style,
    camel2DashComponentName,
    camel2UnderlineComponentName,
    fileName,
    customName,
  }, referPlugin) {
    assert(libraryName, 'libraryName should be provided');
    return new Plugin(
      libraryName,
      libraryDirectory,
      style,
      camel2DashComponentName,
      camel2UnderlineComponentName,
      fileName,
      customName,
      types,
      referPlugin
    );
  }

  function pushBakPlugin(opts) {
    if (!plugins.find((plugin) => plugin.libraryName === opts.libraryName2)) {
      const {
        camel2DashComponentName,
        camel2UnderlineComponentName,
        camel2DashComponentName2,
        camel2UnderlineComponentName2,
      } = opts;
      const newOption = {
        libraryName: opts.libraryName2 || opts.libraryName,
        libraryDirectory: opts.libraryDirectory2 || opts.libraryDirectory,
        style: opts.style2 || opts.style,
        camel2DashComponentName: camel2DashComponentName2 || camel2DashComponentName,
        camel2UnderlineComponentName: camel2UnderlineComponentName2 || camel2UnderlineComponentName,
        fileName: opts.fileName2 || opts.fileName,
        customName: opts.customName2 || opts.customName,
      };
      const plugin = newPlugin(newOption);
      plugins.push(plugin);
      return plugin;
    }
    return null;
  }

  const Program = {
    enter(path, { opts = {} }) {
      // Init plugin instances once.
      if (!plugins) {
        if (Array.isArray(opts)) {
          plugins = opts.map((element) => {
            let referPlugin = null;
            if (element.libraryName2) {
              referPlugin = pushBakPlugin(element);
            }
            return newPlugin(element, referPlugin);
          });
        } else {
          assert(opts.libraryName, 'libraryName should be provided');
          plugins = [
            newPlugin(opts),
          ];
        }
      }
      applyInstance('ProgramEnter', arguments, this);  // eslint-disable-line
    },
    exit() {
      applyInstance('ProgramExit', arguments, this);  // eslint-disable-line
    },
  };

  const methods = [
    'ImportDeclaration',
    'CallExpression',
    'MemberExpression',
    'Property',
    'VariableDeclarator',
    'ArrayExpression',
    'LogicalExpression',
    'ConditionalExpression',
    'IfStatement',
    'ExpressionStatement',
    'ReturnStatement',
    'ExportDefaultDeclaration',
    'BinaryExpression',
    'NewExpression',
  ];

  const ret = {
    visitor: { Program },
  };

  for (const method of methods) {
    ret.visitor[method] = function () { // eslint-disable-line
      applyInstance(method, arguments, ret.visitor);  // eslint-disable-line
    };
  }

  return ret;
}
