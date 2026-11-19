package com.hearth.web.dto;

import com.hearth.domain.RestaurantTable;
import com.hearth.domain.TableStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class TableDtos {

    private TableDtos() {
    }

    public record TableRequest(
            @NotBlank @Size(max = 20) String tableNumber,
            @NotNull @Min(1) Integer capacity,
            TableStatus status
    ) {
    }

    public record StatusRequest(@NotNull TableStatus status) {
    }

    public record TableResponse(Long id, String tableNumber, int capacity, TableStatus status) {
        public static TableResponse from(RestaurantTable table) {
            return new TableResponse(table.getId(), table.getTableNumber(), table.getCapacity(), table.getStatus());
        }
    }
}
