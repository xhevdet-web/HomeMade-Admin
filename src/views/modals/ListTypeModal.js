import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  CButton,
  CForm,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react';
import useAxios from '../../utils/useAxios';

const ListTypeModal = ({ defaultData, type, handleModalClose, callback }) => {
  const { axiosRequest, isLoading } = useAxios();
  const [data, setData] = useState(
    defaultData || {
      name: '',
    }
  );

  const handleChange = (e) => {
    const { value, name } = e.target;
    setData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  let url = '';
  let method = '';

  if (type === 'put') {
    url = `list-types/${defaultData?.id}`;
    method = 'put';
  } else if (type === 'post') {
    url = 'list-types';
    method = 'post';
  } else if (type === 'delete') {
    url = `list-types/${defaultData?.id}`;
    method = 'delete';
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
          {type === 'put' ? 'Ndrysho Llojin e Listës' : 'Shto Lloj Liste'}
        </CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          <CFormInput
            type="text"
            onChange={handleChange}
            name="name"
            id="name"
            floatingLabel="Emri i Llojit"
            placeholder="Emri i Llojit"
            defaultValue={data?.name}
            className="mt-2"
            required
          />

        </CModalBody>
        <CModalFooter>
          <CButton disabled={isLoading} color="secondary" type="submit">
            {type === 'put' ? 'Ruaj ndryshimet' : type === 'delete' ? 'Fshij' : 'Shto'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  );
};

ListTypeModal.propTypes = {
  defaultData: PropTypes.object,
  type: PropTypes.string.isRequired,
  handleModalClose: PropTypes.func.isRequired,
  callback: PropTypes.func.isRequired
};

export default ListTypeModal;
