package com.hearth.web.dto;

import com.hearth.domain.SeatRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class SeatDtos {

    private SeatDtos() {
    }

    public record CreateSeat(
            @NotBlank @Size(max = 80) String name,
            @NotNull @Min(1) @Max(20) Integer partySize,
            @NotNull LocalDateTime requestedFor
    ) {
    }

    public record SeatResponse(
            Long id,
            String name,
            int partySize,
            LocalDateTime requestedFor,
            String status,
            Long tableId,
            String tableNumber
    ) {
        public static SeatResponse from(SeatRequest request) {
            return new SeatResponse(
                    request.getId(),
                    request.getGuestName(),
                    request.getPartySize(),
                    request.getRequestedFor(),
                    request.getStatus().name(),
                    request.getTable() == null ? null : request.getTable().getId(),
                    request.getTable() == null ? null : request.getTable().getTableNumber());
        }
    }
}
