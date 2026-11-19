package com.hearth.web;

import com.hearth.service.SeatRequestService;
import com.hearth.web.dto.SeatDtos.CreateSeat;
import com.hearth.web.dto.SeatDtos.SeatResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/seat-requests")
public class SeatController {

    private final SeatRequestService seatRequestService;

    public SeatController(SeatRequestService seatRequestService) {
        this.seatRequestService = seatRequestService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SeatResponse create(@Valid @RequestBody CreateSeat request) {
        return seatRequestService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('TABLE_VIEW')")
    public List<SeatResponse> active() {
        return seatRequestService.active();
    }

    @PatchMapping("/{id}/reserve")
    @PreAuthorize("hasAuthority('TABLE_VIEW')")
    public SeatResponse reserve(@PathVariable Long id) {
        return seatRequestService.reserve(id);
    }

    @PatchMapping("/{id}/drop")
    @PreAuthorize("hasAuthority('TABLE_VIEW')")
    public SeatResponse drop(@PathVariable Long id) {
        return seatRequestService.drop(id);
    }
}
