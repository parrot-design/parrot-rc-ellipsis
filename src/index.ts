import React, { ReactElement } from 'react'; 
 
export { default } from './Ellipsis'; 
export { default as Ellipsis2 } from './2';

export interface IEllipsisProps{
    component?:any;
    prefixCls?:string;
    componentName?:string; 
    style?:any;//自定义style
    className?:string;//是否为垂直方向滚动
    children?:any;
    rows?:number;//行数
    expandable?:boolean;//是否可展开
    onEllipsis?:any;//触发省略时的回调
} 
 