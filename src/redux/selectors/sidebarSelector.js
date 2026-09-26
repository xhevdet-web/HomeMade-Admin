import { useSelector } from 'react-redux'
import navigation from '../../navigation'

// Custom hook to select sidebar state
export const useSidebarSelector = () => {
  const sidebarData = navigation
  const currentView = useSelector((state) => state?.sidebar?.current_view)
  const filteredSidebarData = sidebarData?.filter((link) => link?.is_nav)
  return { sidebarData, filteredSidebarData, currentView }
}

// Example usage:

// import { useAuthSelector } from '../redux/selectors/authSelectors';

// const MyComponent = () => {
//   const { isAuthenticated, userData } = useAuthSelector();

//   // Now you can use isAuthenticated and userData in your component
// };
