import * as React from 'react';
import classNames from 'classnames';
import toArray from 'rc-util/lib/Children/toArray';
import copy from 'copy-to-clipboard';
import omit from 'rc-util/lib/omit';
import EditOutlined from '@ant-design/icons/EditOutlined';
import CheckOutlined from '@ant-design/icons/CheckOutlined';
import CopyOutlined from '@ant-design/icons/CopyOutlined';
import ResizeObserver from 'rc-resize-observer';
import { AutoSizeType } from 'rc-textarea/lib/ResizableTextArea';
import { configConsumerProps, ConfigContext } from '../config-provider';
import LocaleReceiver from '../locale-provider/LocaleReceiver';
import devWarning from '../_util/devWarning';
import TransButton from '../_util/transButton';
import raf from '../_util/raf';
import { isStyleSupport } from '../_util/styleChecker';
import Tooltip from '../tooltip';
import Typography, { TypographyProps } from './Typography';
import Editable from './Editable';
import measure from './util'; 

const isLineClampSupport = isStyleSupport('webkitLineClamp');
const isTextOverflowSupport = isStyleSupport('textOverflow');

 
 
 
function wrapperDecorations(
  { mark, code, underline, delete: del, strong, keyboard, italic },
  content,
) {
  let currentContent = content;

  function wrap(needed: boolean | undefined, tag: string) {
    if (!needed) return;

    currentContent = React.createElement(tag, {}, currentContent);
  }

  wrap(strong, 'strong');
  wrap(underline, 'u');
  wrap(del, 'del');
  wrap(code, 'code');
  wrap(mark, 'mark');
  wrap(keyboard, 'kbd');
  wrap(italic, 'i');

  return currentContent;
}

function getNode(dom: React.ReactNode, defaultNode: React.ReactNode, needDom?: boolean) {
  if (dom === true || dom === undefined) {
    return defaultNode;
  }
  return dom || (needDom && defaultNode);
}
 
 
const ELLIPSIS_STR = '...';

class Base extends React.Component {
  static contextType = ConfigContext;

  static defaultProps = {
    children: '',
  };

  static getDerivedStateFromProps(nextProps) {
    const { children, editable } = nextProps;

    devWarning(
      !editable || typeof children === 'string',
      'Typography',
      'When `editable` is enabled, the `children` should use string.',
    );

    return {};
  }

  context;

  editIcon?: HTMLDivElement;

  contentRef = React.createRef<HTMLElement>();

  copyId?: number;

  rafId?: number;

  // Locale
  expandStr?: string;

  copyStr?: string;

  copiedStr?: string;

  editStr?: string;

  state = {
    edit: false,
    copied: false,
    ellipsisText: '',
    ellipsisContent: null,
    isEllipsis: false,
    expanded: false, 
  };

  componentDidMount() { 
    this.resizeOnNextFrame();
  }

  componentDidUpdate(prevProps) {
    const { children } = this.props;
    const ellipsis = this.getEllipsis();
    const prevEllipsis = this.getEllipsis(prevProps);
    if (children !== prevProps.children || ellipsis.rows !== prevEllipsis.rows) {
      this.resizeOnNextFrame();
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.copyId);
    raf.cancel(this.rafId);
  }
 
  // =============== Expand ===============
  onExpandClick: React.MouseEventHandler<HTMLElement> = e => {
    const { onExpand } = this.getEllipsis();
    this.setState({ expanded: true });
    (onExpand as React.MouseEventHandler<HTMLElement>)?.(e);
  };
 

 
   

  setEditRef = (node: HTMLDivElement) => {
    this.editIcon = node;
  };

  triggerEdit = (edit: boolean) => {
    const { onStart } = this.getEditable();
    if (edit && onStart) {
      onStart();
    }

    this.setState({ edit }, () => {
      if (!edit && this.editIcon) {
        this.editIcon.focus();
      }
    });
  };

  // ============== Ellipsis ==============
  resizeOnNextFrame = () => {
    raf.cancel(this.rafId);
    this.rafId = raf(() => {
      // Do not bind `syncEllipsis`. It need for test usage on prototype
      this.syncEllipsis();
    });
  };

  canUseCSSEllipsis() { 
    const { rows, expandable, suffix, onEllipsis, tooltip } = this.getEllipsis();

 
    if (rows === 1) {
      return isTextOverflowSupport;
    }

    return isLineClampSupport;
  }

  syncEllipsis() {
    const { ellipsisText, isEllipsis, expanded } = this.state;
    const { rows, onEllipsis } = this.getEllipsis();
    const { children } = this.props;
    if (!rows || rows < 0 || !this.contentRef.current || expanded) return;

    // Do not measure if css already support ellipsis
    if (this.canUseCSSEllipsis()) return;
 
    const { content, text, ellipsis } = measure(
      this.contentRef.current,
      rows,
      children,
      this.renderOperations(true),
      ELLIPSIS_STR,
    );
    if (ellipsisText !== text || isEllipsis !== ellipsis) {
      this.setState({ ellipsisText: text, ellipsisContent: content, isEllipsis: ellipsis });
      if (isEllipsis !== ellipsis && onEllipsis) {
        onEllipsis(ellipsis);
      }
    }
  }

  renderExpand(forceRender?: boolean) {
    const { expandable, symbol } = this.getEllipsis();
    const { expanded, isEllipsis } = this.state;

    if (!expandable) return null;

    // force render expand icon for measure usage or it will cause dead loop
    if (!forceRender && (expanded || !isEllipsis)) return null;

    let expandContent: React.ReactNode;
    if (symbol) {
      expandContent = symbol;
    } else {
      expandContent = this.expandStr;
    }

    return (
      <a
        key="expand"
        className={`${this.getPrefixCls()}-expand`}
        onClick={this.onExpandClick}
        aria-label={this.expandStr}
      >
        {expandContent}
      </a>
    );
  }

  renderOperations(forceRenderExpanded) {
    return [this.renderExpand(forceRenderExpanded)].filter(
      node => node,
    );
  }

  renderContent() {
    const { ellipsisContent, isEllipsis, expanded } = this.state;
    const { component, children, className, type, disabled, style, ...restProps } = this.props;
    const { direction } = this.context;
    const { rows, suffix } = this.getEllipsis(); 

    const textProps = omit(restProps, [
      'prefixCls',
      'editable',
      'copyable',
      'ellipsis',
      'mark',
      'code',
      'delete',
      'underline',
      'strong',
      'keyboard',
      'italic', 
    ]) as any;

    const cssEllipsis = this.canUseCSSEllipsis();
    const cssTextOverflow = rows === 1 && cssEllipsis;
    const cssLineClamp = rows && rows > 1 && cssEllipsis;

    let textNode: React.ReactNode = children;

    // Only use js ellipsis when css ellipsis not support
    if (rows && isEllipsis && !expanded && !cssEllipsis) {
  
      let restContent= '';
      if (typeof children === 'string' || typeof children === 'number'){
        restContent = String(children);
      }

      // show rest content as title on symbol
      restContent = restContent.slice(String(ellipsisContent || '').length);

      // We move full content to outer element to avoid repeat read the content by accessibility
      textNode = (
        <>
          {ellipsisContent}
          <span title={restContent} aria-hidden="true">
            {ELLIPSIS_STR}
          </span>
          {suffix}
        </>
      );
 
    } else {
      textNode = (
        <>
          {children}
          {suffix}
        </>
      );
    }

    textNode = wrapperDecorations(this.props, textNode);

    return (
      <LocaleReceiver componentName="Text">
        {({ edit, copy: copyStr, copied, expand }: Locale) => {
          this.editStr = edit;
          this.copyStr = copyStr;
          this.copiedStr = copied;
          this.expandStr = expand;

          return (
            <ResizeObserver onResize={this.resizeOnNextFrame} disabled={cssEllipsis}>
              <Typography
                className={classNames(
                  {
                    [`${prefixCls}-${type}`]: type,
                    [`${prefixCls}-disabled`]: disabled,
                    [`${prefixCls}-ellipsis`]: rows,
                    [`${prefixCls}-single-line`]: rows === 1,
                    [`${prefixCls}-ellipsis-single-line`]: cssTextOverflow,
                    [`${prefixCls}-ellipsis-multiple-line`]: cssLineClamp,
                  },
                  className,
                )}
                style={{
                  ...style,
                  WebkitLineClamp: cssLineClamp ? rows : undefined,
                }}
                component={component}
                ref={this.contentRef}
                direction={direction}
                {...textProps}
              >
                {textNode}
                {this.renderOperations()}
              </Typography>
            </ResizeObserver>
          );
        }}
      </LocaleReceiver>
    );
  }

  render() {  
    return this.renderContent();
  }
}

export default Base;