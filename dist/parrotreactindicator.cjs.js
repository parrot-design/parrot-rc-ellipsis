'use strict';

var React = require('react');
var classnames = require('@parrotjs/classnames');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var classnames__default = /*#__PURE__*/_interopDefaultLegacy(classnames);

const Indicator = React__default['default'].forwardRef((props, ref) => {
    const { prefixCls: customizedPrefixCls = 'parrot', componentName = 'indicator', className, active = false } = props;
    const prefixCls = customizedPrefixCls + '-' + componentName;
    return (React__default['default'].createElement("button", { ref: ref, className: classnames__default['default'](prefixCls, className, {
            [`${prefixCls}-active`]: active
        }) }));
});
var Indicator$1 = React__default['default'].memo(Indicator);

module.exports = Indicator$1;
