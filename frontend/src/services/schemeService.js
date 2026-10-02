import axios from "axios";

const API_URL = "http://localhost:5000/api/schemes";

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