import React, { useState, useRef, useEffect } from 'react';
 

const Demo = () => {

    const [count,setCount]=useState(0);

    const handleClick=()=>{ 
        setCount(count+1)
    } 

    const handleChange=()=>{
        console.log("count",count)
    }

    console.log("render count",count)

    return (
        <div>
            <Test onChange={handleChange}>
                <button onClick={handleClick}>点击</button>
            </Test>
        </div>
    )
}


const Test=(props)=>{

    useEffect(() => {
        props.onChange();
    }, [props.children,props.onChange])

    return props.children
}
export default Demo;