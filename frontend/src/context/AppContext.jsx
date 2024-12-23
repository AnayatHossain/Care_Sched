import { createContext, useEffect, useState } from "react";

import axios from 'axios'
import { toast } from "react-toastify";

// create app context
export const AppContext = createContext()

// context provider function
const AppContextProvider = (props) => {


    const currency = '৳';

    const backendUrl = "https://care-sched-backend.onrender.com"
    const [doctors,setDoctors] = useState([])

    const [token,setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):false)
    const [userData,setUserData] = useState(false)

    

    const getDoctorsData = async () =>{

        try {

            const {data} = await axios.get(backendUrl + '/api/doctor/list')

            if (data.success) {
                setDoctors(data.doctors)
            }
            else{
                toast.error(data.message)
            }
             
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }


    const loadUserProfileData = async () => {

        try {

            const {data} = await axios.get(backendUrl+'/api/user/get-profile',{headers:{token}});
            //console.log('Response:', data);

            if(data.success){

                //console.log('UserData:', data.userData);
                setUserData(data.userData)
        
            } 
            else{
                toast.error(data.message)
            }
            
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }


    // variable  in Object  (access any components)
    const value = {
        doctors,getDoctorsData,
        currency,
        token,
        setToken,
        backendUrl,
        userData,setUserData,
        loadUserProfileData
    }

    useEffect(()=>{
        getDoctorsData()
    },[])


    useEffect(()=>{

        if(token){

            loadUserProfileData()
        }
        else{
            setUserData(false)
        }

    },[token])

    return(
        <AppContext.Provider value={value}>
           {props.children} 
        </AppContext.Provider>
    )

}

export default AppContextProvider
