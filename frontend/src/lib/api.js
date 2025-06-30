import axios from 'axios';
import { toast } from 'sonner';

// Configure axios with base URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor to include auth token in requests
API.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 REQUEST: ${config.method.toUpperCase()} ${config.url}`, config);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for handling common response cases
API.interceptors.response.use(
  (response) => {
    console.log(`✅ RESPONSE: ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error);
    
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      
      // Handle 401 Unauthorized - likely token expired
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        toast.error('Session expired. Please login again.');
        // We could add a redirect to login here if needed
      }
      
      // Handle 403 Forbidden
      if (error.response.status === 403) {
        toast.error('You do not have permission to perform this action');
      }
      
      // Handle 404 Not Found
      if (error.response.status === 404) {
        toast.error('Resource not found');
      }
      
      // Handle 500 Internal Server Error
      if (error.response.status >= 500) {
        toast.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      toast.error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      toast.error('Failed to send request');
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email, password) => API.post('/auth/login', { email, password }),
  register: (userData) => {
    // Make sure userData is formatted correctly with required fields
    const {
      name,
      email,
      password,
      confirmPassword,
      role = 'patient',
      phoneNumber = '',
      agreeToTerms = false
    } = userData;
    
    // Return promise from API call
    return API.post('/auth/register', {
      name,
      email,
      password,
      confirmPassword,
      role,
      phoneNumber,
      agreeToTerms
    });
  },
  getCurrentUser: () => API.get('/auth/me'),
  updatePassword: (passwordData) => API.patch('/auth/update-password', passwordData),
  updateProfile: (profileData) => API.patch('/auth/update-profile', profileData),
};

// Doctor services
export const doctorService = {
  createProfile: (profileData) => API.post('/doctors/profile', profileData),
  updateProfile: (profileData) => API.put('/doctors/profile', profileData),
  getProfile: () => API.get('/doctors/profile/me'),
  getPatients: (params) => API.get('/doctors/patients/list', { params }),
  getPatientDetails: (patientId) => API.get(`/doctors/patients/${patientId}`),
  getAllDoctors: (params) => API.get('/doctors', { params }),
  getDoctorDetails: (id) => API.get(`/doctors/${id}`),
  followDoctor: (doctorId) => API.post(`/doctors/follow/${doctorId}`),
  unfollowDoctor: (doctorId) => API.delete(`/doctors/unfollow/${doctorId}`),
  getFollowedDoctors: (params) => API.get('/doctors/followed/list', { params }),
};

// Patient services
export const patientService = {
  getMedicalSummary: () => API.get('/patients/medical-summary'),
  getSwasthyaCard: () => API.get('/patients/swasthya-card'),
  updateProfile: (profileData) => API.patch('/patients/complete-profile', profileData),
  getProfile: () => API.get('/patients/profile'),
  updateMedications: (medications) => API.patch('/patients/medications', { medications }),
  updateMedicalRecords: (medicalRecords) => API.patch('/patients/medical-records', { medicalRecords }),
  getScanProfile: (patientId) => API.get(`/patients/scan/${patientId}`),
  addRecordViaQR: (patientId, recordData) => API.post(`/patients/scan/${patientId}/add-record`, recordData),
  getCompleteHistory: (patientId) => API.get(`/patients/scan/${patientId}/complete-history`),
  // Care & Medication Reminders
  getMedicationReminders: () => API.get('/patients/care/reminders'),
  addMedicationReminder: (reminderData) => API.post('/patients/care/reminders', reminderData),
  updateMedicationReminder: (reminderId, reminderData) => API.patch(`/patients/care/reminders/${reminderId}`, reminderData),
  deleteMedicationReminder: (reminderId) => API.delete(`/patients/care/reminders/${reminderId}`),
  // Get patient by Swasthya ID
  getPatientBySwasthyaId: (swasthyaId) => {
    return API.get(`/patients/swasthya-id/${swasthyaId}`);
  },
};

// Summary services for PDF uploads and processing
export const summaryService = {
  uploadPDF: (pdfFile) => {
    const formData = new FormData();
    formData.append('pdfFile', pdfFile);
    
    return API.post('/summaries/upload', formData, {
      headers: {
        // For file uploads, do NOT set Content-Type manually
        // Let Axios set it automatically with the correct boundary
      },
      timeout: 30000 // 30 seconds timeout for large files
    });
  },
  getSummaries: () => API.get('/summaries'),
  getSummary: (summaryId) => API.get(`/summaries/${summaryId}`),
  deleteSummary: (summaryId) => API.delete(`/summaries/${summaryId}`)
};

// Admin services
export const adminService = {
  getDashboardStats: () => API.get('/admin/stats'),
  getPendingDoctors: () => API.get('/admin/doctor-requests'),
  updateDoctorStatus: (doctorId, statusData) => 
    API.patch(`/admin/doctor-status/${doctorId}`, statusData),
  getAllUsers: (params) => API.get('/admin/users', { params }),
  getAllDoctors: (params) => API.get('/admin/doctors', { params }),
  toggleDoctorActiveStatus: (doctorId, isActive) => 
    API.patch(`/admin/doctor-active-status/${doctorId}`, { isActive }),
};

// Chat services
export const chatService = {
  getUserChats: () => API.get('/chat/user-chats'),
  getChatWithUser: (userId) => API.get(`/chat/with-user/${userId}`),
  getChatById: (chatId) => API.get(`/chat/${chatId}`),
  sendMessage: (chatId, messageData) => API.post(`/chat/${chatId}/messages`, messageData),
  markAsRead: (chatId) => API.patch(`/chat/${chatId}/read`),
  startNewChat: (recipientId) => API.post('/chat/start', { recipientId }),
  shareSwasthyaCard: (chatId, patientId, cardData) => API.post(`/chat/${chatId}/messages`, {
    content: 'Shared a Swasthya Card',
    messageType: 'swasthyaCard',
    patientId,
    cardData
  }),
  uploadFile: (chatId, file) => {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Custom config for file upload - don't set Content-Type manually
    return API.post(`/chat/${chatId}/upload`, formData, {
      headers: {
        // Let Axios set the Content-Type header automatically with the correct boundary
      },
      timeout: 30000 // 30 seconds timeout for large files
    });
  },
  shareDocument: (chatId, fileUrl, fileName) => API.post(`/chat/${chatId}/messages`, {
    content: `Shared a document: ${fileName}`,
    messageType: 'file',
    fileUrl,
    fileName
  }),
  shareImage: (chatId, fileUrl, fileName) => API.post(`/chat/${chatId}/messages`, {
    content: 'Shared an image',
    messageType: 'image',
    fileUrl,
    fileName
  })
};

// Post services
export const postService = {
  createPost: (postData) => API.post('/posts', postData),
  getMyPosts: (params) => API.get('/posts/my-posts', { params }),
  getFeed: (params) => API.get('/posts/feed', { params }),
  getDoctorPosts: (doctorId, params) => API.get(`/posts/doctor/${doctorId}`, { params }),
  likePost: (postId) => API.post(`/posts/${postId}/like`),
  dislikePost: (postId) => API.post(`/posts/${postId}/dislike`),
  deletePost: (postId) => API.delete(`/posts/${postId}`)
};

// Disease detection services
export const diseaseService = {
  uploadImage: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // For file uploads, we should NOT set the Content-Type header manually
    // Let the browser set it correctly with the boundary
    return API.post('/disease/upload', formData, {
      headers: {
        // Remove Content-Type, let Axios set it automatically with correct boundary
      },
      // Add timeout extension for image processing
      timeout: 30000 // 30 seconds
    });
  },
  getAllDiseases: () => API.get('/disease/all'),
  getDiseaseByName: (name) => API.get(`/disease/${name}`),
  
  // Check if Flask service is running
  checkFlaskService: async () => {
    try {
      // We'll ping our backend which will check the Flask service
      const response = await API.get('/disease/status/check');
      return response.data.data.status === 'running';
    } catch (error) {
      console.error('Flask service check failed:', error);
      return false;
    }
  }
};

// Utility function to test the connection to the backend
export const testConnection = async () => {
  try {
    const response = await API.get('/');
    console.log('Backend connection successful:', response.data);
    toast.success('Connected to the backend successfully!');
    return true;
  } catch (error) {
    console.error('Backend connection failed:', error);
    toast.error('Failed to connect to the backend. Check console for details.');
    return false;
  }
};

export default API; 