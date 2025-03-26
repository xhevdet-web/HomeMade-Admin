import React from 'react'
import PropTypes from 'prop-types'
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react'
import { CustomButton } from '../../components'

const ConfirmationModal = ({ defaultData, handleModalClose, type, callback }) => {
    console.log('ConfirmationModal message: ', defaultData, defaultData.location.state.group.id)
    return (
        <CModal
            backdrop="static"
            visible
            alignment="center"
            onClose={handleModalClose}
            aria-labelledby="StaticBackdropExampleLabel"
        >
            <CModalHeader>
                <CModalTitle id="StaticBackdropExampleLabel">A jeni të sigurt për këtë veprim?</CModalTitle>
            </CModalHeader>
            <CModalBody>
                Dua të shtoj studentin <b>{defaultData.first_name + " " + defaultData.last_name}</b> në grupin <b>{defaultData.location.state.group.type.name + " - " + defaultData.location.state.group.name}</b>
                {/* {message} */}
            </CModalBody>
            <CModalFooter>
                <CustomButton actionType="cancel" onClick={handleModalClose}>Anulo</CustomButton>
                <CustomButton actionType="save" onClick={() => { callback(type == "remove" ? defaultData.student_group_member.id : defaultData.id, defaultData.location.state.group.id); handleModalClose() }}>Konfirmo</CustomButton>
            </CModalFooter>
        </CModal>
    )
}

ConfirmationModal.propTypes = {
    defaultData: PropTypes.object.isRequired,
    handleModalClose: PropTypes.func.isRequired,
    callback: PropTypes.func.isRequired,
}

export default ConfirmationModal
