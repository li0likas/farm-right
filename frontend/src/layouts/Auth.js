import { Outlet, Link } from "react-router-dom";
import { useState } from 'react'
import { AlertTypes } from "../styles/modules/AlertStyles";
import Alert from "../components/Alert";
import wallpaper from '../images/wallpaper.png';

export default () => {
  const [alert, setAlert] = useState({
    text: '',
    type: AlertTypes.info,
  })

  return (
    <div className="flex min-h-dvh p-5" style={{
      //background: "url(https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXZ4eGEzd2p1Ym9heGEzNmx6ZzI0YmRiaTh6cW10cDdxcnU1eWVmbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/k6GLEHT4J90rD68EoD/giphy.gif)",
      background: `url(${wallpaper})`,
      backgroundSize: "cover",
    }}>

      <div className="m-auto sm:w-[26rem]">

        <Alert text={alert.text} type={alert.type} setAlert={setAlert} />

        <div className="mx-auto p-10 bg-white rounded] rounded-lg">
            <Outlet context={{ setAlert }} />
            <Link to="/" className="block text-center mt-3 text-blue-500 hover:text-blue-700">Back to home</Link>
        </div>
      </div>

    </div>
  );
}