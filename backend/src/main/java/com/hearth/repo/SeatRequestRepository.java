package com.hearth.repo;

import com.hearth.domain.SeatRequest;
import com.hearth.domain.SeatStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeatRequestRepository extends JpaRepository<SeatRequest, Long> {

    List<SeatRequest> findByStatusNotOrderByRequestedForAsc(SeatStatus status);
}
