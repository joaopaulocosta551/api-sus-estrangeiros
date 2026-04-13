package com.joaopaulo.sus.repository.specification

import com.joaopaulo.sus.entity.SusAttendance
import jakarta.persistence.criteria.Predicate
import org.springframework.data.jpa.domain.Specification

object AttendanceSpecification {
    fun buildFilter(
        year: Int?,
        month: Int?,
        country: String?,
        state: String?
    ): Specification<SusAttendance> {
        return Specification { root, _, criteriaBuilder ->
            val predicates = mutableListOf<Predicate>()

            year?.let {
                predicates.add(criteriaBuilder.equal(root.get<Int>("year"), it))
            }
            month?.let {
                predicates.add(criteriaBuilder.equal(root.get<Int>("month"), it))
            }
            country?.takeIf { it.isNotBlank() }?.let {
                predicates.add(criteriaBuilder.equal(root.get<String>("country"), it))
            }
            state?.takeIf { it.isNotBlank() }?.let {
                predicates.add(criteriaBuilder.equal(root.get<String>("state"), it))
            }

            criteriaBuilder.and(*predicates.toTypedArray())
        }
    }
}
