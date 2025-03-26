import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  CButton,
  CForm,
  CFormInput,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CFormSelect,
  CFormCheck
} from '@coreui/react';
import useAxios from '../../utils/useAxios';
import MultiSelect from '../../components/MultiSelect';

const transformRoles = (roles) => {
  return roles.map(role => ({
    id: role.id,
    first_name: role?.name?.split(' ')[0] || '',
    last_name: role?.name?.split(' ')[1] || ''
  }));
};

const NotificationsModal = ({ message, defaultData, type, handleModalClose, callback }) => {
  const { axiosRequest, isLoading } = useAxios();
  const [userRoles, setUserRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [notifyWithEmail, setNotifyWithEmail] = useState(false);

  const handleCheckboxChange = (event) => {
    setNotifyWithEmail(event.target.checked);
  };
  const [data, setData] = useState(
    defaultData || {
      title: '',
      message: '',
      type: '',
      description: '',
      show_from: '',
      show_to: '',
      show_to_roles: []
    }
  );

  const notificationTypes = [
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
    { label: 'Success', value: 'success' },
    { label: 'Danger', value: 'danger' },
    { label: 'Warning', value: 'warning' },
    { label: 'Info', value: 'info' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' }
  ];

  const handleChange = (e) => {
    const { value, name, type, checked } = e.target;

    if (type === 'datetime-local') {
      const localDateTime = new Date(value);
      const utcDateTime = new Date(localDateTime.getTime() - (localDateTime.getTimezoneOffset() * 60000));
      setData((prevState) => ({
        ...prevState,
        [name]: utcDateTime.toISOString()
      }));
    } else {
      setData((prevState) => ({
        ...prevState,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const formatDateTimeForInput = (dateTime) => {
    if (!dateTime) return '';
    const localDateTime = new Date(dateTime);
    return localDateTime.toISOString().slice(0, 16);
  };

  const handleMultiSelectChange = (selectedOptions) => {
    setSelectedRoles(selectedOptions);
    setData((prevState) => ({
      ...prevState,
      show_to_roles: selectedOptions
    }));
  };

  let url = '';
  let method = '';

  if (type === 'put') {
    url = `notifications/update`;
    method = 'put';
  } else if (type === 'post') {
    url = 'notifications';
    method = 'post';
  } else if (type === 'delete') {
    url = `notifications/${defaultData?.id}`;
    method = 'delete';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axiosRequest(url, method, data, handleModalClose);
    callback();
  };

  const fetchRoles = async () => {
    const { data } = await axiosRequest('/user-roles/all', 'get');
    const transformedRoles = transformRoles(data);
    setUserRoles(transformedRoles);
  };

  const fetchNotificationRoles = async () => {
    try {
      const { data: notificationRoles } = await axiosRequest('/notifications/show-notifications-to/all', 'get');
      const relevantRoleIds = notificationRoles
        .filter(role => role.notification_id === defaultData.id)
        .map(role => role.role_id);

      setSelectedRoles(relevantRoleIds);
      setData(prevState => ({
        ...prevState,
        show_to_roles: relevantRoleIds
      }));
    } catch (error) {
      console.error('Error fetching notification roles:', error);
    }
  };

  useEffect(() => {
    fetchRoles();
    if (type === 'put' && defaultData) {
      fetchNotificationRoles();
    }
  }, [type, defaultData]);

  return (
    <CModal
      backdrop="static"
      visible
      alignment="center"
      onClose={handleModalClose}
      aria-labelledby="StaticBackdropExampleLabel"
    >
      <CModalHeader>
        <CModalTitle id="StaticBackdropExampleLabel">Shto një njoftim!</CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          <CFormInput
            type="text"
            onChange={handleChange}
            name="title"
            id="title"
            floatingLabel="Title"
            placeholder="Title"
            aria-label="default input example"
            defaultValue={data?.title}
            className="mt-2"
            required
          />

          <CFormTextarea
            type="text"
            onChange={handleChange}
            name="message"
            id="message"
            floatingLabel="Message"
            placeholder="Message"
            aria-label="default input example"
            defaultValue={data?.message}
            className="mt-2"
            style={{ height: '100px' }}
            required
          ></CFormTextarea>

          <CFormSelect
            name="type"
            id="type"
            onChange={handleChange}
            className="mt-2"
            value={data?.type}
            required
          >
            <option value="" hidden>Select Type</option>
            {notificationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </CFormSelect>

          <MultiSelect
            options={userRoles}
            onChange={handleMultiSelectChange}
            defaultSelected={selectedRoles}
          />

          <CFormInput
            onChange={handleChange}
            name="show_from"
            id="show_from"
            floatingLabel="Show From"
            placeholder="Show From"
            aria-label="show_from"
            type="datetime-local"
            className="mt-2"
            value={formatDateTimeForInput(data.show_from)}
            required
          />

          <CFormInput
            onChange={handleChange}
            name="show_to"
            id="show_to"
            floatingLabel="Show to"
            placeholder="Show to"
            aria-label="show_to"
            type="datetime-local"
            className="mt-2"
            value={formatDateTimeForInput(data.show_to)}
            required
          />
          <CFormCheck
            className='mt-2'
            id="notifyByEmail"
            label="Njofto edhe përmes emailit"
            checked={notifyWithEmail}
            onChange={handleCheckboxChange}
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

NotificationsModal.propTypes = {
  message: PropTypes.string,
  defaultData: PropTypes.object,
  type: PropTypes.string.isRequired,
  handleModalClose: PropTypes.func.isRequired,
  callback: PropTypes.func.isRequired
};

export default NotificationsModal;
