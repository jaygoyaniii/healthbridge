import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { NotificationProvider } from './context/NotificationContext';
import Loader from './components/common/Loader';

/* ─── Public Pages ─── */
const Home = lazy(() => import('./pages/public/Home'));
const About = lazy(() => import('./pages/public/About'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Doctors = lazy(() => import('./pages/public/Doctors'));
const DoctorProfile = lazy(() => import('./pages/public/DoctorProfile'));
const Login = lazy(() => import('./pages/public/Login'));
const Register = lazy(() => import('./pages/public/Register'));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/public/ResetPassword'));
const Unauthorized = lazy(() => import('./pages/public/Unauthorized'));

/* ─── Patient Pages ─── */
const PatientHome = lazy(() => import('./pages/patient/PatientHome'));
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard'));
const FindDoctor = lazy(() => import('./pages/patient/FindDoctor'));
const BookAppointment = lazy(() => import('./pages/patient/BookAppointment'));
const MyAppointments = lazy(() => import('./pages/patient/MyAppointments'));
const PatientAppointmentDetail = lazy(() => import('./pages/patient/AppointmentDetail'));
const PatientChat = lazy(() => import('./pages/shared/Chat'));
const MedicalRecords = lazy(() => import('./pages/patient/MedicalRecords'));
const Prescriptions = lazy(() => import('./pages/patient/Prescriptions'));
const PrescriptionDetail = lazy(() => import('./pages/shared/PrescriptionDetail'));
const PatientProfile = lazy(() => import('./pages/patient/PatientProfile'));

/* ─── Doctor Pages ─── */
const DoctorHome = lazy(() => import('./pages/doctor/DoctorHome'));
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const ManageAppointments = lazy(() => import('./pages/doctor/DoctorAppointments'));
const DoctorAppointmentDetail = lazy(() => import('./pages/doctor/AppointmentDetail'));
const MyPatients = lazy(() => import('./pages/doctor/DoctorPatients'));
const PatientDetail = lazy(() => import('./pages/doctor/PatientDetail'));
const ScheduleManager = lazy(() => import('./pages/doctor/ScheduleManager'));
const DoctorChat = lazy(() => import('./pages/shared/Chat'));
const WritePrescription = lazy(() => import('./pages/doctor/WritePrescription'));
const Earnings = lazy(() => import('./pages/doctor/Earnings'));
const DoctorProfilePage = lazy(() => import('./pages/doctor/DoctorProfile'));

/* ─── Admin Pages ─── */
const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const DoctorApprovals = lazy(() => import('./pages/admin/DoctorApprovals'));
const ManageDoctors = lazy(() => import('./pages/admin/ManageDoctors'));
const ManagePatients = lazy(() => import('./pages/admin/ManagePatients'));
const AllAppointments = lazy(() => import('./pages/admin/AllAppointments'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const Specializations = lazy(() => import('./pages/admin/Specializations'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminChat = lazy(() => import('./pages/shared/Chat'));
const AdminDoctorProfile = lazy(() => import('./pages/admin/DoctorProfile'));
const AdminPatientProfile = lazy(() => import('./pages/admin/PatientProfile'));
const ContactInquiries = lazy(() => import('./pages/admin/ContactInquiries'));
const ContactInquiryDetail = lazy(() => import('./pages/admin/ContactInquiryDetail'));

/* ─── Shared Pages ─── */
const Notifications = lazy(() => import('./pages/shared/Notifications'));

/* ─── Layouts & Guards ─── */
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardLayout from './components/common/DashboardLayout';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ChatProvider>
          <Suspense fallback={<Loader />}>
            <Routes>
              {/* ═══ Public Routes ═══ */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/doctors/:id" element={<DoctorProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* ═══ Patient Routes ═══ */}
              <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
                <Route element={<DashboardLayout role="patient" />}>
                  <Route path="/patient/home" element={<PatientHome />} />
                  <Route path="/patient/dashboard" element={<PatientDashboard />} />
                  <Route path="/patient/find-doctor" element={<FindDoctor />} />
                  <Route path="/patient/find-doctor/:id" element={<DoctorProfile />} />
                  <Route path="/patient/book-appointment" element={<BookAppointment />} />
                  <Route path="/patient/appointments" element={<MyAppointments />} />
                  <Route path="/patient/appointments/:id" element={<PatientAppointmentDetail />} />
                  <Route path="/patient/chat" element={<PatientChat />} />
                  <Route path="/patient/chat/:conversationId" element={<PatientChat />} />
                  <Route path="/patient/records" element={<MedicalRecords />} />
                  <Route path="/patient/prescriptions" element={<Prescriptions />} />
                  <Route path="/patient/prescriptions/:id" element={<PrescriptionDetail />} />
                  <Route path="/patient/profile" element={<PatientProfile />} />
                  <Route path="/patient/notifications" element={<Notifications />} />
                </Route>
              </Route>

              {/* ═══ Doctor Routes ═══ */}
              <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
                <Route element={<DashboardLayout role="doctor" />}>
                  <Route path="/doctor/home" element={<DoctorHome />} />
                  <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                  <Route path="/doctor/appointments" element={<ManageAppointments />} />
                  <Route path="/doctor/appointments/:id" element={<DoctorAppointmentDetail />} />
                  <Route path="/doctor/patients" element={<MyPatients />} />
                  <Route path="/doctor/patients/:patientId" element={<PatientDetail />} />
                  <Route path="/doctor/schedule" element={<ScheduleManager />} />
                  <Route path="/doctor/chat" element={<DoctorChat />} />
                  <Route path="/doctor/chat/:conversationId" element={<DoctorChat />} />
                  <Route path="/doctor/prescriptions/:id" element={<PrescriptionDetail />} />
                  <Route path="/doctor/prescriptions/write/:appointmentId" element={<WritePrescription />} />
                  <Route path="/doctor/earnings" element={<Earnings />} />
                  <Route path="/doctor/profile" element={<DoctorProfilePage />} />
                  <Route path="/doctor/notifications" element={<Notifications />} />
                </Route>
              </Route>

              {/* ═══ Admin Routes ═══ */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<DashboardLayout role="admin" />}>
                  <Route path="/admin/home" element={<AdminHome />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/approvals" element={<DoctorApprovals />} />
                  <Route path="/admin/doctors" element={<ManageDoctors />} />
                  <Route path="/admin/doctors/:doctorId" element={<AdminDoctorProfile />} />
                  <Route path="/admin/patients" element={<ManagePatients />} />
                  <Route path="/admin/patients/:patientId" element={<AdminPatientProfile />} />
                  <Route path="/admin/appointments" element={<AllAppointments />} />
                  <Route path="/admin/analytics" element={<Analytics />} />
                  <Route path="/admin/specializations" element={<Specializations />} />
                  <Route path="/admin/reports" element={<Reports />} />
                  <Route path="/admin/chat" element={<AdminChat />} />
                  <Route path="/admin/chat/:conversationId" element={<AdminChat />} />
                  <Route path="/admin/contact-inquiries" element={<ContactInquiries />} />
                  <Route path="/admin/contact-inquiries/:id" element={<ContactInquiryDetail />} />
                  <Route path="/admin/notifications" element={<Notifications />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </ChatProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
