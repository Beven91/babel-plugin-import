import assert from 'assert';
import Plugin from './Plugin';

export default function ({ types }) {
  let plugins = null;
  let allPlugins = {};

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

  function newPlugin(opts) {
    const {
      libraryName,
      refer,
      libraryDirectory,
      style,
      camel2DashComponentName,
      camel2UnderlineComponentName,
      fileName,
      customName,
    } = opts;
    assert(libraryName, 'libraryName should be provided');
    const plugin = new Plugin(
      libraryName,
      libraryDirectory,
      style,
      camel2DashComponentName,
      camel2UnderlineComponentName,
      fileName,
      customName,
      types,
      refer
    );
    return allPlugins[libraryName] = plugin;
  }

  const Program = {
    enter(path, { opts = {} }) {
      // Init plugin instances once.
      if (!plugins) {
        if (Array.isArray(opts)) {
          plugins = opts.map((element) => newPlugin(element));
        } else {
          plugins = [
            newPlugin(opts),
          ];
        }
        plugins.forEach((plugin) => {
          plugin.referPlugin = allPlugins[plugin.refer];
        })
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
