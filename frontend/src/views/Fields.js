import { Link, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { isLoggedIn } from '../classes/Auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import { centroid } from '@turf/turf';

const Fields = () => {
  const [fields, setFields] = useState([]);
  const [fieldName, setFieldName] = useState('');
  const [filteredFields, setFilteredFields] = useState([]);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.showToast) {
      toast.success(location.state.toastMessage);
    }
  }, [location.state]);

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
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/fields`, {
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
      <ToastContainer />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredFields.map((field) => {
              const fieldCenter = field.boundary ? centroid(field.boundary).geometry.coordinates : [55.1694, 23.8813];
              return (
                <div key={field.id} className="bg-gray-100 p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold">{field.name}</h3>
                  <p>Area: {field.area} hectares</p>
                  <p>Perimeter: {field.perimeter} meters</p>
                  <div className="mt-4">
                    <MapContainer
                      center={[fieldCenter[1], fieldCenter[0]]}
                      zoom={15}
                      style={{ height: "250px", width: "100%" }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        url="https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=8ayfACETeed3UJE2rhiR"
                        attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> contributors'
                      />
                      {field.boundary && (
                        <GeoJSON data={field.boundary} />
                      )}
                    </MapContainer>
                  </div>
                  <p className="pb-4"></p>
                  <Link to={`/fields/${field.id}`} className="bg-[#388E3C] hover:bg-[#4edba1] rounded-lg text-black p-3 m-2 text-sm border border-solid border-[#61E9B1]">
                    More information
                  </Link>
                  <p className="pb-3"></p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  ) : (
    <Navigate to='/login' />
  );
};

export default Fields;