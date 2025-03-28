import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    CRow,
    CCol,
    CCard,
    CCardBody,
    CCardTitle,
    CCardHeader,
    CButton,
    CSpinner,
    CBadge,
    CContainer,
} from '@coreui/react'
import { FaFilePdf } from 'react-icons/fa'
import useAxios from '../../../utils/useAxios'

const EmployeeDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { axiosRequest } = useAxios()
    const [employee, setEmployee] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchEmployee = async () => {
        try {
            const { data } = await axiosRequest(`/employees/${id}`, 'get')
            setEmployee(data)
        } catch (error) {
            console.error('Failed to fetch employee', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) fetchEmployee()
    }, [id])

    if (loading) {
        return (
            <div className="text-center my-5">
                <CSpinner color="primary" />
            </div>
        )
    }

    if (!employee) {
        return <div className="text-center p-4">Employee not found.</div>
    }

    const {
        first_name,
        last_name,
        email,
        phone_number,
        birthdate,
        joining_date,
        years_exp,
        employee_type,
        specialization,
        technologies,
        documents,
        price_range,
    } = employee

    const currencyCode = price_range?.currency_type?.name?.split(' - ')[0]

    return (
        <CContainer className="py-4">
            <CButton color="secondary" className="mb-4" onClick={() => navigate(-1)}>
                ← Back
            </CButton>

            <CCard className="shadow-sm border-0">
                <CCardHeader className="mb-3">
                    <h4 className="mb-0">Employee Profile</h4>
                </CCardHeader>

                <CCardBody className="fs-5 mx-3">
                    {/* Personal Info */}
                    <section className="mb-5">
                        <h5 className="mb-3">📌 Personal Information</h5>
                        <CRow className="gy-3">
                            <CCol md={6}><strong>Name:</strong> {first_name} {last_name}</CCol>
                            <CCol md={6}><strong>Email:</strong> {email}</CCol>
                            <CCol md={6}><strong>Phone:</strong> {phone_number}</CCol>
                            <CCol md={6}><strong>Birthdate:</strong> {birthdate}</CCol>
                            <CCol md={6}><strong>Joining Date:</strong> {joining_date}</CCol>
                            <CCol md={6}><strong>Years Experience:</strong> {years_exp}</CCol>
                        </CRow>
                    </section>
                    <hr />

                    {/* Work Info */}
                    <section className="mb-5">
                        <h5 className="mb-3">💼 Work Information</h5>
                        <CRow className="gy-3">
                            <CCol md={6}><strong>Employee Type:</strong> {employee_type?.name}</CCol>
                            <CCol md={6}><strong>Specialization:</strong> {specialization?.name}</CCol>
                        </CRow>
                    </section>
                    <hr />

                    {/* Technologies */}
                    <section className="mb-5">
                        <h5 className="mb-3">🛠 Technologies and Tools</h5>
                        <div className="d-flex flex-wrap gap-2">
                            {technologies?.map((tech) => (
                                <div key={tech.id} className="px-3 py-2 text-white">
                                    {tech.name}
                                </div>
                            ))}
                        </div>
                    </section>
                    <hr />

                    {/* Documents */}
                    <section className="mb-5">
                        <h5 className="mb-3">📄 Documents</h5>
                        <ul className="ps-3">
                            {documents?.map((doc) => (
                                <li key={doc.id} className="mb-1">
                                    <a
                                        href={`/${doc.url.replaceAll('\\', '/')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-decoration-none"
                                    >
                                        <FaFilePdf className="me-2 text-danger" />
                                        <span className="text-primary fw-semibold">{doc.doc_name}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                    <hr />

                    {/* Price Range */}
                    <section>
                        <h5 className="mb-3">💲 Price Range</h5>
                        <CCard className="border-0">
                            <CCardBody className="fs-6">
                                <CRow className="gy-2">
                                    <CCol md={6}>
                                        <strong>From - To:</strong> {price_range?.price_from} - {price_range?.price_to} {currencyCode}
                                    </CCol>
                                    <CCol md={6}>
                                        <strong>Rate Type:</strong> {price_range?.rate_type?.name}
                                    </CCol>
                                </CRow>
                            </CCardBody>
                        </CCard>
                    </section>
                </CCardBody>
            </CCard>
        </CContainer>
    )
}

export default EmployeeDetails
