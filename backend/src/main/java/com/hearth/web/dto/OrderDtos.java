package com.hearth.web.dto;

import com.hearth.domain.Order;
import com.hearth.domain.OrderItem;
import com.hearth.domain.OrderStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class OrderDtos {

    private OrderDtos() {
    }

    public record LineRequest(
            @NotNull Long menuItemId,
            @NotNull @Min(1) Integer quantity
    ) {
    }

    public record CreateOrderRequest(
            @NotNull Long tableId,
            @NotEmpty @Valid List<LineRequest> items
    ) {
    }

    public record UpdateOrderRequest(
            @NotEmpty @Valid List<LineRequest> items
    ) {
    }

    public record StatusRequest(@NotNull OrderStatus status) {
    }

    public record ItemResponse(
            Long id,
            Long menuItemId,
            String menuItemName,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal subtotal
    ) {
        public static ItemResponse from(OrderItem item) {
            return new ItemResponse(
                    item.getId(),
                    item.getMenuItem().getId(),
                    item.getMenuItem().getName(),
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.getSubtotal());
        }
    }

    public record OrderResponse(
            Long id,
            Long userId,
            String username,
            Long tableId,
            String tableNumber,
            BigDecimal totalAmount,
            OrderStatus status,
            LocalDateTime orderedAt,
            List<ItemResponse> items
    ) {
        public static OrderResponse from(Order order) {
            return new OrderResponse(
                    order.getId(),
                    order.getUser().getId(),
                    order.getUser().getUsername(),
                    order.getTable().getId(),
                    order.getTable().getTableNumber(),
                    order.getTotalAmount(),
                    order.getStatus(),
                    order.getOrderedAt(),
                    order.getItems().stream().map(ItemResponse::from).toList());
        }
    }
}
