import axios from 'axios';
import { motion } from "framer-motion";
import {
  Lock,
  LogIn,
  Mail,
  ShoppingCart,
  UserCircle,
  UserPlus,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import { useStore } from "../store/useStore";

const images = [
  "/uploads/login.jpg",
 
];

// 3D objects for the background
const groceryItems = [
  { id: 1, name: "apple", color: "#ff6b6b", delay: 0 },
  { id: 2, name: "carrot", color: "#ff9f43", delay: 1 },
  { id: 3, name: "milk", color: "#54a0ff", delay: 2 },
  { id: 4, name: "bread", color: "#feca57", delay: 3 },
  { id: 5, name: "broccoli", color: "#10ac84", delay: 4 },
];

const GroceryItem = ({ color, delay, name }) => {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 0.8 }}
      transition={{
        duration: 2,
        delay: delay * 0.3,
        repeat: Infinity,
        repeatType: "reverse",
        repeatDelay: Math.random() * 2,
      }}
      className="absolute"
      style={{
        left: `${Math.random() * 80 + 10}%`,
        top: `${Math.random() * 80}%`,
      }}
    >
      <div
        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <span className="text-white text-xs font-bold">
          {name[0].toUpperCase()}
        </span>
      </div>
    </motion.div>
  );
};

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const login = useStore((state) => state.login);


  const navigate = useNavigate()
  useEffect(() => {
    const fetchData = async () => {

      const user = sessionStorage.getItem("user") || ''
      
      if (user) {
        try {
          let u = JSON.parse(user)
      let email = u.email
          // Send the email as part of the body of the POST request
          const response = await axios.post('http://localhost:5000/api/user', {
            email
          });
          console.log(response)
          console.log(response.data.token, u.token)
          const dbToken = response.data.token.split('.');
          const localToken = u.token.split('.');

          // Get the first part (header part of the JWT)
        
          if (dbToken[0] == localToken[0]) {
            navigate('/dashboard')
          }
        } catch (error) {
          console.error('Error checking email:', error);
        }

      }
    };

    fetchData();
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp && !name) {
      toast.error("Please enter your name");
      setIsLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(async () => {
      if (isSignUp === true) {
        console.log(name,email,password,role)
        try {
          const response = await axios.post('http://localhost:5000/api/signup', {
            name,
            email,
            password,
            role,
          });
          toast.success('Account created successfully!');
          sessionStorage.setItem('user', JSON.stringify({
            email: email,
            token: response.data.token,
            role:role
          }));
          login(email, password, name);
          navigate('/dashboard');
          // setIsSignUp(false); // Switch to login form
        } catch (error) {
          toast.error('Error signing up');
          console.error(error);
        }
      } else {
        try {
          const response = await axios.post('http://localhost:5000/api/login', {
            email,
            password
          });
          console.log(response)
          // console.log(JSON.stringify(response.config.data))
          toast.success('Logged in successfully!');

          // Store token in sessionStorage
          // sessionStorage.setItem('token', response.data.token);
          sessionStorage.setItem('user', JSON.stringify({
            email: email,
            token: response.data.token,
            role:response.data.role
          }));
          // login(email, password);
          navigate('/dashboard');

        } catch (error) {
          toast.error('Error logging in');

          console.error(error);
        }
      }
      console.log(name, email, password)
      login(email, password, name);
      toast.success(
        isSignUp ? "Account created successfully!" : "Welcome back!"
      );
      setIsLoading(false);
    }, 1500);
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    fade: true,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-orange-400 to-yellow-300 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background grocery items */}
      {groceryItems.map((item) => (
        <GroceryItem
          key={item.id}
          color={item.color}
          delay={item.delay}
          name={item.name}
        />
      ))}

      {/* Supermarket theme background overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/supermarket-bg.jpg')" }}
      ></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl flex w-full max-w-5xl overflow-hidden relative z-10"
      >
        {/* Left Side - Images + Group Name */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/2 p-6 bg-gradient-to-br from-green-50 to-blue-50">
          <motion.div
            initial={{ rotateY: -15 }}
            animate={{ rotateY: 15 }}
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="w-64 h-64 rounded-full border-4 border-green-300 shadow-lg overflow-hidden"
            style={{ perspective: 1000 }}
          >
            <Slider {...settings}>
              {images.map((image, index) => (
                <div key={index} className="h-full">
                  <div className="w-full h-64 rounded-full overflow-hidden">
                    <img
                      src={image}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </Slider>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 text-center"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <motion.h2
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-2xl font-bold text-green-600 mb-2"
              >
                FreshMart
              </motion.h2>

              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-lg font-semibold text-gray-700"
              >
                Supermarket Automation Software
              </motion.p>

              <motion.p
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="text-sm text-gray-500 mt-2"
              >
                Your one-stop grocery solution
              </motion.p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            className="mt-8"
          >
            <div className="flex items-center gap-2 bg-green-100 p-3 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-green-500" />
              <span className="text-green-700 font-medium">
                Shop smarter, not harder
              </span>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col items-center bg-white">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center mb-6"
          >
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4"
            >
              <ShoppingCart className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {isSignUp ? "Join FreshMart" : "Welcome Back"}
            </h1>
            <p className="text-gray-600">
              {isSignUp
                ? "Sign up to start your grocery journey"
                : "Sign in to your account"}
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-6 w-full"
          >
            {isSignUp && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
                <UserCircle className="w-5 h-5 text-gray-400 absolute left-3 top-[34px]" />
              </motion.div>
            )}

            <motion.div
              initial={{ x: isSignUp ? -20 : 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: isSignUp ? 0.5 : 0.4 }}
              className="relative"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-[34px]" />
            </motion.div>

            <motion.div
              initial={{ x: isSignUp ? -20 : 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: isSignUp ? 0.6 : 0.5 }}
              className="relative"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-[34px]" />
            </motion.div>
            {isSignUp && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Role
                </label>
               
                <select name="" id="" value={role}
                  onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                  <option value="">Select Role</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                  <option value="saleclock">Sale Clock</option>
                </select>
                <UserCircle className="w-5 h-5 text-gray-400 absolute left-3 top-[34px]" />
              </motion.div>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg hover:opacity-90 transform transition-all flex items-center justify-center gap-2 relative overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span className="ml-2">Processing...</span>
                </div>
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-5 h-5" /> Create Account
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" /> Sign In
                </>
              )}
            </motion.button>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center mt-4"
            >
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-green-500 hover:text-green-600 text-sm"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </motion.div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
};
