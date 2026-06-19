import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, Star, MapPin, Stethoscope, Video, 
  CheckCircle, SlidersHorizontal, Languages, ShieldCheck, ChevronRight 
} from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import doctorService from '../../services/doctorService';
import adminService from '../../services/adminService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/common/Avatar';

const FindDoctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced Filters
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    city: '',
    consultationType: '',
    minRating: '',
    maxFees: '',
    sort: 'rating'
  });
  
  useEffect(() => {
    // Fetch specializations for dropdown
    adminService.getSpecializations().then((res) => {
      setSpecializations(res.data.specializations || []);
    }).catch(console.error);
    
    fetchDoctors();
  }, []);

  useEffect(() => {
    // Debounced search
    const timer = setTimeout(() => {
      fetchDoctors();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await doctorService.getDoctors({
        search: filters.search,
        specialization: filters.specialization,
        city: filters.city,
        consultationType: filters.consultationType,
        minRating: filters.minRating,
        maxFees: filters.maxFees,
        sort: filters.sort,
        limit: 20
      });
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error('Failed to fetch doctors', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      specialization: '',
      city: '',
      consultationType: '',
      minRating: '',
      maxFees: '',
      sort: 'rating'
    });
  };

  return (
    <PageTransition className="max-w-7xl mx-auto space-y-6">
      
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="w-full md:w-2/3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black mb-4">
              Find Your Perfect <span className="text-blue-300">Doctor</span>
            </h1>
            <p className="text-blue-100 text-lg max-w-xl mb-8">
              Book appointments with verified specialists, read patient reviews, and manage your healthcare journey in one place.
            </p>
            
            {/* Primary Search Bar */}
            <div className="relative max-w-2xl bg-white rounded-2xl p-2 flex flex-col sm:flex-row shadow-lg">
              <div className="flex-1 flex items-center px-4 py-2 border-b sm:border-b-0 sm:border-r border-slate-200">
                <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search doctors, conditions..." 
                  className="w-full bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div className="flex-1 flex items-center px-4 py-2">
                <MapPin className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                <input 
                  type="text" 
                  placeholder="City or location..." 
                  className="w-full bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                />
              </div>
              <Button variant="primary" className="mt-2 sm:mt-0 rounded-xl px-8 h-12" onClick={() => fetchDoctors()}>
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start mt-8">
        
        {/* Mobile Filter Toggle */}
        <div className="w-full lg:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-border">
          <span className="font-semibold text-heading">Filter Results</span>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>

        {/* Filters Sidebar */}
        <div className={`w-full lg:w-72 shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-2xl p-6 border border-border shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-heading text-lg">Filters</h2>
              <button onClick={clearFilters} className="text-sm text-primary font-medium hover:underline">Clear All</button>
            </div>

            <div className="space-y-6">
              {/* Specialization */}
              <div>
                <label className="block text-sm font-semibold text-heading mb-3">Specialization</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="specialization" 
                      value=""
                      checked={filters.specialization === ''}
                      onChange={(e) => handleFilterChange('specialization', e.target.value)}
                      className="w-4 h-4 text-primary border-slate-300 focus:ring-primary" 
                    />
                    <span className="text-sm text-slate-600 group-hover:text-heading transition-colors">All Specialties</span>
                  </label>
                  {specializations.map(spec => (
                    <label key={spec._id} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="specialization" 
                        value={spec._id}
                        checked={filters.specialization === spec._id}
                        onChange={(e) => handleFilterChange('specialization', e.target.value)}
                        className="w-4 h-4 text-primary border-slate-300 focus:ring-primary" 
                      />
                      <span className="text-sm text-slate-600 group-hover:text-heading transition-colors">{spec.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Consultation Type */}
              <div>
                <label className="block text-sm font-semibold text-heading mb-3">Consultation Type</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="consultationType" 
                      value=""
                      checked={filters.consultationType === ''}
                      onChange={(e) => handleFilterChange('consultationType', e.target.value)}
                      className="w-4 h-4 text-primary" 
                    />
                    <span className="text-sm text-slate-600">Any</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="consultationType" 
                      value="video"
                      checked={filters.consultationType === 'video'}
                      onChange={(e) => handleFilterChange('consultationType', e.target.value)}
                      className="w-4 h-4 text-primary" 
                    />
                    <span className="text-sm text-slate-600 flex items-center"><Video className="w-3.5 h-3.5 mr-1.5" /> Video Consult</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="radio" 
                      name="consultationType" 
                      value="in-person"
                      checked={filters.consultationType === 'in-person'}
                      onChange={(e) => handleFilterChange('consultationType', e.target.value)}
                      className="w-4 h-4 text-primary" 
                    />
                    <span className="text-sm text-slate-600 flex items-center"><MapPin className="w-3.5 h-3.5 mr-1.5" /> In-Person Visit</span>
                  </label>
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-semibold text-heading mb-3">Patient Rating</label>
                <div className="space-y-2">
                  {[4, 3].map(rating => (
                    <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="minRating" 
                        value={rating}
                        checked={filters.minRating === String(rating)}
                        onChange={(e) => handleFilterChange('minRating', e.target.value)}
                        className="w-4 h-4 text-primary" 
                      />
                      <span className="text-sm text-slate-600 flex items-center">
                        {Array(5).fill(0).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'}`} />
                        ))}
                        <span className="ml-2">& Up</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Max Fee */}
              <div>
                <label className="block text-sm font-semibold text-heading mb-3">Maximum Fee</label>
                <input 
                  type="range" 
                  min="0" 
                  max="500" 
                  step="50"
                  value={filters.maxFees || 500}
                  onChange={(e) => handleFilterChange('maxFees', e.target.value)}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted mt-2">
                  <span>$0</span>
                  <span className="font-medium text-primary">${filters.maxFees || '500+'}</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 w-full">
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-heading">
              {loading ? 'Searching doctors...' : `${doctors.length} Doctors Available`}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted hidden sm:inline">Sort by:</span>
              <select 
                className="input-base py-1.5 pl-3 pr-8 text-sm bg-white"
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="fees-low">Fee: Low to High</option>
                <option value="fees-high">Fee: High to Low</option>
              </select>
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-border shadow-sm flex flex-col md:flex-row gap-6 animate-pulse">
                  <div className="w-24 h-24 bg-slate-200 rounded-full shrink-0" />
                  <div className="flex-1 space-y-4">
                    <div className="h-6 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                    <div className="h-20 bg-slate-200 rounded w-full" />
                  </div>
                  <div className="w-full md:w-48 space-y-3 pt-4 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                    <div className="h-8 bg-slate-200 rounded w-full" />
                    <div className="h-10 bg-slate-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-border shadow-sm flex flex-col items-center">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-blue-300" />
              </div>
              <h3 className="text-xl font-bold text-heading mb-2">No Doctors Found</h3>
              <p className="text-muted max-w-md mx-auto mb-6">
                We couldn't find any doctors matching your specific filters. Try adjusting your search criteria or clearing filters.
              </p>
              <Button variant="outline" onClick={clearFilters}>Clear All Filters</Button>
            </div>
          ) : (
            <div className="space-y-5">
              {doctors.map(doctor => (
                <div key={doctor._id} className="bg-white rounded-2xl p-5 sm:p-6 border border-border shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row gap-6">
                  
                  {/* Doctor Info Section */}
                  <div className="flex flex-col sm:flex-row gap-5 flex-1">
                    <div className="relative shrink-0 mx-auto sm:mx-0">
                      <Avatar 
                        src={doctor.userId?.avatar} 
                        name={doctor.userId?.name}
                        role="doctor"
                        className="w-24 h-24 sm:w-28 sm:h-28 border-2 border-white shadow-md shrink-0"
                      />
                      <div className="absolute bottom-1 right-1 bg-white rounded-full p-0.5 shadow-sm" title="Verified Professional">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      </div>
                    </div>
                    
                    <div className="flex-1 text-center sm:text-left space-y-3">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-heading group-hover:text-primary transition-colors">
                            Dr. {doctor.userId?.name}
                          </h3>
                        </div>
                        <p className="text-primary font-medium text-sm">
                          {doctor.specialization?.name}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-sm text-slate-600">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1.5" />
                          <span className="font-bold text-slate-800 mr-1">{doctor.rating ? doctor.rating.toFixed(1) : 'New'}</span>
                          <span className="text-xs">({doctor.totalReviews || 0} reviews)</span>
                        </div>
                        <div className="flex items-center">
                          <Stethoscope className="w-4 h-4 mr-1.5 text-slate-400" />
                          <span>{doctor.experience} Yrs Exp.</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                          <span>{doctor.city}</span>
                        </div>
                        {doctor.languages && doctor.languages.length > 0 && (
                          <div className="flex items-center">
                            <Languages className="w-4 h-4 mr-1.5 text-slate-400" />
                            <span>{doctor.languages.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        {doctor.consultationType?.includes('video') && (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border border-blue-100">
                            <Video className="w-3 h-3 mr-1" /> Video Consult
                          </Badge>
                        )}
                        {doctor.consultationType?.includes('in-person') && (
                          <Badge variant="outline" className="bg-slate-50 border-slate-200">
                            <MapPin className="w-3 h-3 mr-1" /> Clinic Visit
                          </Badge>
                        )}
                        <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                          Available Today
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Section */}
                  <div className="flex flex-col justify-between w-full md:w-56 shrink-0 pt-5 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                    <div className="text-center md:text-right mb-4 md:mb-0">
                      <p className="text-xs text-muted font-medium mb-1 uppercase tracking-wider">Consultation Fee</p>
                      <div className="flex items-end justify-center md:justify-end gap-1">
                        <span className="text-2xl font-black text-heading">${doctor.fees}</span>
                        <span className="text-sm text-muted mb-1">/ visit</span>
                      </div>
                      <p className="text-xs text-emerald-600 font-medium flex items-center justify-center md:justify-end mt-1">
                        <CheckCircle className="w-3 h-3 mr-1" /> No hidden charges
                      </p>
                    </div>
                    
                    <div className="space-y-2 mt-auto">
                      <Link to={`/patient/find-doctor/${doctor._id}`} className="block w-full">
                        <Button variant="outline" className="w-full h-11 text-sm bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm">
                          View Full Profile
                        </Button>
                      </Link>
                      <Link to={`/patient/book-appointment?doctorId=${doctor._id}`} className="block w-full">
                        <Button variant="primary" className="w-full h-11 text-sm shadow-md shadow-primary/20 hover:shadow-lg transition-shadow">
                          Book Appointment
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default FindDoctor;
