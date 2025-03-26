import React from 'react';
import { CPagination, CPaginationItem } from '@coreui/react';

const Pagination = ({ currentPage, totalPages, onPageChange, className = null}) => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <CPagination className={className} aria-label="Page navigation example">
            <CPaginationItem

                aria-label="Previous"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                &laquo;
            </CPaginationItem>
            {pageNumbers.map((number) => (
                <CPaginationItem
                    key={number}
                    active={number === currentPage}
                    onClick={() => onPageChange(number)}
                >
                    {number}
                </CPaginationItem>
            ))}
            <CPaginationItem
                aria-label="Next"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                &raquo;
            </CPaginationItem>
        </CPagination>
    );
};

export default Pagination;
