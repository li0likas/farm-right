import { useOutletContext, Link, Navigate } from "react-router-dom";
import { useState } from 'react'
import { AlertTypes } from "../styles/modules/AlertStyles";
import axios from 'axios';
import { isLoggedIn } from "../classes/Auth";

export default () => {
  const { setAlert } = useOutletContext(); // from Auth layout

  // User data inputs
  const [email, setEmail] = useState('')

  const validate = () => {
    if(!email) {
      setAlert({ text: 'Email field is empty', type: AlertTypes.warning })
      return false
    }

    return true
  }

  const passwordRecovery = () => {
    if(!validate()) return

    axios.post('http://localhost:3333/auth/forgotPass', {
      email: email,
    })
      .then(function (response) {
        setAlert({ text: 'Email sent', type: AlertTypes.success })
      })
      .catch(function (error) {
        console.log(error)
        if(error.response.data.message == "Email does not exist"){
          setAlert({ text: 'Email does not exist', type: AlertTypes.error });
        }else{
          setAlert({ text: `An error has occurred (${error.message})`, type: AlertTypes.error })
        }
      }); 
  }

  return !isLoggedIn() ? (
    <div>
      <h1 className="text-2xl text-center font-medium">Password recovery</h1>
      <hr className="my-6" />

      <div className="mb-3">
        <div className="text-base mb-2">Email</div>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="text" placeholder="Email" className="w-full p-3 border-[1px] border-gray-400 rounded-lg" />
      </div>

      <hr className="my-6" />

      <button onClick={passwordRecovery} className="w-full mb-3 p-3 bg-[#61E9B1] border-[1px] border-[#61E9B1] rounded-lg hover:bg-[#4edba1]">
        <i className="fa-solid fa-key"></i> Recover a password
      </button>

      <Link to="/login" className="block w-full mb-3 p-3 bg-white text-center border-[1px] border-gray-400 rounded-lg hover:bg-gray-100">
      <i className="fa-solid fa-user-plus"></i> Log in
      </Link>
    </div>
  ) : (
    <Navigate to='/' />
  );
};
