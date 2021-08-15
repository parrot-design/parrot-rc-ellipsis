import React, { useMemo, useRef,useState,useCallback } from 'react';
//import ResizeObserver from '@parrotjs/react-resize-observer';
import ResizeObserver from 'rc-resize-observer';
import classnames from '@parrotjs/classnames';
import { isStyleSupport } from '@parrotjs/dom-utils';
import { raf , cancelRaf } from '@parrotjs/utils';
import { IEllipsisProps } from '.';
import measure from './measure';

const isLineClampSupport = isStyleSupport('webkitLineClamp');
const isTextOverflowSupport = isStyleSupport('textOverflow');

const ELLIPSIS_STR='...';

const Ellipsis = (props: IEllipsisProps) => {

    const {
        componentName = 'ellipsis',
        prefixCls: customizedPrefixCls = 'parrot',
        rows = 1,
        className,
        expandable = false,
        style,
        children,
        onEllipsis
    } = props;

    const prefixCls = customizedPrefixCls + '-' + componentName;

    const contentRef=useRef<any>(null);

    const rafId=useRef(0);

    const [expanded, setExpanded] = useState(false);

    const [ellipsis,setEllipsis]=useState({
        text:'',
        isellipsis:false,
        content:null
    }); 

    const canUseCSSEllipsis = useMemo(() => {
        if (expandable) {
            return false;
        }
        if (rows === 1) {
            return isTextOverflowSupport;
        }
        return isLineClampSupport;
    }, [rows, expandable]); 

    const syncEllipsis=useCallback(()=>{ 

        if(!rows || rows<0 || expanded || !contentRef.current || canUseCSSEllipsis) return ;

        const {  
            content,
            text,
            ellipsis:measureEllipsis
        }=measure(
            contentRef.current,
            rows,
            children,
            ELLIPSIS_STR
        ); 

        if(ellipsis.text!==text || ellipsis.isellipsis!==measureEllipsis){ 
            setEllipsis({
                ...ellipsis,
                text,
                content,
                isellipsis:measureEllipsis
            })
            if (ellipsis.isellipsis !== measureEllipsis && onEllipsis) {
                onEllipsis(ellipsis);
            }
        }
 
    },[ellipsis]);

    const resizeOnNextFrame=()=>{   
        console.log("resizeOnNextFrame",ellipsis)
        cancelRaf(rafId.current);
        rafId.current=raf(()=>{
            syncEllipsis();
        });
    }; 

    const textNode = useMemo(() => { 

        let textNode = children;

        if (ellipsis.isellipsis) {

            let restContent = '';

            if (typeof children === 'string' || typeof children === 'number') {
                restContent = String(children);
            }

            textNode=(
                <>
                    {ellipsis.content}
                    <span title={restContent}>
                        {ELLIPSIS_STR}
                    </span>
                </>
            )

        }else{
            textNode=(
                <>
                    {children}
                </>
            )
        }

        return textNode;

    }, [children, ellipsis.isellipsis]);  

    console.log("ellipsis",ellipsis)

    return (
        <ResizeObserver onResize={resizeOnNextFrame} disabled={canUseCSSEllipsis}>
            <div
                style={{
                    ...style
                }}
                className={
                    classnames(
                        prefixCls,
                    )
                }
                ref={contentRef}
            >
                {textNode}
            </div>
        </ResizeObserver>
    );
};

export default React.memo(Ellipsis)
