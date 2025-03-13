import { useEffect, useState } from "react";

export default function SaveRouteComponent({departure, destination}){
    const onSubmit = async(e)=>{
        e.preventDefautl()
    }
    return (
        <div>
            <form onSubmit = {onSubmit}>
                <label htmlFor="">Route Name: </label>
                <input type="text" required placeholder="Name the route"/>
                <button type="submit">Save Route</button>
            </form>
        </div>
    )
}