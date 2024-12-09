import { useOutletContext, Navigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { AlertTypes } from "../styles/modules/AlertStyles";
import axios from 'axios';
import NavBar from "../components/NavBar";
import { Link } from "react-router-dom";
import { isLoggedIn } from "../classes/Auth";

export default () => {
  const { setAlert } = useOutletContext();

  const [fieldName, setFieldName] = useState('');
  const [fieldCropOptions, setFieldCropOptions] = useState([]);
  const [fieldArea, setFieldArea] = useState('');
  const [fieldPerimeter, setFieldPerimeter] = useState('');
  const [fieldCrop, setFieldCrop] = useState('');

  useEffect(() => {

    // Fetch crop options from the server
    axios.get(`${process.env.REACT_APP_API_BASE_URL}/field-crop-options`)
      .then(response => {
        setFieldCropOptions(response.data);
      })
      .catch(error => {
        console.error('Error fetching crop options:', error);
      });
  }, []);

  const validate = () => {
    if (!fieldName || !fieldArea || !fieldPerimeter || !fieldCrop) {
      setAlert({ text: 'There are empty fields', type: AlertTypes.warning });
      return false;
    }
    return true;
  }

  const createField = () => {
    if (!validate()) return;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return;
    }
    const formData = {
      name: fieldName,
      area: parseFloat(fieldArea),
      perimeter: parseFloat(fieldPerimeter),
      cropId: parseInt(fieldCrop),
    };

    axios.post(`${process.env.REACT_APP_API_BASE_URL}/fields`, formData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log(response);
        setAlert({ text: 'Field created successfully', type: AlertTypes.success });
      })
      .catch(error => {
        console.error(error);
        setAlert({ text: 'Error creating field', type: AlertTypes.error });
      });
  }

  return isLoggedIn() ? (
    <div className="w-full">
      <div className="container sm:flex pt-12">
        <div className="w-3/6 sm:mx-8 mx-auto">
          <h1 className="text-2xl text-center font-medium">Create a Field</h1>
          <hr className="my-6" />

          <div className="mb-3">
            <div className="text-base mb-2">Field Name</div>
            <input value={fieldName} onChange={(e) => setFieldName(e.target.value)} type="text" placeholder="Field name" className="w-full p-3 border-[1px] border-gray-400 rounded-lg hover:border-[#61E9B1]" />
          </div>

          <div className="mb-3">
            <div className="text-base mb-2">Area</div>
            <input value={fieldArea} onChange={(e) => setFieldArea(e.target.value)} type="text" placeholder="Area" className="w-full p-3 border-[1px] border-gray-400 rounded-lg hover:border-[#61E9B1]" />
          </div>

          <div className="mb-3">
            <div className="text-base mb-2">Perimeter</div>
            <input value={fieldPerimeter} onChange={(e) => setFieldPerimeter(e.target.value)} type="text" placeholder="Perimeter" className="w-full p-3 border-[1px] border-gray-400 rounded-lg hover:border-[#61E9B1]" />
          </div>

          <div className="mb-3">
            <div className="text-base mb-2">Crop</div>
            <select value={fieldCrop} onChange={(e) => setFieldCrop(e.target.value)} className="w-full p-3 border-[1px] border-gray-400 rounded-lg bg-white hover:border-[#61E9B1]">
              <option value="">Select crop</option>
              {fieldCropOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name.charAt(0).toUpperCase() + option.name.slice(1)}</option>
              ))}
            </select>
          </div>

          <hr className="my-9 mt-12" />

          <button onClick={createField} className="w-full mb-3 p-3 bg-[#388E3C] border-[1px] border-[#61E9B1] rounded-lg hover:bg-[#4edba1]">
            <i className="fa-solid fa-seedling"></i> Create Field
          </button>
          <Link to="/fields" className="w-full mb-3 p-3 bg-gray-300 border-[1px] border-gray-300 rounded-lg hover:bg-gray-400 text-center block">
            <i className="fa-solid fa-arrow-left"></i> Back to Fields
          </Link>
        </div>
        <div className="w-3/6 sm:mx-8 mx-auto">
          <h2 className="pb-3 pt-1 font-semibold text-xl">Why are fields important?</h2>
          <p>Fields represent specific areas of land for tracking activities and managing tasks, providing an organized way to maintain agricultural data.</p>
          <h2 className="pb-3 pt-6 font-semibold text-xl">Who can create a field?</h2>
          <p>Any registered user involved in agricultural activities can create fields to manage their land and tasks effectively.</p>
        </div>
      </div>
    </div>
  ) : (
    <Navigate to='/login' />
  );
};
