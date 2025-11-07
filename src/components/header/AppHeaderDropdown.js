import React from "react";
import {
  CAvatar,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from "@coreui/react";
import { cilLockLocked ,cilUser} from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import avatar8 from "./../../assets/images/avatars/8.jpg";
import { useLogout } from "../../_helpers";
import { NavLink } from "react-router-dom";

const AppHeaderDropdown = () => {
  const { handleLogout } = useLogout();

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle
        placement="bottom-end"
        className="py-0 pe-0"
        caret={false}
      >
        <CAvatar src={avatar8} size="md" />
      </CDropdownToggle>

      <CDropdownMenu className="p-2" placement="bottom-end">
         <CDropdownItem
          as={NavLink}
          to="/admin/profile"
          state={{ tab: "profile" }}
          className="p-2"
          role="button"
        >
          <CIcon icon={cilUser} className="me-2" />
          Profile
        </CDropdownItem>
        <CDropdownItem
          className="p-2"
          onClick={(e) => handleLogout(e)}
          role="button"
        >
          <CIcon icon={cilLockLocked} className="me-2" />
          Log out
        </CDropdownItem>
        {/* )} */}
      </CDropdownMenu>
      {/* )} */}
    </CDropdown>
  );
};

export default AppHeaderDropdown;
