import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  CButton,
  CForm,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from "@coreui/react";
import useAxios from "../../utils/useAxios";

const ListsItemsModal = ({ defaultData, type, handleModalClose, callback }) => {
  const { axiosRequest, isLoading } = useAxios();
  const [data, setData] = useState(
    defaultData || {
      name: "",
      list_type_id: 0,
    }
  );

  const handleChange = (e) => {
    const { value, name } = e.target;
    setData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  let url = "";
  let method = "";

  if (type === "put") {
    url = `lists/${defaultData?.id}`;
    method = "put";
  } else if (type === "post") {
    url = "lists";
    method = "post";
  } else if (type === "delete") {
    url = `lists/${defaultData?.id}`;
    method = "delete";
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    await axiosRequest(url, method, data, handleModalClose);
    callback();
  };

  return (
    <CModal
      backdrop="static"
      visible
      alignment="center"
      onClose={handleModalClose}
      aria-labelledby="StaticBackdropExampleLabel"
    >
      <CModalHeader>
        <CModalTitle id="StaticBackdropExampleLabel">
          {type === "put"
            ? "Ndrysho Artikullin e Listës"
            : "Shto Artikull të Ri në Listë"}
        </CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          <CFormInput
            type="text"
            onChange={handleChange}
            name="name"
            id="name"
            floatingLabel="Emri i Artikullit"
            placeholder="Emri i Artikullit"
            defaultValue={data?.name}
            className="mt-2"
            required
          />
        </CModalBody>
        <CModalFooter>
          <CButton disabled={isLoading} color="secondary" type="submit">
            {type === "put"
              ? "Ruaj ndryshimet"
              : type === "delete"
                ? "Fshij"
                : "Shto"}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  );
};

ListsItemsModal.propTypes = {
  defaultData: PropTypes.object,
  type: PropTypes.string.isRequired,
  handleModalClose: PropTypes.func.isRequired,
  callback: PropTypes.func.isRequired,
};

export default ListsItemsModal;
