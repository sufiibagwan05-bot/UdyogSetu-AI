import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/auth/demo-login`;;

const getEntrepreneurAnalytics = async (token) => {
  const response = await axios.get(
    `${API_URL}/entrepreneur`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

const getOfficerAnalytics = async (token) => {
  const response = await axios.get(
    `${API_URL}/officer`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

const getAdminAnalytics = async (token) => {
  const response = await axios.get(
    `${API_URL}/admin`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

const getAdminProjects = async (token) => {
  const response = await axios.get(
    `${API_URL}/admin/projects`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

const getAdminApplications = async (token) => {
  const response = await axios.get(
    `${API_URL}/admin/applications`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export {
  getEntrepreneurAnalytics,
  getOfficerAnalytics,
  getAdminAnalytics,
  getAdminProjects,
  getAdminApplications,
};
