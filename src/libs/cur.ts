import path from "path";

const cur = (str = "") => {
  return path.join(__dirname, str);
};

export default cur;
