'use strict';

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

var React = _interopDefault(require('react'));
var PropTypes = _interopDefault(require('prop-types'));
var Prefixer = _interopDefault(require('inline-style-prefixer'));
var stylePropType = _interopDefault(require('react-style-proptype'));

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

function componentWillMount() {
  // Call this.constructor.gDSFP to support sub-classes.
  var state = this.constructor.getDerivedStateFromProps(this.props, this.state);
  if (state !== null && state !== undefined) {
    this.setState(state);
  }
}

function componentWillReceiveProps(nextProps) {
  // Call this.constructor.gDSFP to support sub-classes.
  // Use the setState() updater to ensure state isn't stale in certain edge cases.
  function updater(prevState) {
    var state = this.constructor.getDerivedStateFromProps(nextProps, prevState);
    return state !== null && state !== undefined ? state : null;
  }
  // Binding "this" is important for shallow renderer support.
  this.setState(updater.bind(this));
}

function componentWillUpdate(nextProps, nextState) {
  try {
    var prevProps = this.props;
    var prevState = this.state;
    this.props = nextProps;
    this.state = nextState;
    this.__reactInternalSnapshotFlag = true;
    this.__reactInternalSnapshot = this.getSnapshotBeforeUpdate(
      prevProps,
      prevState
    );
  } finally {
    this.props = prevProps;
    this.state = prevState;
  }
}

// React may warn about cWM/cWRP/cWU methods being deprecated.
// Add a flag to suppress these warnings for this special case.
componentWillMount.__suppressDeprecationWarning = true;
componentWillReceiveProps.__suppressDeprecationWarning = true;
componentWillUpdate.__suppressDeprecationWarning = true;

function polyfill(Component) {
  var prototype = Component.prototype;

  if (!prototype || !prototype.isReactComponent) {
    throw new Error('Can only polyfill class components');
  }

  if (
    typeof Component.getDerivedStateFromProps !== 'function' &&
    typeof prototype.getSnapshotBeforeUpdate !== 'function'
  ) {
    return Component;
  }

  // If new component APIs are defined, "unsafe" lifecycles won't be called.
  // Error if any of these lifecycles are present,
  // Because they would work differently between older and newer (16.3+) versions of React.
  var foundWillMountName = null;
  var foundWillReceivePropsName = null;
  var foundWillUpdateName = null;
  if (typeof prototype.componentWillMount === 'function') {
    foundWillMountName = 'componentWillMount';
  } else if (typeof prototype.UNSAFE_componentWillMount === 'function') {
    foundWillMountName = 'UNSAFE_componentWillMount';
  }
  if (typeof prototype.componentWillReceiveProps === 'function') {
    foundWillReceivePropsName = 'componentWillReceiveProps';
  } else if (typeof prototype.UNSAFE_componentWillReceiveProps === 'function') {
    foundWillReceivePropsName = 'UNSAFE_componentWillReceiveProps';
  }
  if (typeof prototype.componentWillUpdate === 'function') {
    foundWillUpdateName = 'componentWillUpdate';
  } else if (typeof prototype.UNSAFE_componentWillUpdate === 'function') {
    foundWillUpdateName = 'UNSAFE_componentWillUpdate';
  }
  if (
    foundWillMountName !== null ||
    foundWillReceivePropsName !== null ||
    foundWillUpdateName !== null
  ) {
    var componentName = Component.displayName || Component.name;
    var newApiName =
      typeof Component.getDerivedStateFromProps === 'function'
        ? 'getDerivedStateFromProps()'
        : 'getSnapshotBeforeUpdate()';

    throw Error(
      'Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n' +
        componentName +
        ' uses ' +
        newApiName +
        ' but also contains the following legacy lifecycles:' +
        (foundWillMountName !== null ? '\n  ' + foundWillMountName : '') +
        (foundWillReceivePropsName !== null
          ? '\n  ' + foundWillReceivePropsName
          : '') +
        (foundWillUpdateName !== null ? '\n  ' + foundWillUpdateName : '') +
        '\n\nThe above lifecycles should be removed. Learn more about this warning here:\n' +
        'https://fb.me/react-async-component-lifecycle-hooks'
    );
  }

  // React <= 16.2 does not support static getDerivedStateFromProps.
  // As a workaround, use cWM and cWRP to invoke the new static lifecycle.
  // Newer versions of React will ignore these lifecycles if gDSFP exists.
  if (typeof Component.getDerivedStateFromProps === 'function') {
    prototype.componentWillMount = componentWillMount;
    prototype.componentWillReceiveProps = componentWillReceiveProps;
  }

  // React <= 16.2 does not support getSnapshotBeforeUpdate.
  // As a workaround, use cWU to invoke the new lifecycle.
  // Newer versions of React will ignore that lifecycle if gSBU exists.
  if (typeof prototype.getSnapshotBeforeUpdate === 'function') {
    if (typeof prototype.componentDidUpdate !== 'function') {
      throw new Error(
        'Cannot polyfill getSnapshotBeforeUpdate() for components that do not define componentDidUpdate() on the prototype'
      );
    }

    prototype.componentWillUpdate = componentWillUpdate;

    var componentDidUpdate = prototype.componentDidUpdate;

    prototype.componentDidUpdate = function componentDidUpdatePolyfill(
      prevProps,
      prevState,
      maybeSnapshot
    ) {
      // 16.3+ will not execute our will-update method;
      // It will pass a snapshot value to did-update though.
      // Older versions will require our polyfilled will-update value.
      // We need to handle both cases, but can't just check for the presence of "maybeSnapshot",
      // Because for <= 15.x versions this might be a "prevContext" object.
      // We also can't just check "__reactInternalSnapshot",
      // Because get-snapshot might return a falsy value.
      // So check for the explicit __reactInternalSnapshotFlag flag to determine behavior.
      var snapshot = this.__reactInternalSnapshotFlag
        ? this.__reactInternalSnapshot
        : maybeSnapshot;

      componentDidUpdate.call(this, prevProps, prevState, snapshot);
    };
  }

  return Component;
}

var classCallCheck = function(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
};

var createClass = (function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

var defineProperty = function(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

var inherits = function(subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError(
      'Super expression must either be null or a function, not ' +
        typeof superClass
    );
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });
  if (superClass)
    Object.setPrototypeOf
      ? Object.setPrototypeOf(subClass, superClass)
      : (subClass.__proto__ = superClass);
};

var possibleConstructorReturn = function(self, call) {
  if (!self) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }

  return call && (typeof call === 'object' || typeof call === 'function')
    ? call
    : self;
};

var DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.2 (KHTML, like Gecko) Safari/537.2';
var USER_AGENT =
  typeof navigator !== 'undefined' ? navigator.userAgent : DEFAULT_USER_AGENT;

var Pane = (function(_React$PureComponent) {
  inherits(Pane, _React$PureComponent);

  function Pane() {
    classCallCheck(this, Pane);
    return possibleConstructorReturn(
      this,
      (Pane.__proto__ || Object.getPrototypeOf(Pane)).apply(this, arguments)
    );
  }

  createClass(Pane, [
    {
      key: 'render',
      value: function render() {
        var _props = this.props,
          children = _props.children,
          className = _props.className,
          prefixer = _props.prefixer,
          split = _props.split,
          styleProps = _props.style,
          size = _props.size,
          eleRef = _props.eleRef;

        var classes = ['Pane', split, className];

        var style = Object.assign({}, styleProps || {}, {
          flex: 1,
          position: 'relative',
          outline: 'none',
        });

        if (size !== undefined) {
          if (split === 'vertical') {
            style.width = size;
          } else {
            style.height = size;
            style.display = 'flex';
          }
          style.flex = 'none';
        }

        return React.createElement(
          'div',
          {
            ref: eleRef,
            className: classes.join(' '),
            style: prefixer.prefix(style),
          },
          children
        );
      },
    },
  ]);
  return Pane;
})(React.PureComponent);

Pane.propTypes = {
  className: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  prefixer: PropTypes.instanceOf(Prefixer).isRequired,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  split: PropTypes.oneOf(['vertical', 'horizontal']),
  style: stylePropType,
  eleRef: PropTypes.func,
};

Pane.defaultProps = {
  prefixer: new Prefixer({ userAgent: USER_AGENT }),
};

var DEFAULT_USER_AGENT$1 =
  'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.2 (KHTML, like Gecko) Safari/537.2';
var USER_AGENT$1 =
  typeof navigator !== 'undefined' ? navigator.userAgent : DEFAULT_USER_AGENT$1;
var RESIZER_DEFAULT_CLASSNAME = 'Resizer';

var Resizer = (function(_React$Component) {
  inherits(Resizer, _React$Component);

  function Resizer() {
    classCallCheck(this, Resizer);
    return possibleConstructorReturn(
      this,
      (Resizer.__proto__ || Object.getPrototypeOf(Resizer)).apply(
        this,
        arguments
      )
    );
  }

  createClass(Resizer, [
    {
      key: 'render',
      value: function render() {
        var _props = this.props,
          className = _props.className,
          _onClick = _props.onClick,
          _onDoubleClick = _props.onDoubleClick,
          _onMouseDown = _props.onMouseDown,
          _onTouchEnd = _props.onTouchEnd,
          _onTouchStart = _props.onTouchStart,
          prefixer = _props.prefixer,
          resizerClassName = _props.resizerClassName,
          split = _props.split,
          style = _props.style;

        var classes = [resizerClassName, split, className];

        return React.createElement('span', {
          className: classes.join(' '),
          style: prefixer.prefix(style) || {},
          onMouseDown: function onMouseDown(event) {
            return _onMouseDown(event);
          },
          onTouchStart: function onTouchStart(event) {
            event.preventDefault();
            _onTouchStart(event);
          },
          onTouchEnd: function onTouchEnd(event) {
            event.preventDefault();
            _onTouchEnd(event);
          },
          onClick: function onClick(event) {
            if (_onClick) {
              event.preventDefault();
              _onClick(event);
            }
          },
          onDoubleClick: function onDoubleClick(event) {
            if (_onDoubleClick) {
              event.preventDefault();
              _onDoubleClick(event);
            }
          },
        });
      },
    },
  ]);
  return Resizer;
})(React.Component);

Resizer.propTypes = {
  className: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onMouseDown: PropTypes.func.isRequired,
  onTouchStart: PropTypes.func.isRequired,
  onTouchEnd: PropTypes.func.isRequired,
  prefixer: PropTypes.instanceOf(Prefixer).isRequired,
  split: PropTypes.oneOf(['vertical', 'horizontal']),
  style: stylePropType,
  resizerClassName: PropTypes.string.isRequired,
};

Resizer.defaultProps = {
  prefixer: new Prefixer({ userAgent: USER_AGENT$1 }),
  resizerClassName: RESIZER_DEFAULT_CLASSNAME,
};

var DEFAULT_USER_AGENT$2 =
  'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.2 (KHTML, like Gecko) Safari/537.2';
var USER_AGENT$2 =
  typeof navigator !== 'undefined' ? navigator.userAgent : DEFAULT_USER_AGENT$2;

function unFocus(document, window) {
  if (document.selection) {
    document.selection.empty();
  } else {
    try {
      window.getSelection().removeAllRanges();
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

function getDefaultSize(defaultSize, minSize, maxSize, draggedSize) {
  if (typeof draggedSize === 'number') {
    var min = typeof minSize === 'number' ? minSize : 0;
    var max = typeof maxSize === 'number' && maxSize >= 0 ? maxSize : Infinity;
    return Math.max(min, Math.min(max, draggedSize));
  }
  if (defaultSize !== undefined) {
    return defaultSize;
  }
  return minSize;
}

function removeNullChildren(children) {
  return React.Children.toArray(children).filter(function(c) {
    return c;
  });
}

var SplitPane = (function(_React$Component) {
  inherits(SplitPane, _React$Component);

  function SplitPane(props) {
    classCallCheck(this, SplitPane);

    var _this = possibleConstructorReturn(
      this,
      (SplitPane.__proto__ || Object.getPrototypeOf(SplitPane)).call(
        this,
        props
      )
    );

    _this.onMouseDown = _this.onMouseDown.bind(_this);
    _this.onTouchStart = _this.onTouchStart.bind(_this);
    _this.onMouseMove = _this.onMouseMove.bind(_this);
    _this.onTouchMove = _this.onTouchMove.bind(_this);
    _this.onMouseUp = _this.onMouseUp.bind(_this);

    // order of setting panel sizes.
    // 1. size
    // 2. getDefaultSize(defaultSize, minsize, maxSize)

    var size = props.size,
      defaultSize = props.defaultSize,
      minSize = props.minSize,
      maxSize = props.maxSize,
      primary = props.primary;

    var initialSize =
      size !== undefined
        ? size
        : getDefaultSize(defaultSize, minSize, maxSize, null);

    _this.state = {
      active: false,
      resized: false,
      pane1Size: primary === 'first' ? initialSize : undefined,
      pane2Size: primary === 'second' ? initialSize : undefined,

      // these are props that are needed in static functions. ie: gDSFP
      instanceProps: {
        size: size,
      },
    };
    return _this;
  }

  createClass(
    SplitPane,
    [
      {
        key: 'componentDidMount',
        value: function componentDidMount() {
          document.addEventListener('mouseup', this.onMouseUp);
          document.addEventListener('mousemove', this.onMouseMove);
          document.addEventListener('touchmove', this.onTouchMove);
          this.setState(SplitPane.getSizeUpdate(this.props, this.state));
        },
      },
      {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          document.removeEventListener('mouseup', this.onMouseUp);
          document.removeEventListener('mousemove', this.onMouseMove);
          document.removeEventListener('touchmove', this.onTouchMove);
        },
      },
      {
        key: 'onMouseDown',
        value: function onMouseDown(event) {
          var eventWithTouches = Object.assign({}, event, {
            touches: [{ clientX: event.clientX, clientY: event.clientY }],
          });
          this.onTouchStart(eventWithTouches);
        },
      },
      {
        key: 'onTouchStart',
        value: function onTouchStart(event) {
          var _props = this.props,
            allowResize = _props.allowResize,
            onDragStarted = _props.onDragStarted,
            split = _props.split;

          if (allowResize) {
            unFocus(document, window);
            var position =
              split === 'vertical'
                ? event.touches[0].clientX
                : event.touches[0].clientY;

            if (typeof onDragStarted === 'function') {
              onDragStarted();
            }
            this.setState({
              active: true,
              position: position,
            });
          }
        },
      },
      {
        key: 'onMouseMove',
        value: function onMouseMove(event) {
          var eventWithTouches = Object.assign({}, event, {
            touches: [{ clientX: event.clientX, clientY: event.clientY }],
          });
          this.onTouchMove(eventWithTouches);
        },
      },
      {
        key: 'onTouchMove',
        value: function onTouchMove(event) {
          var _props2 = this.props,
            allowResize = _props2.allowResize,
            maxSize = _props2.maxSize,
            minSize = _props2.minSize,
            onChange = _props2.onChange,
            split = _props2.split,
            step = _props2.step;
          var _state = this.state,
            active = _state.active,
            position = _state.position;

          if (allowResize && active) {
            unFocus(document, window);
            var isPrimaryFirst = this.props.primary === 'first';
            var ref = isPrimaryFirst ? this.pane1 : this.pane2;
            var ref2 = isPrimaryFirst ? this.pane2 : this.pane1;
            if (ref) {
              var node = ref;
              var node2 = ref2;

              if (node.getBoundingClientRect) {
                var width = node.getBoundingClientRect().width;
                var height = node.getBoundingClientRect().height;
                var current =
                  split === 'vertical'
                    ? event.touches[0].clientX
                    : event.touches[0].clientY;
                var size = split === 'vertical' ? width : height;
                var positionDelta = position - current;
                if (step) {
                  if (Math.abs(positionDelta) < step) {
                    return;
                  }
                  // Integer division
                  // eslint-disable-next-line no-bitwise
                  positionDelta = ~~(positionDelta / step) * step;
                }
                var sizeDelta = isPrimaryFirst ? positionDelta : -positionDelta;

                var pane1Order = parseInt(window.getComputedStyle(node).order);
                var pane2Order = parseInt(window.getComputedStyle(node2).order);
                if (pane1Order > pane2Order) {
                  sizeDelta = -sizeDelta;
                }

                var newMaxSize = maxSize;
                if (maxSize !== undefined && maxSize <= 0) {
                  var splitPane = this.splitPane;
                  if (split === 'vertical') {
                    newMaxSize =
                      splitPane.getBoundingClientRect().width + maxSize;
                  } else {
                    newMaxSize =
                      splitPane.getBoundingClientRect().height + maxSize;
                  }
                }

                var newSize = size - sizeDelta;
                var newPosition = position - positionDelta;

                if (newSize < minSize) {
                  newSize = minSize;
                } else if (maxSize !== undefined && newSize > newMaxSize) {
                  newSize = newMaxSize;
                } else {
                  this.setState({
                    position: newPosition,
                    resized: true,
                  });
                }

                if (onChange) onChange(newSize);

                this.setState(
                  defineProperty(
                    {
                      draggedSize: newSize,
                    },
                    isPrimaryFirst ? 'pane1Size' : 'pane2Size',
                    newSize
                  )
                );
              }
            }
          }
        },
      },
      {
        key: 'onMouseUp',
        value: function onMouseUp() {
          var _props3 = this.props,
            allowResize = _props3.allowResize,
            onDragFinished = _props3.onDragFinished;
          var _state2 = this.state,
            active = _state2.active,
            draggedSize = _state2.draggedSize;

          if (allowResize && active) {
            if (typeof onDragFinished === 'function') {
              onDragFinished(draggedSize);
            }
            this.setState({ active: false });
          }
        },

        // we have to check values since gDSFP is called on every render and more in StrictMode
      },
      {
        key: 'render',
        value: function render() {
          var _this2 = this;

          var _props4 = this.props,
            allowResize = _props4.allowResize,
            children = _props4.children,
            className = _props4.className,
            onResizerClick = _props4.onResizerClick,
            onResizerDoubleClick = _props4.onResizerDoubleClick,
            paneClassName = _props4.paneClassName,
            pane1ClassName = _props4.pane1ClassName,
            pane2ClassName = _props4.pane2ClassName,
            paneStyle = _props4.paneStyle,
            pane1StyleProps = _props4.pane1Style,
            pane2StyleProps = _props4.pane2Style,
            prefixer = _props4.prefixer,
            resizerClassName = _props4.resizerClassName,
            resizerStyle = _props4.resizerStyle,
            split = _props4.split,
            styleProps = _props4.style;
          var _state3 = this.state,
            pane1Size = _state3.pane1Size,
            pane2Size = _state3.pane2Size;

          var disabledClass = allowResize ? '' : 'disabled';
          var resizerClassNamesIncludingDefault = resizerClassName
            ? resizerClassName + ' ' + RESIZER_DEFAULT_CLASSNAME
            : resizerClassName;

          var notNullChildren = removeNullChildren(children);

          var style = Object.assign(
            {},
            {
              display: 'flex',
              flex: 1,
              height: '100%',
              position: 'absolute',
              outline: 'none',
              overflow: 'hidden',
              MozUserSelect: 'text',
              WebkitUserSelect: 'text',
              msUserSelect: 'text',
              userSelect: 'text',
            },
            styleProps || {}
          );

          if (split === 'vertical') {
            Object.assign(style, {
              flexDirection: 'row',
              left: 0,
              right: 0,
            });
          } else {
            Object.assign(style, {
              bottom: 0,
              flexDirection: 'column',
              minHeight: '100%',
              top: 0,
              width: '100%',
            });
          }

          var classes = ['SplitPane', className, split, disabledClass];
          var pane1Style = prefixer.prefix(
            Object.assign({}, paneStyle || {}, pane1StyleProps || {})
          );
          var pane2Style = prefixer.prefix(
            Object.assign({}, paneStyle || {}, pane2StyleProps || {})
          );

          var pane1Classes = ['Pane1', paneClassName, pane1ClassName].join(' ');
          var pane2Classes = ['Pane2', paneClassName, pane2ClassName].join(' ');

          return React.createElement(
            'div',
            {
              className: classes.join(' '),
              ref: function ref(node) {
                _this2.splitPane = node;
              },
              style: prefixer.prefix(style),
            },
            React.createElement(
              Pane,
              {
                className: pane1Classes,
                key: 'pane1',
                eleRef: function eleRef(node) {
                  _this2.pane1 = node;
                },
                size: pane1Size,
                split: split,
                style: pane1Style,
              },
              notNullChildren[0]
            ),
            React.createElement(Resizer, {
              className: disabledClass,
              onClick: onResizerClick,
              onDoubleClick: onResizerDoubleClick,
              onMouseDown: this.onMouseDown,
              onTouchStart: this.onTouchStart,
              onTouchEnd: this.onMouseUp,
              key: 'resizer',
              resizerClassName: resizerClassNamesIncludingDefault,
              split: split,
              style: resizerStyle || {},
            }),
            React.createElement(
              Pane,
              {
                className: pane2Classes,
                key: 'pane2',
                eleRef: function eleRef(node) {
                  _this2.pane2 = node;
                },
                size: pane2Size,
                split: split,
                style: pane2Style,
              },
              notNullChildren[1]
            )
          );
        },
      },
    ],
    [
      {
        key: 'getDerivedStateFromProps',
        value: function getDerivedStateFromProps(nextProps, prevState) {
          return SplitPane.getSizeUpdate(nextProps, prevState);
        },
      },
      {
        key: 'getSizeUpdate',
        value: function getSizeUpdate(props, state) {
          var newState = {};
          var instanceProps = state.instanceProps;

          if (instanceProps.size === props.size && props.size !== undefined) {
            return {};
          }

          var newSize =
            props.size !== undefined
              ? props.size
              : getDefaultSize(
                  props.defaultSize,
                  props.minSize,
                  props.maxSize,
                  state.draggedSize
                );

          if (props.size !== undefined) {
            newState.draggedSize = newSize;
          }

          var isPanel1Primary = props.primary === 'first';

          newState[isPanel1Primary ? 'pane1Size' : 'pane2Size'] = newSize;
          newState[isPanel1Primary ? 'pane2Size' : 'pane1Size'] = undefined;

          newState.instanceProps = { size: props.size };

          return newState;
        },
      },
    ]
  );
  return SplitPane;
})(React.Component);

SplitPane.propTypes = {
  allowResize: PropTypes.bool,
  children: PropTypes.arrayOf(PropTypes.node).isRequired,
  className: PropTypes.string,
  primary: PropTypes.oneOf(['first', 'second']),
  minSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  maxSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  // eslint-disable-next-line react/no-unused-prop-types
  defaultSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  split: PropTypes.oneOf(['vertical', 'horizontal']),
  onDragStarted: PropTypes.func,
  onDragFinished: PropTypes.func,
  onChange: PropTypes.func,
  onResizerClick: PropTypes.func,
  onResizerDoubleClick: PropTypes.func,
  prefixer: PropTypes.instanceOf(Prefixer).isRequired,
  style: stylePropType,
  resizerStyle: stylePropType,
  paneClassName: PropTypes.string,
  pane1ClassName: PropTypes.string,
  pane2ClassName: PropTypes.string,
  paneStyle: stylePropType,
  pane1Style: stylePropType,
  pane2Style: stylePropType,
  resizerClassName: PropTypes.string,
  step: PropTypes.number,
};

SplitPane.defaultProps = {
  allowResize: true,
  minSize: 50,
  prefixer: new Prefixer({ userAgent: USER_AGENT$2 }),
  primary: 'first',
  split: 'vertical',
  paneClassName: '',
  pane1ClassName: '',
  pane2ClassName: '',
};

polyfill(SplitPane);

module.exports = SplitPane;
