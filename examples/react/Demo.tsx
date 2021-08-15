import React, { useState, useRef, useEffect } from 'react'; 
import Ellipsis from '../../src';  

const Demo = () => {

    const [content] = useState(
        `测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试`
    ); 

    return (
        <div> 
            <Ellipsis expandable>
                 {content} 
            </Ellipsis>
        </div>
    )
}

export default Demo;