import axios from "axios";

const API_URL = "const url = `${import.meta.env.VITE_API_URL}/api/auth/demo-login`;";

const getMatchedSchemes = async (projectId, token) => {
  const response = await axios.get(
    `${API_URL}/project/${projectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export {
  getMatchedSchemes,
};