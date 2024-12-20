import { Routes, Route } from "react-router-dom";

// Layouts
import MainLayout from "./layouts/Main";
import AuthLayout from "./layouts/Auth";
import EmptyLayout from "./layouts/Empty";

// Views
import Home from './views/Home'
import Dashboard from './views/Dashboard'
import Login from './views/Login'
import Register from './views/Register'
import PasswordRecovery from "./views/PasswordRecovery";
import PasswordChange from "./views/PasswordChange";
import Achievements from "./views/Achievements";
import GroupPage from "./views/Group";
import CreateGroup from "./views/CreateGroup";
import CreateField from "./views/CreateField";
import PageNotFound from "./views/PageNotFound";
import Groups from "./views/Groups";
import Fields from "./views/Fields";
import GroupInvitation from "./views/GroupInvitation";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { logout } from "./classes/Auth";
import CreateEvent from "./views/CreateEvent";
import EditGroup from "./views/EditGroup";
import CreateGoal from "./views/CreateGoal";
import CreateChallenge from "./views/CreateChallenge";
import Settings from "./views/Settings";
import HealthTracking from "./views/HealthTracking";
import ContactUs from "./views/ContactUs";
import FAQ from "./views/FAQ";
import Profile from "./views/Profile";
import Reviews from "./views/Reviews";
import Leaderboard from "./views/Leaderboard";
import AboutUs from "./views/AboutUs";
import Shop from "./views/Shop";
import CreateShopItem from "./views/CreateShopItem";
import EditShopItem from "./views/EditShopItem";
import Tasks from "./views/Tasks";
import ShopItem from "./views/ShopItem";
import AllChats from "./views/AllChats";
import Chat from "./views/Chat";
import CreateMessage from "./views/CreateMessage";
import MobileApp from "./views/MobileApp";

export default function App() {
  const navigate = useNavigate();

  // Handle axios errors
  axios.interceptors.response.use((response) => response, (error) => {
    const status = error.response.status
    // User unauthorized response
    if (status == 401) {
      logout()
      navigate('/login')
    }
    throw error;
  });

  return (
    <Routes>

      <Route path="/" element={<EmptyLayout />}>
        <Route index element={<Home />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/create-group" element={<CreateGroup />} />
        <Route path="/create-field" element={<CreateField />} />
        <Route path="/edit-group/:groupId" element={<EditGroup />} />
        <Route path="/create-event/:groupId" element={<CreateEvent />} />
        <Route path="/create-goal/:groupId" element={<CreateGoal />} />
        <Route path="/create-challenge/:groupId" element={<CreateChallenge />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/fields" element={<Fields />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/health-tracking" element={<HealthTracking />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/mobile-app" element={<MobileApp />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop-item/:itemId" element={<ShopItem />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/create-shop-item" element={<CreateShopItem />} />
        <Route path="/edit-shop-item/:itemId" element={<EditShopItem />} />
        <Route path="/all-chats" element={<AllChats />} />
        <Route path="/chats/:id"  element={<Chat />} />
        <Route path="/create-message" element={<CreateMessage />} />

      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/password-recovery" element={<PasswordRecovery />} />
        <Route path={'/resetPassword/:token'} element={<PasswordChange />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/groups/:token" element={<GroupInvitation />} />
      </Route>

      <Route path="/*" element={<PageNotFound />} />
    </Routes>
  );
}