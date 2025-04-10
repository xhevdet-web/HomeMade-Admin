import React, { createContext, useCallback, useContext, useState } from "react";
import PropTypes from "prop-types";
import {
  AddRole,
  NoAccessModal,
  RoleCreationRights,
  TermsAndConditions,
  AddUser,
  AddActionFunction,
  ConfirmationModal,
  ListTypeModal,
  ListItemsModal,
  EmployeesModal,
} from "../views/modals";

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

const modalComponents = {
  UnautorizedAccess: NoAccessModal,
  TermsAndConditions: TermsAndConditions,
  AddRole: AddRole,
  AddUser: AddUser,
  AddNav: AddActionFunction,
  RoleCreationRights: RoleCreationRights,
  ConfirmationModal: ConfirmationModal,
  ListTypeModal,
  ListItemsModal: ListItemsModal,
  EmployeesModal,
};

const HandleModals = ({ children }) => {
  const [modalContent, setModalContent] = useState(null);

  const handleModalClose = () => {
    setModalContent(null);
  };

  const showModal = useCallback(
    (modalName, data = null, type = null, callback = null, message = null) => {
      const ModalComponent = modalComponents[modalName];
      if (!ModalComponent) {
        console.error("Invalid modal type or missing data");
        return;
      }
      // console.log('message', message)
      setModalContent(
        <ModalComponent
          defaultData={data}
          handleModalClose={() => handleModalClose()}
          type={type}
          callback={callback}
          message={message}
        />
      );
    },
    []
  );

  return (
    <ModalContext.Provider value={{ showModal }}>
      {modalContent}
      {children}
    </ModalContext.Provider>
  );
};

HandleModals.propTypes = {
  children: PropTypes.node.isRequired,
};

export default HandleModals;
