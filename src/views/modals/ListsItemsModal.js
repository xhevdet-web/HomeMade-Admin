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

const ListsItemsModal = ({ defaultData, type, handleModalClose, callback }) => {
  const { axiosRequest, isLoading } = useAxios();
  const [data, setData] = useState(
    defaultData || {
      name_sq: '',
      name_en: '',
      name_sr: '',
      list_type_id: 0
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
    url = `lists/${defaultData?.id}`;
    method = 'put';
  } else if (type === 'post') {
    url = 'lists';
    method = 'post';
  } else if (type === 'delete') {
    url = `lists/${defaultData?.id}`;
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
          {type === 'put' ? 'Ndrysho Artikullin e Listës' : 'Shto Artikull të Ri në Listë'}
        </CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
         
            <CFormInput
            type="text"
            onChange={handleChange}
            name="name_sq"
            id="name_sq"
            floatingLabel="Emri i Artikullit sq"
            placeholder="Emri i Artikullit"
            defaultValue={data?.name_sq}
            className="mt-2"
            required
          />
           <CFormInput
            type="text"
            onChange={handleChange}
            name="name_en"
            id="name_en"
            floatingLabel="Emri i Artikullit en"
            placeholder="Emri i Artikullit en"
            defaultValue={data?.name_en}
            className="mt-2"
            required
          />
            <CFormInput
            type="text"
            onChange={handleChange}
            name="name_sr"
            id="name_sr"
            floatingLabel="Emri i Artikullit sr"
            placeholder="Emri i Artikullit"
            defaultValue={data?.name_sr}
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


ListsItemsModal.propTypes = {
  defaultData: PropTypes.object,
  type: PropTypes.string.isRequired,
  handleModalClose: PropTypes.func.isRequired,
  callback: PropTypes.func.isRequired,
};

export default ListsItemsModal;
