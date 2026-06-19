import api from "./api";

const adminService = {
  getDashboardStats: () => api.get("/admin/dashboard"),
  getAnalyticsData: (timeRange = "all") =>
    api.get(`/admin/analytics?timeRange=${timeRange}`),
  getAllDoctors: () => api.get("/admin/doctors"),
  getDoctorById: (id) => api.get(`/admin/doctors/${id}`),
  getAllPatients: () => api.get("/admin/patients"),
  getPatientById: (id) => api.get(`/admin/patients/${id}`),
  getAllAppointments: () => api.get("/admin/appointments"),
  getDoctorApprovals: () => api.get("/admin/doctors/approvals"),
  approveDoctor: (id) => api.put(`/admin/doctors/${id}/approve`),
  rejectDoctor: (id, reason) =>
    api.put(`/admin/doctors/${id}/reject`, { reason }),

  getPublicStats: () => api.get("/admin/public-stats"),
  getSpecializations: () => api.get("/admin/specializations"),
  createSpecialization: (data) => api.post("/admin/specializations", data),
  updateSpecialization: (id, data) =>
    api.put(`/admin/specializations/${id}`, data),
  deleteSpecialization: (id) => api.delete(`/admin/specializations/${id}`),

  deletePatient: (id) => api.delete(`/admin/patients/${id}`),
  deleteDoctor: (id) => api.delete(`/admin/doctors/${id}`),
};

export default adminService;
