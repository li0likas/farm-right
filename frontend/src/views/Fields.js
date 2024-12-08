import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { isLoggedIn } from '../classes/Auth';

const Fields = () => {
  const [fields, setFields] = useState([]);
  const [fieldName, setFieldName] = useState('');
  const [filteredFields, setFilteredFields] = useState([]);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (!fieldName) {
      setFilteredFields(fields);
      return;
    }

    const filtered = fields.filter((field) =>
      field.name.toLowerCase().includes(fieldName.toLowerCase())
    );
    setFilteredFields(filtered);
  }, [fieldName, fields]);

  const fetchFields = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      // Not logged in
      return;
    }

    try {
      const response = await axios.get('http://localhost:3333/fields', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setFields(response.data);
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  return isLoggedIn() ? (
    <div>
      {isLoggedIn() && (
        <div className="container bg-white pt-12 pb-8">
          <div className="text-[#388E3C]">
            <h2 className="text-center text-2xl">Fields</h2>
          </div>

          <div className="flex mt-2">
            <div className="mt-8 mb-3 mr-6 text-left ml-6">
              <p className="text-xl flex mx-auto font-semibold">My Fields</p>
            </div>
            <div className="ml-auto mt-4 sm:flex mr-6">
              <Link to="/create-field" className="w-full mb-3 p-3 mt-2 bg-[#388E3C] border-[1px] border-[#61E9B1] rounded-lg hover:bg-[#4edba1] mr-2 whitespace-nowrap">Create Field</Link>
              <input value={fieldName} onChange={(e) => setFieldName(e.target.value)} placeholder="Type field's name" type="text" className="pl-2 rounded-lg bg-gray-50 border border-solid border-[#61E9B1] mr-2 h-12 mt-2" />
              <button className="w-full mb-3 p-3 mt-2 bg-[#388E3C] border-[1px] border-[#61E9B1] rounded-lg hover:bg-[#4edba1]">
                <i className="fa-solid fa-magnifying-glass"></i> Search
              </button>
            </div>
          </div>

          <div className="flex">
            <div className="w-full grid md:grid-cols-4 md:gap-4 sm:grid-cols-2 sm:gap-4 pl-5 pr-5">
              {filteredFields.length === 0 ? (
                <p className='text-black pl-1.5'>No fields found.</p>
              ) : (
                filteredFields.map((field) => (
                  <div key={field.id} className="bg-white rounded-xl mt-3 text-center pt-5 pb-5 bg-gray-50 border border-solid border-[#61E9B1]">
                    <h2 className="font-semibold">{field.name}</h2>
                    <hr className="ml-6 mr-6 mt-4 mb-4" />
                    <p className="text-sm">Area: {field.area} ha</p>
                    <p className="text-sm">Perimeter: {field.perimeter} m</p>
                    <p className="text-sm">Crop: {field.crop ? field.crop.name : 'N/A'}</p>
                    <hr className="ml-6 mr-6 mt-4 mb-6" />
                    <Link to={`/fields/${field.id}`} className="bg-[#388E3C] hover:bg-[#4edba1] rounded-lg text-black p-3 m-2 text-sm border border-solid border-[#61E9B1]">
                      More information
                    </Link>
                    <p className="pb-3"></p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  ) : (
    <Navigate to='/login' />
  )
};

export default Fields;
