package com.joaopaulo.sus.entity

import jakarta.persistence.*

@Entity
@Table(name = "attendances")
class SusAttendance(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "attendance_year")
    var year: Int = 0,
    @Column(name = "attendance_month")
    var month: Int = 0,
    var country: String = "",
    var state: String = "",
    var quantity: Int = 0
)
