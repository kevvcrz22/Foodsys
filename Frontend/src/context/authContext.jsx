import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext()

export const AuthProvider = ({children}) =>{

    const [user, setUser] = useState(null)

    useEffect(() =>{

        const usuario = localStorage.getItem('usuario')

        if(usuario)

            setUser(usuario)


    }, [])

    return(
        <AuthContext.Provider value={{user, setUser}}>
            {children}
        </AuthContext.Provider>
    )
    
}