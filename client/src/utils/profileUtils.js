export const calculateDoctorProfileCompleteness = (userData, doctorData) => {
  let score = 0;
  const total = 8;
  
  if (userData?.name) score++;
  if (userData?.phone) score++;
  if (doctorData?.experience) score++;
  if (doctorData?.fees) score++;
  if (doctorData?.bio) score++;
  if (doctorData?.clinicName) score++;
  if (doctorData?.languages?.length > 0) score++;
  if (doctorData?.qualifications?.length > 0) score++;
  
  return Math.round((score / total) * 100);
};
