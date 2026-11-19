package com.hearth.web.dto;

import com.hearth.domain.MenuCategory;
import com.hearth.domain.MenuItem;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class MenuDtos {

    private MenuDtos() {
    }

    public record CategoryRequest(
            @NotBlank @Size(max = 80) String name,
            @Size(max = 255) String description
    ) {
    }

    public record CategoryResponse(Long id, String name, String description) {
        public static CategoryResponse from(MenuCategory category) {
            return new CategoryResponse(category.getId(), category.getName(), category.getDescription());
        }
    }

    public record ItemRequest(
            @NotNull Long categoryId,
            @NotBlank @Size(max = 120) String name,
            @Size(max = 2000) String description,
            @NotNull @DecimalMin(value = "0.01", message = "Price must be at least 0.01") BigDecimal price,
            @NotNull Boolean available
    ) {
    }

    public record ItemResponse(
            Long id,
            Long categoryId,
            String categoryName,
            String name,
            String description,
            BigDecimal price,
            boolean available,
            LocalDateTime createdAt
    ) {
        public static ItemResponse from(MenuItem item) {
            return new ItemResponse(
                    item.getId(),
                    item.getCategory().getId(),
                    item.getCategory().getName(),
                    item.getName(),
                    item.getDescription(),
                    item.getPrice(),
                    item.isAvailable(),
                    item.getCreatedAt());
        }
    }
}
