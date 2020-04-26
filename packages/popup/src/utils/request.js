import axios from "axios";
import { Toast } from "mint-ui";
// const earthUrl = process.env.VUE_APP_EARTH_URL;

let ret = ({
  method = "GET",
  url = "",
  params = {},
  data,
  local = false,
  jupiter = false
} = {}) => {
  const hasParam = url.match(/\?/);
  const urlParams = Object.keys(params).reduce(
    (previousValue, key, i) =>
      previousValue +
      `${((i || hasParam) && "&") || "?"}${key}=${encodeURIComponent(
        params[key]
      )}`,
    ""
  );
  // let requestUrl = earthUrl;
  return axios(`${url + urlParams}`, {
    method,
    data
  });
};
// debugger
// axios.interceptors.response.use(res => {
//   const { status, data } = res;
//   return Promise.resolve({
//     status,
//     data
//   });
// }, (err) => {
//   err.message && Toast({ message: err.message, duration: 1000});
//   const { status, data } = err.response;
//   return Promise.reject({
//     status,
//     data
//   });
// });
axios.interceptors.response.use(
  function(response) {
    return response;
  },
  function(error) {
    error.message && Toast({ message: error.message, duration: 1000 });
    return Promise.reject(error);
  }
);
ret.get = (url, params, local, jupiter) => ret({ url, params, local, jupiter });
ret.post = (url, data, local) => ret({ method: "POST", url, data, local });

export default ret;
