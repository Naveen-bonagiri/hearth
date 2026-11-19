package com.hearth.service;

import com.hearth.domain.OrderStatus;
import com.hearth.domain.RestaurantTable;
import com.hearth.domain.SeatRequest;
import com.hearth.domain.SeatStatus;
import com.hearth.domain.TableStatus;
import com.hearth.error.ApiException;
import com.hearth.repo.OrderRepository;
import com.hearth.repo.SeatRequestRepository;
import com.hearth.repo.TableRepository;
import com.hearth.web.dto.SeatDtos.CreateSeat;
import com.hearth.web.dto.SeatDtos.SeatResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class SeatRequestService {

    private static final List<OrderStatus> CLOSED = List.of(OrderStatus.SERVED, OrderStatus.CANCELLED);

    private final SeatRequestRepository seatRequestRepository;
    private final TableRepository tableRepository;
    private final OrderRepository orderRepository;

    public SeatRequestService(
            SeatRequestRepository seatRequestRepository,
            TableRepository tableRepository,
            OrderRepository orderRepository
    ) {
        this.seatRequestRepository = seatRequestRepository;
        this.tableRepository = tableRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public SeatResponse create(CreateSeat request) {
        SeatRequest seat = new SeatRequest();
        seat.setGuestName(request.name().trim());
        seat.setPartySize(request.partySize());
        seat.setRequestedFor(request.requestedFor());
        seat.setStatus(SeatStatus.REQUESTED);
        return SeatResponse.from(seatRequestRepository.save(seat));
    }

    @Transactional(readOnly = true)
    public List<SeatResponse> active() {
        return seatRequestRepository.findByStatusNotOrderByRequestedForAsc(SeatStatus.DROPPED).stream()
                .map(SeatResponse::from)
                .toList();
    }

    @Transactional
    public SeatResponse reserve(Long id) {
        SeatRequest seat = load(id);
        if (seat.getStatus() == SeatStatus.DROPPED) {
            throw new ApiException(409, "That request was already dropped.");
        }
        if (seat.getTable() == null) {
            tableRepository.findAll().stream()
                    .filter(table -> table.getStatus() == TableStatus.AVAILABLE && table.getCapacity() >= seat.getPartySize())
                    .min(Comparator.comparingInt(RestaurantTable::getCapacity))
                    .ifPresent(seat::setTable);
        }
        if (seat.getTable() == null) {
            throw new ApiException(409, "No open table fits this party.");
        }
        if (seat.getTable().getStatus() == TableStatus.AVAILABLE) {
            seat.getTable().setStatus(TableStatus.RESERVED);
        }
        seat.setStatus(SeatStatus.RESERVED);
        return SeatResponse.from(seat);
    }

    @Transactional
    public SeatResponse drop(Long id) {
        SeatRequest seat = load(id);
        RestaurantTable table = seat.getTable();
        if (table != null && table.getStatus() == TableStatus.RESERVED && !hasOpenOrder(table.getId())) {
            table.setStatus(TableStatus.AVAILABLE);
        }
        seat.setTable(null);
        seat.setStatus(SeatStatus.DROPPED);
        return SeatResponse.from(seat);
    }

    private boolean hasOpenOrder(Long tableId) {
        return orderRepository.existsByTable_IdAndStatusNotIn(tableId, CLOSED);
    }

    private SeatRequest load(Long id) {
        return seatRequestRepository.findById(id)
                .orElseThrow(() -> new ApiException(404, "That table request does not exist."));
    }
}
