import React from 'react';
import classnames from '@parrotjs/classnames';

const Indicator = React.forwardRef((props, ref) => {
    const { prefixCls: customizedPrefixCls = 'parrot', componentName = 'indicator', className, active = false } = props;
    const prefixCls = customizedPrefixCls + '-' + componentName;
    return (React.createElement("button", { ref: ref, className: classnames(prefixCls, className, {
            [`${prefixCls}-active`]: active
        }) }));
});
var Indicator$1 = React.memo(Indicator);

export default Indicator$1;
