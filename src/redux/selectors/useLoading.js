import { useSelector } from 'react-redux';

export const useLoading = () => {
  const isLoading = useSelector((state) => state?.loading?.activeRequests > 0);
  return isLoading;
};
