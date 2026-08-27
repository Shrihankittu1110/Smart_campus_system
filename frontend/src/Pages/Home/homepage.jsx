import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from "../../context/AuthContext";
import { canteenAPI } from "../../api/studentApi";
import { buildImgUrl } from "../../utils/imageUrl";
import { 
  MdRestaurantMenu, 
  MdShoppingCart, 
  MdPayment, 
  MdDeliveryDining, 
  MdBarChart, 
  MdStarRate,
  MdArrowForward,
  MdCheckCircle,
  MdLocalOffer
} from 'react-icons/md';
import { FaLeaf, FaUtensils, FaUniversity } from 'react-icons/fa';

const slides = [
  {
    url: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1600&q=80",
    title: "Fresh Meals, Every Day",
    subtitle: "Discover delicious food from verified campus canteens — ordered in minutes.",
  },
  {
    url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80",
    title: "Order. Track. Enjoy.",
    subtitle: "Seamless ordering experience designed for students on the go.",
  },
  {
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80",
    title: "Campus Canteens at Your Fingertips",
    subtitle: "Browse menus, compare prices, and place orders from any device.",
  },
  {
    url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80",
    title: "Quality You Can Trust",
    subtitle: "Only approved, compliant canteens — so you always eat with confidence.",
  },
];

const fallbackCanteens = [
  { name: "Canteen 1", tag: "Campus Meals", img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80", rating: "4.8", meals: "4 meals" },
  { name: "The Green Bowl", tag: "Healthy", img: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&q=80", rating: "4.9", meals: "24 meals" },
  { name: "Bite & Brew", tag: "Cafe", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80", rating: "4.8", meals: "18 meals" },
];

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const dark = theme === 'dark';
  
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [featuredCanteens, setFeaturedCanteens] = useState([]);
  
  // Refs for intersection observer
  const aboutRef = useRef(null);
  const servicesRef = useRef(null);
  const canteensRef = useRef(null);
  const ctaRef = useRef(null);
  
  // State for scroll animations
  const [aboutVisible, setAboutVisible] = useState(false);
  const [servicesVisible, setServicesVisible] = useState(false);
  const [canteensVisible, setCanteensVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  // Auto-slide
  const goTo = useCallback(
    (idx) => {
      setFading(true);
      setTimeout(() => {
        setCurrent(idx);
        setFading(false);
      }, 500);
    },
    []
  );

  useEffect(() => {
    const t = setInterval(() => {
      goTo((current + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [current, goTo]);

  // Scroll shadow on nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    canteenAPI.getAll()
      .then((res) => {
        if (mounted && res.success) setFeaturedCanteens(res.data.slice(0, 3));
      })
      .catch(() => {});

    return () => { mounted = false; };
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === aboutRef.current) {
            setAboutVisible(entry.isIntersecting);
          } else if (entry.target === servicesRef.current) {
            setServicesVisible(entry.isIntersecting);
          } else if (entry.target === canteensRef.current) {
            setCanteensVisible(entry.isIntersecting);
          } else if (entry.target === ctaRef.current) {
            setCtaVisible(entry.isIntersecting);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px" }
    );

    if (aboutRef.current) observer.observe(aboutRef.current);
    if (servicesRef.current) observer.observe(servicesRef.current);
    if (canteensRef.current) observer.observe(canteensRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);

    return () => observer.disconnect();
  }, []);

  const slide = slides[current];
  const browsePath = user?.role === 'student' ? '/student/canteens' : '/canteens';
  const featuredCards = featuredCanteens.length
    ? featuredCanteens.map((c) => {
        const rating = c.averageRating || c.rating || 4.8;
        return {
          name: c.canteenName || c.name || 'Canteen',
          tag: c.location || 'Campus Meals',
          img: buildImgUrl(c.image) || fallbackCanteens[0].img,
          rating: Number(rating).toFixed(1),
          meals: `${c.availableMealCount ?? c.mealCount ?? 0} meals`,
        };
      })
    : fallbackCanteens;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-400 overflow-x-hidden">
      <Header dark={dark} setDark={toggleTheme} scrolled={scrolled} />

      {/* HERO SECTION */}
      <section id="home" className="relative h-screen min-h-[600px] flex items-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 scale-105 animate-ken-burns"
          style={{
            backgroundImage: `url(${slide.url})`,
            opacity: fading ? 0 : 1,
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/80 via-green-950/45 to-transparent">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(74,222,128,0.1),transparent_50%)] animate-pulse-slow"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(74,222,128,0.1),transparent_50%)] animate-pulse-slower"></div>
          </div>
        </div>

        {/* Floating decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <FaUtensils className="absolute top-20 left-[10%] text-white/10 text-6xl animate-float-slow" />
          <FaLeaf className="absolute bottom-20 right-[15%] text-primary-400/20 text-5xl animate-float-delayed" />
          <FaUniversity className="absolute top-40 right-[20%] text-white/10 text-7xl animate-float" />
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => goTo((current - 1 + slides.length) % slides.length)}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 border border-white/25 text-white hover:bg-primary-500 hover:border-primary-400 hover:scale-110 hover:shadow-lg transition-all duration-300 backdrop-blur flex items-center justify-center text-2xl"
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button
          onClick={() => goTo((current + 1) % slides.length)}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 border border-white/25 text-white hover:bg-primary-500 hover:border-primary-400 hover:scale-110 hover:shadow-lg transition-all duration-300 backdrop-blur flex items-center justify-center text-2xl"
          aria-label="Next slide"
        >
          ›
        </button>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary-500/15 backdrop-blur-sm border border-primary-400/30 text-primary-400 px-4 py-2 rounded-full text-sm font-semibold tracking-wide mb-6 animate-fade-down">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              <span>🌿</span> Smart Campus Canteen System
            </div>
            
            {/* Title */}
            <h1 className="font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              {slide.title.split(",").map((part, i) => (
                <span key={i} className="inline-block hover:scale-105 hover:text-primary-300 transition-transform duration-300">
                  {i === 0 ? part : <span className="text-primary-400">{part}</span>}
                  {i < slide.title.split(",").length - 1 ? "," : ""}
                </span>
              ))}
            </h1>
            
            {/* Subtitle */}
            <p className="mt-5 text-white/80 text-base sm:text-lg max-w-xl animate-fade-up animation-delay-200">
              {slide.subtitle}
            </p>
            
            {/* Buttons */}
            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                to={browsePath}
                className="group px-8 py-3.5 bg-gradient-to-r from-primary-400 to-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/40 hover:shadow-xl hover:shadow-primary-500/50 hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                Browse Canteens 
                <span className="group-hover:translate-x-1 transition-transform duration-300">🍛</span>
              </Link>
              <a
                href="#about"
                className="group px-8 py-3.5 bg-white/10 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 hover:border-white/50 hover:-translate-y-1 hover:scale-105 transition-all duration-300 backdrop-blur-sm flex items-center gap-2"
              >
                Learn More 
                <MdArrowForward className="group-hover:translate-x-1 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="group relative"
            >
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current 
                    ? 'w-8 bg-primary-400 shadow-lg shadow-primary-400/50' 
                    : 'w-2 bg-white/40 hover:bg-white/60 hover:w-4'
                }`}
              />
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                Slide {i + 1}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section 
        id="about" 
        ref={aboutRef}
        className="py-24 px-4 bg-white dark:bg-gray-900 transition-colors duration-500 relative overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary-400 rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-600 rounded-full filter blur-3xl animate-pulse-slower"></div>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div
              className={`transition-all duration-700 transform ${
                aboutVisible 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 -translate-x-12'
              }`}
            >
              <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-bounce-slow">
                <MdCheckCircle className="text-lg" />
                About Us
              </div>
              
              <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-5">
                One Platform. <span className="text-primary-600 dark:text-primary-400 relative">
                  Every Campus Canteen.
                  <span className="absolute -bottom-2 left-0 w-0 group-hover:w-full h-1 bg-gradient-to-r from-primary-400 to-transparent rounded-full transition-all duration-700"></span>
                </span>
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed max-w-lg">
                SmartMess connects students with verified campus canteens — making it simple to browse
                menus, place orders, track deliveries, and manage spending all in one place.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-8 mt-8">
                {[
                  { value: "30+", label: "Approved Canteens", icon: "🏪" },
                  { value: "5k+", label: "Student Orders", icon: "📦" },
                  { value: "4.8★", label: "Average Rating", icon: "⭐" },
                ].map((stat, index) => (
                  <div 
                    key={stat.label}
                    className={`group relative transition-all duration-500 transform ${
                      aboutVisible 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-4'
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="relative p-4 hover:scale-110 transition-transform duration-300">
                      <div className="text-3xl mb-2 animate-float-slow">{stat.icon}</div>
                      <div className="font-playfair text-3xl font-black text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Image */}
            <div
              className={`relative rounded-2xl overflow-hidden h-[420px] shadow-2xl shadow-primary-500/20 group transition-all duration-700 transform ${
                aboutVisible 
                  ? 'opacity-100 translate-x-0' 
                  : 'opacity-0 translate-x-12'
              }`}
            >
              <img
                src="https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800&q=80"
                alt="Campus canteen"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-6 left-6 bg-primary-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary-600/40 transform group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300">
                ✅ Verified & Approved Canteens Only
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section 
        id="services" 
        ref={servicesRef}
        className="py-24 px-4 bg-gray-50 dark:bg-gray-800 transition-colors duration-500"
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div
            className={`text-center mb-12 transition-all duration-500 transform ${
              servicesVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full text-sm font-semibold mb-4 animate-pulse-slow">
              <MdLocalOffer className="text-lg" />
              What We Offer
            </div>
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight">
              Everything You Need to <span className="text-primary-600 dark:text-primary-400">Eat Better</span> on Campus
            </h2>
          </div>
          
          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MdRestaurantMenu, title: "Browse Menus", desc: "Explore meals from multiple canteens, filter by price, category, and availability." },
              { icon: MdShoppingCart, title: "Smart Cart", desc: "Add meals, adjust quantities, and place orders in seconds from any device." },
              { icon: MdPayment, title: "Easy Payments", desc: "Secure checkout with multiple payment methods and instant confirmation." },
              { icon: MdDeliveryDining, title: "Order Tracking", desc: "Real-time status updates from preparation to ready-for-pickup." },
              { icon: MdBarChart, title: "Expense Reports", desc: "Monthly spending summaries to help you stay on budget." },
              { icon: MdStarRate, title: "Ratings & Reviews", desc: "Share feedback and read honest reviews from fellow students." },
            ].map((s, index) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className={`group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary-400/30 hover:border-primary-400 transition-all duration-500 relative overflow-hidden ${
                    servicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-400/10 to-transparent rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500" />
                  
                  <div className="relative">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl text-primary-600 dark:text-primary-400 flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl group-hover:shadow-primary-400/30 transition-all duration-500">
                        <Icon className="group-hover:animate-bounce-slow" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                          {s.title}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                    
                    {/* Animated underline */}
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 group-hover:w-full transition-all duration-500"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED CANTEENS */}
      <section 
        id="browse-canteens" 
        ref={canteensRef}
        className="py-24 px-4 bg-white dark:bg-gray-900 transition-colors duration-500"
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div
            className={`text-center mb-12 transition-all duration-500 transform ${
              canteensVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full text-sm font-semibold mb-4 animate-bounce-slow">
              <FaUtensils className="text-lg" />
              Featured Canteens
            </div>
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight">
              Popular on <span className="text-primary-600 dark:text-primary-400">Campus Right Now</span>
            </h2>
          </div>

          {/* Canteen Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCards.map((c, index) => (
              <div
                key={c.name}
                className={`group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary-400/30 hover:border-primary-400 transition-all duration-500 ${
                  canteensVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Image Container */}
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={c.img}
                    alt={c.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Animated tag */}
                  <span className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold transform -translate-y-12 group-hover:translate-y-0 transition-transform duration-500">
                    {c.tag}
                  </span>
                  
                  {/* Rating badge */}
                  <span className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-primary-600 dark:text-primary-400 transform translate-x-12 group-hover:translate-x-0 transition-transform duration-500">
                    ★ {c.rating}
                  </span>
                </div>
                
                {/* Card Content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                    {c.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                      <MdRestaurantMenu className="text-primary-400 group-hover:rotate-12 transition-transform duration-300" />
                      {c.meals}
                    </span>
                    <Link 
                      to={browsePath}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-300 group-hover:translate-x-1 transform duration-300 inline-flex items-center gap-1"
                    >
                      View Menu 
                      <MdArrowForward className="group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <Link
              to={browsePath}
              className="group relative inline-flex items-center gap-2 px-10 py-4 text-base bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">View All Canteens</span>
              <MdArrowForward className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              <span className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <div 
        ref={ctaRef}
        className={`py-24 px-4 bg-gradient-to-br from-primary-800 to-primary-700 text-center transition-all duration-700 transform ${
          ctaVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full animate-ping-slow"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full animate-pulse-slow"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full animate-pulse"></div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 animate-pulse-slow">
            Ready to Order Your <span className="text-primary-300">First Meal?</span>
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join thousands of students already using SmartMess every day.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="group px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl shadow-lg shadow-primary-900/40 hover:shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              Get Started Free
              <MdArrowForward className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              to="/login"
              className="group px-8 py-3.5 bg-white/10 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 hover:border-white/50 hover:-translate-y-1 hover:scale-105 transition-all duration-300 backdrop-blur-sm flex items-center gap-2"
            >
              Already have an account?
              <MdArrowForward className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

